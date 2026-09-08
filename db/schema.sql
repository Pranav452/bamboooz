-- ============================================================
-- Expense Tracker — full schema
-- Auth: Neon Auth (Better Auth) syncs users into the neon_auth schema.
-- app_users mirrors the auth user id so our tables can foreign-key it.
-- Money: amount is SIGNED. negative = expense, positive = income.
-- ============================================================

CREATE TABLE IF NOT EXISTS app_users (
  id           text PRIMARY KEY,                       -- Neon Auth user id
  email        text,
  full_name    text,
  avatar_url   text,
  member_tier  text        NOT NULL DEFAULT 'Gold',
  currency     text        NOT NULL DEFAULT 'INR',
  locale       text        NOT NULL DEFAULT 'en-IN',
  face_id      boolean     NOT NULL DEFAULT true,
  push_enabled boolean     NOT NULL DEFAULT true,
  hide_balance boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id       bigserial PRIMARY KEY,
  user_id  text    NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name     text    NOT NULL,
  emoji    text    NOT NULL DEFAULT '📦',
  bg       text    NOT NULL DEFAULT '#F2F2F4',
  kind     text    NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense','income','transfer')),
  sort     int     NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS cards (
  id         bigserial PRIMARY KEY,
  user_id    text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  bank       text NOT NULL,
  brand      text NOT NULL DEFAULT 'VISA',
  last4      text NOT NULL CHECK (last4 ~ '^[0-9]{4}$'),
  exp        text,
  balance    numeric(14,2) NOT NULL DEFAULT 0,
  gradient   text NOT NULL DEFAULT 'linear-gradient(120deg,#5FB6EA,#2E8FD6)',
  frozen     boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- only one default card per user
CREATE UNIQUE INDEX IF NOT EXISTS cards_one_default
  ON cards (user_id) WHERE is_default;

CREATE TABLE IF NOT EXISTS merchants (
  id      bigserial PRIMARY KEY,
  user_id text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name    text NOT NULL,
  sub     text,
  address text,
  icon    text,                      -- null falls back to the category emoji
  icon_bg text NOT NULL DEFAULT '#F2F2F4',
  visits  int  NOT NULL DEFAULT 0,
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS transactions (
  id          bigserial PRIMARY KEY,
  user_id     text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  amount      numeric(14,2) NOT NULL CHECK (amount <> 0),
  kind        text NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense','income','transfer')),
  category_id bigint REFERENCES categories(id) ON DELETE SET NULL,
  merchant_id bigint REFERENCES merchants(id) ON DELETE SET NULL,
  card_id     bigint REFERENCES cards(id)      ON DELETE SET NULL,
  note        text NOT NULL DEFAULT '',
  tag         text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source      text NOT NULL DEFAULT 'app' CHECK (source IN ('app','shortcut','import')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tx_user_time  ON transactions (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS tx_user_cat   ON transactions (user_id, category_id);

CREATE TABLE IF NOT EXISTS receipts (
  id             bigserial PRIMARY KEY,
  transaction_id bigint NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  subtotal numeric(14,2),
  tax      numeric(14,2),
  total    numeric(14,2),
  image_url text,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receipt_items (
  id         bigserial PRIMARY KEY,
  receipt_id bigint NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name       text   NOT NULL,
  price      numeric(14,2) NOT NULL,
  qty        numeric(10,2) NOT NULL DEFAULT 1,
  sort       int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS budgets (
  id          bigserial PRIMARY KEY,
  user_id     text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  category_id bigint NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount      numeric(14,2) NOT NULL CHECK (amount > 0),
  period      text NOT NULL DEFAULT 'month' CHECK (period IN ('week','month','year')),
  UNIQUE (user_id, category_id, period)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id             bigserial PRIMARY KEY,
  user_id        text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name           text NOT NULL,
  amount         numeric(14,2) NOT NULL CHECK (amount > 0),
  cadence        text NOT NULL DEFAULT 'monthly' CHECK (cadence IN ('weekly','monthly','yearly')),
  next_charge_on date,
  icon           text NOT NULL DEFAULT '🔁',
  color          text NOT NULL DEFAULT '#111114',
  active         boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS recipients (
  id       bigserial PRIMARY KEY,
  user_id  text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name     text NOT NULL,
  bank     text,
  initials text NOT NULL DEFAULT '??',
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS transfers (
  id            bigserial PRIMARY KEY,
  user_id       text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  from_card_id  bigint REFERENCES cards(id) ON DELETE SET NULL,
  recipient_id  bigint REFERENCES recipients(id) ON DELETE SET NULL,
  amount        numeric(14,2) NOT NULL CHECK (amount > 0),
  fee           numeric(14,2) NOT NULL DEFAULT 0,
  reference     text NOT NULL,
  status        text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','pending','failed')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         bigserial PRIMARY KEY,
  user_id    text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  emoji      text NOT NULL DEFAULT '🔔',
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  link       text,
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notif_user_time ON notifications (user_id, created_at DESC);
