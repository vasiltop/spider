#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

ENV_FILE="$ROOT_DIR/.env"
EXAMPLE_FILE="$ROOT_DIR/.env.example"

if [ ! -f "$ENV_FILE" ] || [ ! -f "$EXAMPLE_FILE" ]; then
    echo "❌ Error: Either .env or .env.example is missing from $ROOT_DIR"
    exit 1
fi

awk '
BEGIN {
    FS="="
    bad=0
}

/^[[:space:]]*#/ || /^[[:space:]]*$/ {
    next
}

{
    key=$1

    sub(/\r$/, "", key)
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", key)
    sub(/^export[[:space:]]+/, "", key)

    if (NR == FNR) {
        example[key]=1
    } else {
        env[key]=1
    }
}

END {
    for (key in env) {
        if (!(key in example)) {
            print "❌ Key \"" key "\" has a discrepancy"
            bad=1
        }
    }

    for (key in example) {
        if (!(key in env)) {
            print "❌ Key \"" key "\" has a discrepancy"
            bad=1
        }
    }

    if (bad) {
        exit 1
    }

    print "✨ Environment files are perfectly in sync!"
}
' "$EXAMPLE_FILE" "$ENV_FILE"
