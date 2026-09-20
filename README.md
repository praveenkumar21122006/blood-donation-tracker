# LifeDrop — Blood Donation & Tracking System

Modern web app for blood donation tracking — donors, requests, inventory, compatibility.

Live repo: https://github.com/praveenkumar21122006/blood-donation-tracker

## Features
- Dashboard with stats, stock levels, timeline, eligibility alerts (56-day rule)
- Donor Registry — CRUD, search, filter by blood group/eligibility, donate action
- Blood Requests — create/fulfill/cancel, compatibility matching
- Inventory — live stock per blood group + log (donation adds, fulfillment deducts)
- Compatibility guide + quick matcher

## Tech
Vanilla HTML/CSS/JS, localStorage, responsive, deployed on Vercel.

## Run locally
```bash
python3 -m http.server 5173
# open http://localhost:5173
```

## Deploy
Vercel static deployment — no build step (`vercel.json` handles rewrites).
