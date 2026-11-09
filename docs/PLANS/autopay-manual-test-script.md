# AI autopay — manual test script

**Status:** Ready to run; not yet executed (2026-11-08).

Test PDFs are not in the repo. They live locally in `~/Downloads/autopay-test-bills/` (generated 2026-11-08 from the vendor demo sites' Test controls; regenerate the same way if missing). Repo fixtures (BILL-1001s): `frontend/lib/invoices/__fixtures__/<vendor>-bill.pdf`.
Run in order — later steps depend on earlier ones. Tick each box; write the Browser Use task ID and site confirmation next to every payment.

**Legend** — App = our invoice app · Site = `https://<vendor>-utility-demo.vercel.app` (choose **Legacy demo** account in the selector) · "Waiting" = status *Waiting on approval*.

---

## 0. Setup (once)

- [ ] Migrations applied through `20261105000000`; `BROWSER_USE_API_KEY` + `SUPABASE_SECRET_KEY` set; dev server running.
- [ ] `scripts/sql/demo-invoice-history.sql` run → each vendor has 3 paid bills (Jul/Aug/Sep 2026).
- [ ] App → **Approval rules**: Amount limit **1000**, Unusual amount **10** %, Minimum comparable bills **3** → *Approval rules saved.*
- [ ] App → Vendors: all 10 vendors have **Autopay** on.
- [ ] App → Invoices: search each vendor. Note any active invoice already using **BILL-1001** (several were paid on the sites earlier). If one exists, that vendor's BILL-1001 step becomes a duplicate test instead.
- [ ] Site check: harborlight + northline show BILL-1001 **Due**; the other 8 show BILL-1001 **Paid**.

Why 10 %: every test bill is ~6–8 % above its vendor's history average. A lower value fails everything as *unusual amount* and hides the history check.

---

## 1. Happy path — invoice number exists, 3 history (H1)

File: fixture `harborlight-bill.pdf` (BILL-1001, $392.08)

1. [ ] App → New invoice → upload the PDF.
2. [ ] **Expect** invoice created immediately as **Approved**, no rule reasons.
3. [ ] **Expect** status → **Payment Processing**; Demo payment panel shows a Browser Use task.
4. [ ] Wait (≈1–5 min, list refreshes every 15 s). **Expect** invoice leaves the active list → **Paid**, confirmation number saved.
5. [ ] Site → Payment history: **exactly one** new payment for BILL-1001, $392.08, same confirmation number as App.

Repeat with fixture `northline-bill.pdf` (BILL-1001, $279.95). [ ]

---

## 2. Invoice number NOT on vendor site (N1) — run before step 3

File: `negative/harborlight-BILL-8E572D99-NOT-ON-SITE.pdf` ($399.92)
Site state must be: BILL-8E572D6D **Due** for $399.92 (the look-alike bait).

1. [ ] Upload. **Expect** **Approved** (rules don't know about the site — this is correct).
2. [ ] **Expect** Payment Processing → agent result **failed** or **uncertain**, message mentions the bill/invoice not found or a mismatch.
3. [ ] Site → Payment history: **no** new payment. BILL-8E572D6D still **Due**.
4. [ ] If uncertain: open **Resolve after checking payment history**, tick the acknowledgment, leave confirmation **blank**, review note "N1: no payment on site", **Save reviewed outcome**. **Expect** back to Approved.
5. [ ] Archive the invoice (More actions → Archive).

**FAIL / bug to report** if the site shows BILL-8E572D6D paid or the App marks this invoice Paid. Nothing in code blocks this; only the agent prompt does.

---

## 3. Generated bill, number exists (H2)

File: `harborlight-BILL-8E572D6D.pdf` ($399.92)

1. [ ] Upload → **Approved** → Payment Processing → **Paid**.
2. [ ] Site: BILL-8E572D6D **Paid**, one payment, confirmation matches App.

Repeat for: [ ] `alder-creek-BILL-B0E96703.pdf` ($190.00) · [ ] `cedar-valley-BILL-89AB419C.pdf` ($210.67) · [ ] `northline-BILL-B01F9EAF.pdf` ($285.55)

---

## 4. Amount on invoice ≠ amount on site (N2) — then duplicate (D1)

Bill: brightwater **BILL-9FD77C0F** (site amount $330.64)

1. [ ] App → New invoice → **manual entry**: vendor Brightwater Water & Sewer, property Brightwater Print Studio, invoice # `BILL-9FD77C0F`, amount **331.64**, date today, due 2026-11-22 → save.
2. [ ] **Expect** Approved → Payment Processing → **failed** (agent stops before submitting).
3. [ ] Site: **no** payment; BILL-9FD77C0F still **Due**.
4. [ ] Resolve as in step 2.4 if uncertain.
5. [ ] **D1**: upload `brightwater-BILL-9FD77C0F.pdf`. **Expect** rejected as a duplicate invoice (same vendor + number). Nothing new created.

---

## 5. Already paid on site (N3)

File: fixture `alder-creek-bill.pdf` (BILL-1001 — already **Paid** on the site)
Skip if setup found an active Alder Creek BILL-1001 in the App.

1. [ ] Note the site's Payment history row count.
2. [ ] Upload → Approved → Payment Processing.
3. [ ] **Expect** agent returns the **existing** receipt → App Paid with the site's *existing* confirmation number.
4. [ ] Site: row count **unchanged** (no second payment).

---

## 6. Short history — fails the 3-bill rule (F1)

**6a. Minimum above the vendor's real history**
> Correction (2026-11-08): history is not always exactly 3. Any earlier BILL-1001 for the same vendor + property that is approved/paid in the App also counts (prairie-grid's BILL-1001 was already paid, so it likely had **4**). Before this step, count the vendor's approved/paid, non-archived invoices for that property dated before today = N.
1. [ ] Approval rules → Minimum comparable bills **N + 1** → save.
2. [ ] Upload `prairie-grid-BILL-F5368AA5.pdf` ($470.56).
3. [ ] **Expect** **Waiting**, reason *There are too few comparable prior bills.* **No** Browser Use task, site untouched.
4. [ ] Set minimum back to **3**.
5. [ ] Click **Approve**. **Expect** Payment Processing → Paid (manual approval path). Site: BILL-F5368AA5 Paid.

**6b. Vendor/property with zero history**
1. [ ] App → Properties: create **Short History Test** (any address).
2. [ ] Manual entry: vendor **Maple Junction Storage**, property **Short History Test**, invoice # `BILL-6AE708C7`, amount 172.17, date today.
3. [ ] **Expect** **Waiting** with *too few comparable prior bills* **and** *no comparable bill average yet*. No payment starts.
4. [ ] Archive it. (Leave BILL-6AE708C7 unpaid on the site.)

---

## 7. Other rule failures (sanity)

| # | File | Change first | Expect |
|---|---|---|---|
| [ ] 7a Amount limit | `copper-ridge-BILL-449223BB.pdf` ($529.07) | Amount limit **500** | Waiting — *Amount exceeds the automatic approval limit.* Restore 1000, then Approve → Paid |
| [ ] 7b Unusual amount | `summit-trail-BILL-E7DB8666.pdf` ($293.36, ~8 % over avg) | Unusual amount **5** % | Waiting — *Amount is above the permitted percentage…* Restore 10 %, then Approve → Paid |
| [ ] 7c Autopay off | `sunmeadow-BILL-A1A740A5.pdf` ($146.15) | Sunmeadow vendor **Autopay off** | Waiting — *Vendor autopay is off.* No payment starts. Turn autopay on, Approve → Paid |

---

## 8. Wrap-up

- [ ] All rule settings back to 1000 / 10 / 3; all vendors autopay on.
- [ ] Every Paid invoice: App confirmation == site Payment history confirmation; one payment per bill on the site.
- [ ] Record any N1/N2/N3 agent misbehaviour with the Browser Use task ID.

Unused file: `maple-junction-BILL-6AE708C7.pdf` (only its number was used in 6b) — spare for a re-run.
