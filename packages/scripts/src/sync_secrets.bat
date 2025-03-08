@echo off
setlocal enabledelayedexpansion

REM ------------------------------------------------------------------------------
REM Usage: sync_secrets.bat <stage>
REM   <stage> is required (e.g., "dev", "prod")
REM ------------------------------------------------------------------------------

if "%~1"=="" (
    echo Usage: %~0 <stage>
    exit /b 1
)
set "STAGE=%~1"

REM 1. Get the full directory of this script (without trailing backslash).
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM 2. Extract everything up to "lumi" in %SCRIPT_DIR%.
call :FindBaseDir "%SCRIPT_DIR%" BASE_DIR
if "%BASE_DIR%"=="" (
    echo [ERROR] Could not find 'lumi' in path: %SCRIPT_DIR%
    exit /b 1
)
REM Ensure a trailing backslash
set "BASE_DIR=%BASE_DIR%\"

REM 3. Locate the .env file named "<stage>.secrets.env" under %BASE_DIR%.
del foundfiles.txt 2>nul
for /r "%BASE_DIR%" %%F in (%STAGE%.secrets.env) do (
    echo %%F >> foundfiles.txt
)

REM Count how many matches we have.
set "FOUND_COUNT=0"
for /f "delims=" %%C in ('type foundfiles.txt ^| find /v /c ""') do set "FOUND_COUNT=%%C"

if "%FOUND_COUNT%"=="0" (
    echo [ERROR] No .env file named '%STAGE%.secrets.env' found in 'lumi'
    exit /b 1
) else if "%FOUND_COUNT%"=="1" (
    for /f "delims=" %%G in (foundfiles.txt) do set "ENV_FILE=%%G"
    echo [INFO] Using .env file: %ENV_FILE%
) else (
    echo [ERROR] Multiple .env files found for '%STAGE%' in 'lumi':
    type foundfiles.txt
    exit /b 1
)

REM 4. Parse the .env file into envMap.txt (Key=Value lines, Key in PascalCase).
del envMap.txt 2>nul
for /f "usebackq delims=" %%A in ("%ENV_FILE%") do (
    if "%%A"=="" (
        REM Skip blank lines
    ) else (
        echo %%A | find "=" >nul
        if errorlevel 1 (
            REM Skip lines without '='
        ) else (
            call :ParseKeyValue "%%A" K V
            call :ToPascalCase "!K!" PASCAL
            echo !PASCAL!=!V! >> envMap.txt
        )
    )
)

REM 5. Retrieve secrets from SST into sstMap.txt
del sstMap.txt 2>nul
for /f "delims=" %%A in ('bunx sst secret list --stage %STAGE%') do (
    if "%%A"=="" (
        REM skip blank lines
    ) else (
        echo %%A | find "=" >nul
        if errorlevel 1 (
            REM skip lines without '='
        ) else (
            echo %%A >> sstMap.txt
        )
    )
)

REM 6. Build keysToUpdate (in envMap but not in sstMap) and keysToRemove (in sstMap but not in envMap).
del keysToUpdate.txt 2>nul
del keysToRemove.txt 2>nul

REM 6a. For each pair in envMap, if not found in sstMap, we add to keysToUpdate.
for /f "usebackq delims=" %%A in ("envMap.txt") do (
    call :ParseKeyValue "%%A" ENVK ENVV
    set "FOUND=0"
    for /f "usebackq delims=" %%B in ("sstMap.txt") do (
        call :ParseKeyValue "%%B" SSTK SSTV
        if /i "!SSTK!"=="!ENVK!" (
            set "FOUND=1"
        )
    )
    if "!FOUND!"=="0" (
        echo %%A >> keysToUpdate.txt
    )
)

REM 6b. For each pair in sstMap, if not found in envMap, we add to keysToRemove.
for /f "usebackq delims=" %%A in ("sstMap.txt") do (
    call :ParseKeyValue "%%A" SSTK SSTV
    set "FOUND=0"
    for /f "usebackq delims=" %%B in ("envMap.txt") do (
        call :ParseKeyValue "%%B" ENVK ENVV
        if /i "!ENVK!"=="!SSTK!" (
            set "FOUND=1"
        )
    )
    if "!FOUND!"=="0" (
        echo %%A >> keysToRemove.txt
    )
)

