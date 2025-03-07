#!/usr/bin/env bash
#
# Usage: ./sync_secrets.sh <stage>
#   <stage> is required (e.g., "dev", "prod")


################################################################################
# Convert an uppercase/underscore key (e.g. MY_KEY) to PascalCase (MyKey).
# Usage: to_pascal_case "MY_KEY" => "MyKey"
################################################################################
to_pascal_case() {
  local input="$1"
  local result=""
  local part
  IFS="_" read -ra parts <<< "$input"
  for part in "${parts[@]}"; do
    local first_letter rest
    first_letter=$(echo "${part:0:1}" | tr '[:lower:]' '[:upper:]')
    rest=$(echo "${part:1}" | tr '[:upper:]' '[:lower:]')
    result="${result}${first_letter}${rest}"
  done
  echo "$result"
}

################################################################################
# Main script logic
################################################################################

# 1. Check usage
if [ $# -lt 1 ]; then
  echo "Usage: $0 <stage>"
  exit 1
fi

stage="$1"

# 2. Get the full directory of this script
scriptDir="$(cd "$(dirname "$0")" && pwd)"

# Extract everything up to "personal-portfolio-3" (and ensure a trailing slash)
baseDir="$(echo "$scriptDir" | sed -E 's|(.*personal-portfolio-3).*|\1|')"
baseDir="${baseDir}/"

# Locate the .env file named "<stage>.secrets.env" within personal-portfolio-3
foundFiles="$(find "$baseDir" -type f -name "$stage.secrets.env")"

# Count how many matches we found
foundCount="$(echo "$foundFiles" | wc -l | tr -d '[:space:]')"

if [ "$foundCount" -eq 0 ]; then
  echo "[ERROR] No .env file named '$stage.secrets.env' found in 'personal-portfolio-3'"
  exit 1
fi

if [ "$foundCount" -gt 1 ]; then
  echo "[ERROR] Multiple .env files found for '$stage' in 'personal-portfolio-3':"
  echo "$foundFiles"
  exit 1
fi

# Use the single matching file
ENV_FILE="$foundFiles"
echo "[INFO] Using .env file: $ENV_FILE"

# We'll store our "maps" as arrays of "Key=Value" strings
declare -a envMap=()

# Check if file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "[ERROR] .env file not found at $ENV_FILE"
  exit 1
fi

# Check if file has content (non-zero size)
if [ ! -s "$ENV_FILE" ]; then
  echo "[ERROR] .env file is empty at $ENV_FILE"
  exit 1
fi

echo "[INFO] Reading from: $ENV_FILE"
ENV_FILE_CONTENT=$(cat "$ENV_FILE")

# 2a. Proceed with the while-read loop
for line in $ENV_FILE_CONTENT; do
  # echo "[DEBUG] Line: $line"

  # Skip blank lines
  [ -z "$line" ] && continue

  # Skip lines without '='
  case "$line" in
    *=*) ;;
    *) continue ;;
  esac

  # Split into KEY and VALUE
  key="${line%%=*}"
  value="${line#*=}"

  # Convert KEY to PascalCase (assuming you have a function called to_pascal_case)
  pascalKey="$(to_pascal_case "$key")"

  # Append "PascalKey=Value" to envMap array
  envMap+=("$pascalKey=$value")
done


# Print the parsed envMap
# echo "[DEBUG] Parsed .env file:"
# for pair in "${envMap[@]}"; do
#   echo "  $pair"
# done

# 3. Run `sst secret list --stage <stage>` and parse similarly
sstOutput="$(bunx sst secret list --stage "$stage")"
declare -a sstMap=()

for line in $sstOutput; do
  [ -z "$line" ] && continue
  case "$line" in
    *=*) ;;
    *) continue ;;
  esac

  key="${line%%=*}"
  value="${line#*=}"

  # Store "Key=Value" (no PascalCase conversion here, adjust if needed)
  sstMap+=("$key=$value")
done

# 4. Create arrays for keys to remove and keys to update
declare -a keysToRemove=()
declare -a keysToUpdate=()

# 5. For each mapping in envMap, decide if we need to update
for pair in "${envMap[@]}"; do
  k="${pair%%=*}"
  v="${pair#*=}"

  # Check if k is in sstMap
  found=0
  for ePair in "${sstMap[@]}"; do
    eK="${ePair%%=*}"
    if [ "$eK" = "$k" ]; then
      found=1
      break
    fi
  done

  # If key is not found in sstMap, we plan to update it
  if [ "$found" -ne 1 ]; then
    keysToUpdate+=("$k=$v")
  fi
done

# 6. For each mapping in sstMap, if the key doesn't exist in envMap, mark it for removal
for pair in "${sstMap[@]}"; do
  k="${pair%%=*}"
  v="${pair#*=}"

  found=0
  for ePair in "${envMap[@]}"; do
    eK="${ePair%%=*}"
    if [ "$eK" = "$k" ]; then
      found=1
      break
    fi
  done

  if [ "$found" -ne 1 ]; then
    keysToRemove+=("$k=$v")
  fi
done

# If keysToRemove is empty, print a message
if [ ${#keysToRemove[@]} -eq 0 ]; then
  echo "[INFO] No secrets to remove."
fi

# If keysToUpdate is empty, print a message
if [ ${#keysToUpdate[@]} -eq 0 ]; then
  echo "[INFO] No secrets to update."
fi

# 7. For each entry in keysToRemove, run `sst secret remove <key> --stage <stage>`
for pair in "${keysToRemove[@]}"; do
  k="${pair%%=*}"
  echo "[INFO] Removing secret: $k"
  bunx sst secret remove "$k" --stage "$stage"
done

# 8. For each entry in keysToUpdate, run `sst secret set <key> <value> --stage <stage>`
for pair in "${keysToUpdate[@]}"; do
  k="${pair%%=*}"
  v="${pair#*=}"
  echo "[INFO] Setting secret: $k=$v"
  bunx sst secret set "$k" "$v" --stage "$stage"
done

echo "[INFO] Sync completed."