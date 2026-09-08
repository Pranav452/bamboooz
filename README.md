# Spend

A mobile-first expense tracker built from the Expense Tracker design: Next.js App Router,
Neon Postgres, Neon Auth, installable on iPhone via Add to Home Screen, plus an Apple
Shortcut for one-tap entry.

## Screens

| Route | What it does |
|---|---|
| `/` | Balance, income/expense/saved, budget alert, spend by category, recent transactions |
| `/insights` | Month stats, spending trend, category breakdown, budget vs actual, budget editor |
| `/add` | Keypad entry, expense or income, category chips, merchant and note |
| `/cards` | Card list, freeze/unfreeze, set default, add card |
| `/profile` | Profile, Face ID / push / hide-balance toggles, sign out |
| `/transactions` | Month browser with All / Expenses / Income / Transfers filters |
| `/tx/[id]` | Transaction detail, receipt lines, merchant info, similar transactions, delete |
| `/overview` | 6-month expense trend, category split bar, recent activity |
| `/send`, `/send/sent` | Send money from a card to a recipient, then the receipt screen |
| `/notifications` | Alerts with unread badges, mark all read |
| `/search` | Search across merchant, note and category |
| `/auth/sign-in`, `/auth/sign-up` | Neon Auth email/password and Google |

## Setup

    npm install
    cp .env.local.example .env.local     # fill in the values below
    psql "$DATABASE_URL" -f db/schema.sql
    npm run dev

### Environment

| Variable | Where it comes from |
|---|---|
| `DATABASE_URL` | Neon Console, connection string |
| `NEON_AUTH_BASE_URL` | Neon Console, your project, Auth. Leave blank to run in demo mode |
| `NEON_AUTH_COOKIE_SECRET` | Any random string, 32+ characters |
| `API_KEY` | Any long random string. The Shortcut sends it as `x-api-key` |
| `SHORTCUT_USER_ID` | The Neon Auth user id the Shortcut writes to |

**Demo mode.** With `NEON_AUTH_BASE_URL` blank the app skips sign-in and uses a single
local user, so you can click through everything before provisioning auth. Setting the
variable turns on real accounts and route protection with no other code changes.

## Deploy

    npm i -g vercel && vercel

Add the same environment variables in the Vercel project settings, then redeploy.
On the phone: open the URL in Safari, Share, Add to Home Screen.

## Apple Shortcut

Generate one pointed at your deployment:

    python3 shortcut/build_shortcut.py \
      --url https://your-app.vercel.app \
      --key YOUR_API_KEY \
      --out "Add to Spend.shortcut"

AirDrop or email the file to the phone. Because it is unsigned, turn on
Settings, Shortcuts, Allow Untrusted Shortcuts first (run any shortcut once to
reveal that switch).

Prefer building it by hand? Four actions:

1. **Ask for Input** — Number, prompt "Amount"
2. **Choose from Menu** — one item per category, each branch a **Text** action with that name
3. **Ask for Input** — Text, prompt "Note"
4. **Get Contents of URL** — `https://your-app.vercel.app/api/tx`, POST,
   header `x-api-key: YOUR_API_KEY`, JSON body `amount`, `category`, `note`

## API

    POST /api/tx      header x-api-key
    { "amount": 250, "category": "Snacks", "note": "", "merchant": "", "kind": "expense", "date": "2026-09-08" }

    GET  /api/tx      header x-api-key      -> the valid category list

`kind` is `expense` or `income` and defaults to expense. `date` defaults to now.
Errors come back as `{"status":"error","message":"..."}` with a 4xx code, so the
Shortcut can show what actually went wrong.

## Schema

`db/schema.sql`. Twelve tables: `app_users`, `categories`, `cards`, `merchants`,
`transactions`, `receipts`, `receipt_items`, `budgets`, `subscriptions`, `recipients`,
`transfers`, `notifications`. Every row is scoped by `user_id` and cascades on delete.
`transactions.amount` is signed: negative is an expense, positive is income.

To clear the demo data:

    psql "$DATABASE_URL" -c "DELETE FROM app_users WHERE id = 'demo-user';"
