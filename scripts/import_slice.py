#!/usr/bin/env python3
"""Import a slice bank statement PDF into the expenses database.

    python3 scripts/import_slice.py statement.pdf [--apply]

Without --apply it only prints what it would do. Re-running is safe: each row is
keyed on the bank's own reference number.
"""
import argparse, os, re, subprocess, sys, collections

MONTH = {m: i + 1 for i, m in enumerate(
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"])}
ROW = re.compile(r"^\s+(\d{2} \w{3} '\d{2})\s{2,}(.+?)\s{2,}(\d{9,})\s{2,}(-?)₹([\d,]+\.?\d*)\s{2,}₹([\d,]+\.?\d*)\s*$")
UPI = re.compile(r"UPI-(?:Debit|Credit)-\d+-(.+?)-[A-Z]{4}[0-9A-Z]{6,}-")

# Party -> category. Everything not listed falls through to the rules below.
MAP = {
    # eating out
    "MALABAR FOOD SUPPLY": "Lunch", "EATCLUB": "Lunch",
    "POP TATES PANVEL PT": "Outing with friends", "RAAVI HOSPITALITY": "Outing with friends",
    "MATOSHREE BEER SHOP": "Outing with friends", "UDIITA WINES": "Outing with friends",
    # small food
    "MANOJ JUICE CENTRE": "Snacks", "ORANGE SWEETS": "Snacks",
    "JAY GANESH DUGDHALAY": "Snacks", "SHIV SANDESH DAIRY A": "Snacks",
    "D DAIRY KIRANA STORE": "Snacks",
    # travel
    "INDIAN RAILWAYS UTS": "Transportation",
    "HOTEL MANTRA NX": "Others", "FABHOTELS": "Others",
    # recurring / health / groceries
    "NETFLIX": "Others", "JIOHOTSTAR": "Others",
    "SAHARA MEDICAL": "Others", "MEDICITY CHEMISTAND": "Others",
    "SWIGGY INSTAMART": "Others",
    # money moved, not spent
    "PRANAV SAJEEV NAIR": "Transfer", "DEPOSIT CREATION": "Transfer",
    "GEETA S NAIR": "Transfer", "SAJEEV VISWANATHAN N": "Transfer",
    "INTEREST": "Income",
}

def clean(p):
    p = re.sub(r"[​-‏﻿]", "", p)
    p = re.sub(r"\s+", " ", p).strip().upper()
    p = re.sub(r"^UPI-DEBIT-\d+-", "", p)
    if p.startswith("NETFLIX"):
        return "NETFLIX"
    return p.replace("KASHINATH SADAFAL NA", "KASHINATH SADAFALNA")

def parse(pdf):
    txt = subprocess.run(["pdftotext", "-layout", pdf, "-"],
                         capture_output=True, text=True, check=True).stdout
    rows, cur = [], None
    for line in txt.splitlines():
        m = ROW.match(line)
        if m:
            if cur: rows.append(cur)
            d, det, ref, sign, amt, bal = m.groups()
            dd, mon, yy = d.replace("'", "").split()
            cur = {"date": f"20{yy}-{MONTH[mon]:02d}-{int(dd):02d}", "details": det.strip(),
                   "ref": ref, "amount": (-1 if sign == "-" else 1) * float(amt.replace(",", ""))}
        elif cur and line.strip() and not re.match(r"^\s*(DATE|slice|Need help|\d/\d)", line):
            cur["details"] += line.strip()
    if cur: rows.append(cur)

    for r in rows:
        m = UPI.search(r["details"])
        if m:                                     r["party"] = clean(m.group(1))
        elif r["details"].startswith("Interest"): r["party"] = "INTEREST"
        elif "Deposit Creation" in r["details"]:  r["party"] = "DEPOSIT CREATION"
        else:                                     r["party"] = clean(r["details"][:40])
        r["category"] = categorise(r)
    return rows

def categorise(r):
    p = r["party"]
    if p in MAP:
        return MAP[p]
    if r["amount"] > 0:
        return "Transfer"          # money in that is not interest is a transfer in
    # A large payment to a named individual behaves like a transfer, not a purchase.
    if abs(r["amount"]) >= 2000:
        return "Transfer"
    # Pranav's daily habit: repeated 20/21 rupee payments to street vendors.
    if r["amount"] in (-20, -21):
        return "Cigarettes"
    return "Others"                 # other small person-to-person: not knowable from the statement

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()

    rows = parse(a.pdf)
    spend = sum(r["amount"] for r in rows if r["amount"] < 0 and r["category"] != "Transfer")
    moved = sum(r["amount"] for r in rows if r["category"] == "Transfer" and r["amount"] < 0)

    by = collections.defaultdict(lambda: [0, 0.0])
    for r in rows:
        c = by[r["category"]]; c[0] += 1; c[1] += r["amount"]
    print(f"{len(rows)} rows  {rows[0]['date']} .. {rows[-1]['date']}")
    for c, (n, t) in sorted(by.items(), key=lambda x: x[1][1]):
        print(f"  {t:>12,.2f}  x{n:<3} {c}")
    print(f"\nreal spending  {spend:,.2f}")
    print(f"moved (transfers/savings) {moved:,.2f}")

    if not a.apply:
        print("\nDry run. Re-run with --apply to write these to the database.")
        return

    import psycopg2
    url = next(l.split('"')[1] for l in open(".env") if l.startswith("DATABASE_URL"))
    uid = next(l.split('"')[1] for l in open(".env") if l.startswith("SHORTCUT_USER_ID"))
    conn = psycopg2.connect(url); cur = conn.cursor()
    cur.execute("SELECT name, id FROM categories WHERE user_id=%s", (uid,))
    cats = dict(cur.fetchall())

    ins = 0
    for r in rows:
        cid = cats.get(r["category"])
        kind = "income" if r["category"] == "Income" else "transfer" if r["category"] == "Transfer" else "expense"
        cur.execute("""
            INSERT INTO transactions (user_id, amount, kind, category_id, note, occurred_at, source, external_ref)
            VALUES (%s,%s,%s,%s,%s,%s::date,'import',%s)
            ON CONFLICT (user_id, external_ref) WHERE external_ref IS NOT NULL DO NOTHING""",
            (uid, r["amount"], kind, cid, r["party"].title(), r["date"], r["ref"]))
        ins += cur.rowcount
    conn.commit()
    print(f"\ninserted {ins}, skipped {len(rows)-ins} already present")

if __name__ == "__main__":
    main()
