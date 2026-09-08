#!/bin/bash
# Signs the shortcut so iOS will accept it, then reveals it in Finder.
# Requires iCloud Drive to be ON (System Settings > your name > iCloud > iCloud Drive).
set -e
cd "$(dirname "$0")/.."

IN="$HOME/Desktop/Add to Spend.shortcut"
OUT="$HOME/Desktop/Spend.shortcut"

[ -f "$IN" ] || { echo "Building the unsigned file first…"; ./shortcut/make.sh https://bamboooz.vercel.app; }

if [ ! -d "$HOME/Library/Mobile Documents/com~apple~CloudDocs" ]; then
  echo "iCloud Drive is OFF — signing will fail."
  echo "Turn it on: System Settings > your name > iCloud > iCloud Drive, then re-run this."
  exit 1
fi

rm -f "$OUT"
shortcuts sign --mode anyone --input "$IN" --output "$OUT" 2>&1 | grep -v "Unrecognized attribute" || true

if [ -f "$OUT" ]; then
  echo "Signed: $OUT"
  open -R "$OUT"
  echo "AirDrop it to your iPhone, or double-click to add it here and let iCloud sync it over."
else
  echo "Signing still failed. Build it by hand on the phone instead — see README."
  exit 1
fi
