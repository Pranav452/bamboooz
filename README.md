# Spend

Mobile-first expense tracker. Next.js + Neon Postgres. Installable on iPhone via "Add to Home Screen".

## Run locally
    npm install
    cp .env.local.example .env.local   # fill DATABASE_URL and API_KEY
    npm run dev

## Deploy (Vercel)
    npm i -g vercel
    vercel
Then in Vercel > Project > Settings > Environment Variables add DATABASE_URL and API_KEY, redeploy.

## iPhone
Open the deployed URL in Safari > Share > Add to Home Screen.

## API (for the Shortcut)
    POST /api/expenses
    Header: x-api-key: <API_KEY>
    Body: {"amount": 120, "category": "Lunch", "remarks": "optional", "date": "2026-09-07" (optional)}
Categories: Snacks, Cigarettes, Breakfast, Lunch, Outing with friends, Transportation, Shopping, Date, Others
