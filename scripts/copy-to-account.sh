#!/bin/bash
# Copy every transaction from one account to another.
#   ./scripts/copy-to-account.sh from@email.com to@email.com
set -e
cd "$(dirname "$0")/.."
[ -z "$2" ] && { echo "usage: ./scripts/copy-to-account.sh from@email to@email"; exit 1; }
DB=$(grep '^DATABASE_URL' .env | cut -d'"' -f2)

SRC=$(psql "$DB" -t -A -c "SELECT id FROM app_users WHERE email='$1'")
DST=$(psql "$DB" -t -A -c "SELECT id FROM app_users WHERE email='$2'")
[ -z "$SRC" ] && { echo "No account for $1"; exit 1; }
[ -z "$DST" ] && { echo "No account for $2 — sign up with it in the app first."; exit 1; }

psql "$DB" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO transactions (user_id, amount, kind, category_id, note, tag, occurred_at, source, external_ref)
SELECT '$DST', t.amount, t.kind,
       (SELECT c2.id FROM categories c1 JOIN categories c2 ON c2.name = c1.name
        WHERE c1.id = t.category_id AND c2.user_id = '$DST'),
       t.note, t.tag, t.occurred_at, t.source, t.external_ref
FROM transactions t
WHERE t.user_id = '$SRC'
ON CONFLICT (user_id, external_ref) WHERE external_ref IS NOT NULL DO NOTHING;
SQL
echo "Copied. $2 now has $(psql "$DB" -t -A -c "SELECT count(*) FROM transactions WHERE user_id='$DST'") transactions."
