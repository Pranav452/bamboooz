#!/bin/bash
# Build the iPhone Shortcut for your deployment.
# Reads API_KEY from .env so no secret is ever committed.
#
#   ./shortcut/make.sh https://your-app.vercel.app
set -e
cd "$(dirname "$0")/.."
[ -z "$1" ] && { echo "usage: ./shortcut/make.sh https://your-app.vercel.app"; exit 1; }
[ -f .env ] || { echo "No .env found in $(pwd)"; exit 1; }

KEY=$(grep '^API_KEY' .env | cut -d'"' -f2)
[ -z "$KEY" ] && { echo "API_KEY is not set in .env"; exit 1; }

python3 shortcut/build_shortcut.py \
  --url "$1" \
  --key "$KEY" \
  --out "$HOME/Desktop/Add to Spend.shortcut"

echo "Saved to ~/Desktop/Add to Spend.shortcut — AirDrop it to your iPhone."
