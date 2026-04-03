#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$DIR/src"
DIST="$DIR/dist"

mkdir -p "$DIST"

python3 "$DIR/build.py"

SIZE=$(wc -c < "$DIST/index.html" | tr -d ' ')
echo "Built: $DIST/index.html ($SIZE bytes, $(echo "scale=1; $SIZE/1024/1024" | bc)MB)"
