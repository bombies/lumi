#!/usr/bin/env fish
#
# Usage: ./sync_secrets.fish <stage>
#   <stage> is required (e.g., "dev", "prod")

################################################################################
# Convert an uppercase/underscore key (e.g. MY_KEY) to PascalCase (MyKey).
# Usage: to_pascal_case "MY_KEY" => "MyKey"
################################################################################
function to_pascal_case
    set input $argv[1]
    set parts (string split "_" $input)
    set result ""

    for part in $parts
        # Uppercase the first letter, lowercase the rest
        set first_letter (string sub -l 1 $part | tr '[:lower:]' '[:upper:]')
        set rest (string sub -s 2 $part | tr '[:upper:]' '[:lower:]')
        set result "$result$first_letter$rest"
    end

    echo $result
end

################################################################################
# Main script logic
################################################################################

# 1. Check usage
if test (count $argv) -lt 1
    echo "Usage: (basename (status filename)) <stage>"
    exit 1
end

set stage $argv[1]

# Get the full directory of this script
set scriptDir (cd (dirname (status filename)) ; pwd)

# Use string match with a regex that captures everything up to "personal-portfolio-3"
# The '.*personal-portfolio-3' pattern means: "match any characters, then 'personal-portfolio-3' at the end"
# If you want to ensure a trailing slash, just append it afterward
set baseDir (string match -r '.*personal-portfolio-3' $scriptDir)

# If needed, add a trailing slash
set baseDir "$baseDir/"

# 2. Path to .env file
set foundFiles (find "$baseDir" -type f -name "$stage.secrets.env")

# Handle zero or multiple matches
if test (count $foundFiles) -eq 0
    echo "[ERROR] No .env file named '$stage.secrets.env' found in 'personal-portfolio-3'"
    exit 1
end

if test (count $foundFiles) -gt 1
    echo "[ERROR] Multiple .env files found for '$stage' in 'personal-portfolio-3':"
    echo $foundFiles
    exit 1
end

# Use the single matching file
set ENV_FILE $foundFiles[1]
echo "[INFO] Using .env file: $ENV_FILE"

# We'll store our "maps" as arrays of "Key=Value" strings
set envMap

# 2a. Read the .env file line by line
cat $ENV_FILE | while read -l line
    # echo "[DEBUG] Processing line: $line"
    # Skip blank lines
    if test -z "$line"
        continue
    end

    # Skip lines without '='
    if not string match -q "*=*" $line
        continue
    end

    # echo "[DEBUG] Line is a valid key-value pair"

    # Split into KEY and VALUE (one split, so only the first '=' matters)
    set key (string split -m 1 "=" $line | head -n 1)
    set value (string split -m 1 "=" $line | tail -n 1)

    # Convert KEY to PascalCase
    set pascalKey (to_pascal_case $key)

    # Append "PascalKey=Value" to envMap
    set envMap $envMap "$pascalKey=$value"
end

# Print all the variables that will be updated
# echo "[INFO] Variables to update:"
# for pair in $envMap
#     echo $pair
# end

# 3. Run `sst secret list --stage <stage>` and parse similarly
set sstOutput (bunx sst secret list --stage $stage)
set sstMap

for line in $sstOutput
    # Skip blank lines
    if test -z "$line"
        continue
    end

    # Skip lines without '='
    if not string match -q "*=*" $line
        continue
    end

    set key (string split -m 1 "=" $line | head -n 1)
    set value (string split -m 1 "=" $line | tail -n 1)

    # Append "PascalKey=Value" to sstMap
    set sstMap $sstMap "$key=$value"
end

# 4. Create lists for keys to remove and keys to update
set keysToRemove
set keysToUpdate

# 5. For each mapping in envMap, add to keysToUpdate
for pair in $envMap
    set k (string split -m 1 "=" $pair | head -n 1)
    set v (string split -m 1 "=" $pair | tail -n 1)

    # Check if k is in sstMap
    set found 0
    for ePair in $sstMap
        set eK (string split -m 1 "=" $ePair | head -n 1)
        if test "$eK" = "$k"
            set found 1
            break
        end
    end

    if not test $found -eq 1
        set keysToUpdate $keysToUpdate "$k=$v"
    end
end


# 6. For each mapping in sstMap, if the key also exists in envMap, mark it for removal
for pair in $sstMap
    set k (string split -m 1 "=" $pair | head -n 1)
    set v (string split -m 1 "=" $pair | tail -n 1)

    # Check if k is in envMap
    set found 0
    for ePair in $envMap
        set eK (string split -m 1 "=" $ePair | head -n 1)
        if test "$eK" = "$k"
            set found 1
            break
        end
    end

    if not test $found -eq 1
        set keysToRemove $keysToRemove "$k=$v"
    end
end

# If keysToRemove is empty, print a message
if test (count $keysToRemove) -eq 0
    echo "[INFO] No secrets to remove."
end

# If keysToUpdate is empty, print a message
if test (count $keysToUpdate) -eq 0
    echo "[INFO] No secrets to update."
end

# 7. For each entry in keysToRemove, run `sst secret remove <key> --stage <stage>`
for pair in $keysToRemove
    set k (string split -m 1 "=" $pair | head -n 1)
    echo "[INFO] Removing secret: $k"
    bunx sst secret remove $k --stage $stage
end

# 8. For each entry in keysToUpdate, run `sst secret set <key> <value> --stage <stage>`
for pair in $keysToUpdate
    set k (string split -m 1 "=" $pair | head -n 1)
    set v (string split -m 1 "=" $pair | tail -n 1)
    echo "[INFO] Setting secret: $k=$v"
    bunx sst secret set $k $v --stage $stage
end



echo "[INFO] Sync completed."