REM 7. Check if these lists are empty
set "REMOVE_COUNT=0"
if exist keysToRemove.txt (
    for /f %%C in ('type keysToRemove.txt ^| find /v /c ""') do set "REMOVE_COUNT=%%C"
)
set "UPDATE_COUNT=0"
if exist keysToUpdate.txt (
    for /f %%C in ('type keysToUpdate.txt ^| find /v /c ""') do set "UPDATE_COUNT=%%C"
)

if "%REMOVE_COUNT%"=="0" echo [INFO] No secrets to remove.
if "%UPDATE_COUNT%"=="0" echo [INFO] No secrets to update.

REM 8. Remove keys
if exist keysToRemove.txt (
    for /f "usebackq delims=" %%A in ("keysToRemove.txt") do (
        call :ParseKeyValue "%%A" K V
        echo [INFO] Removing secret: !K!
        bunx sst secret remove !K! --stage %STAGE%
    )
)

REM 9. Update keys
if exist keysToUpdate.txt (
    for /f "usebackq delims=" %%A in ("keysToUpdate.txt") do (
        call :ParseKeyValue "%%A" K V
        echo [INFO] Setting secret: !K!=!V!
        bunx sst secret set !K! !V! --stage %STAGE%
    )
)

echo [INFO] Sync completed.
exit /b 0

REM ------------------------------------------------------------------------------
REM :FindBaseDir
REM   Extracts everything up to "lumi" from the given path.
REM   Usage: call :FindBaseDir "C:\my\lumi\sub\folder" OUTVAR
REM ------------------------------------------------------------------------------
:FindBaseDir
set "INPUT=%~1"
set "OUTVAR=%2"

set "RESULT="
REM We'll split on "lumi" and keep the left side + that substring.
for /f "tokens=1* delims=|" %%I in ('echo %INPUT:\=|% ^| findstr /i /r ".*lumi.*"') do (
    REM This is a naive approach: we locate the substring and reconstruct the path.
    REM We'll do a substring search with a for loop or set.
)

REM Simpler approach: we can do a substring search with :str in string
set "FINDSTR=lumi"
call set "POS=%%INPUT:%FINDSTR%=%%"
if "%POS%"=="%INPUT%" (
    REM not found
    set "%OUTVAR%="
    goto :eof
)

REM We found the substring. We'll do manual trimming.
REM We'll do a small trick: we'll store the length up to the substring match.
setlocal enabledelayedexpansion
set "FULL=%INPUT%"
set "SUB=%FINDSTR%"
set /a i=0
set /a sublen=0
set /a len=0

:__calc_len
if "!FULL:~%len%,1!"=="" goto __calc_substr
set /a len+=1
goto __calc_len

:__calc_substr
REM We'll find the index of the substring
for /l %%Z in (0,1,!len!) do (
    if "!FULL:~%%Z,%sublen%!"=="" goto __done_sub_search
    set /a sublen=0
    :__subloop
    if "!FULL:~%%Z,1!"=="" goto __done_sub_search
    if "!FULL:~%%Z,%sublen%!"=="%SUB%" (
        set /a i=%%Z
        goto __done_sub_search
    )
    set /a sublen+=1
    if "!FULL:~%%Z,%sublen%!"=="" goto __subloop_end
    if "!FULL:~%%Z,%sublen%!"=="%SUB%" (
        set /a i=%%Z
        goto __done_sub_search
    )
    goto __subloop
    :__subloop_end
)

:__done_sub_search

REM Now i is the index of lumi
set /a end=i+19
REM "lumi" has 20 characters, but indexing is zero-based
set "RESULT=!FULL:~0,%end%!"
endlocal & set "%OUTVAR%=%RESULT%"
goto :eof

REM ------------------------------------------------------------------------------
REM :ParseKeyValue
REM   Splits "KEY=VALUE" into separate variables
REM   Usage: call :ParseKeyValue "KEY=VALUE" outKeyVar outValVar
REM ------------------------------------------------------------------------------
:ParseKeyValue
setlocal
set "LINE=%~1"
set "OUTKEY=%2"
set "OUTVAL=%3"

for /f "tokens=1* delims==" %%I in ("%LINE%") do (
    endlocal
    set "%~2