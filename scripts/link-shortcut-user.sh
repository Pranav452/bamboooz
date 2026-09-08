#!/bin/bash
# After you sign up in the app, run this to point the iPhone Shortcut at your
# real account (and optionally move the demo data across).
#
#   ./scripts/link-shortcut-user.sh you@email.com
set -e
cd "$(dirname "$0")/.."
[ -z "$1" ] && { echo "usage: ./scripts/link-shortcut-user.sh you@email.com"; exit 1; }
DB=$(grep '^DATABASE_URL' .env | cut -d'"' -f2)

USER_ID=$(psql "$DB" -t -A -c "SELECT id FROM app_users WHERE email='$1'")
[ -z "$USER_ID" ] && { echo "No account for $1 — sign up in the app first."; exit 1; }

python3 - "$USER_ID" <<'PY'
import sys, re
uid = sys.argv[1]
s = open('.env').read()
s = re.sub(r'^SHORTCUT_USER_ID=.*$', f'SHORTCUT_USER_ID="{uid}"', s, flags=re.M)
open('.env','w').write(s)
PY
echo "SHORTCUT_USER_ID set to $USER_ID"
echo
read -r -p "Move the demo transactions to this account? [y/N] " yn
if [ "$yn" = "y" ]; then
  psql "$DB" -q <<SQL
UPDATE transactions t SET user_id='$USER_ID',
  category_id=(SELECT c2.id FROM categories c1 JOIN categories c2 ON c2.name=c1.name
               WHERE c1.id=t.category_id AND c2.user_id='$USER_ID')
WHERE t.user_id='demo-user';
DELETE FROM app_users WHERE id='demo-user';
SQL
  echo "Demo data moved, demo user removed."
else
  echo "Left the demo data alone."
fi
