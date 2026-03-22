# Phatesar Wedding Invitation — Frontend Crawl

**Source URL:** `https://h5.phatesar.com/view/699f045861e1f696fc1c1c37`  
**Page Title:** Tun & Wyut Yi — Welcome to Our Wedding  
**Crawled:** 2026-03-22

---

## Architecture Overview

This page is a **Next.js** application (using Turbopack bundler) served behind **Cloudflare** (rocket-loader script injection). The backend renders a React Server Components (RSC) payload directly into the HTML via inline `<script>` tags using `self.__next_f.push()`.

### How the Backend Generates the Frontend

1. **Server-Side Rendering (SSR):** The HTML is server-rendered with an initial shell (`<div id="mainlayout">`) that is mostly empty.

2. **React Server Components (RSC) Payload:** The bulk of the content — including the invitation data (title, comments, metadata, maps URL, user info) — is serialised as a **React Flight stream** embedded in inline `<script>` blocks. Each block calls `self.__next_f.push([...])` to progressively hydrate the page.

3. **Data Injection:** The invitation object (MongoDB document with `_id: 699f045861e1f696fc1c1c37`) is embedded directly in the RSC payload. It includes:
   - Invitation metadata (title, description, OG image, map URL)
   - User info (`userId`, `name`, `email`)
   - All wedding comments/blessings (embedded as an array)
   - Feature flags (`enableBlessing`, `enableGuestList`, `enableInvitationCard`, `enableLocation`)
   - Envelope style config (`{ type: "stamp" }`)

4. **Client Hydration:** The JS chunks hydrate the server-rendered shell using the RSC payload, mounting interactive components (comments, RSVP, map, etc.).

5. **Cloudflare Rocket Loader:** All script `type` attributes are rewritten to a Cloudflare-specific MIME type (`987c7f41464a846c401e6fa4-text/javascript`) so Rocket Loader can defer and optimise script loading.

---

## Directory Structure

```
site_crawl/
├── index.html                          # Main HTML (SSR output)
├── README.md                           # This file
├── _next/
│   └── static/
│       ├── chunks/
│       │   ├── *.css                   # 5 CSS bundles (Tailwind + component styles)
│       │   └── *.js                    # 10 JS bundles (React, Next.js runtime, app code)
│       └── media/
│           └── *.woff2                 # 21 font files (Noto Sans Myanmar, Open Sans, Poppins)
├── cdn-assets/
│   └── og-image.jpeg                   # OpenGraph preview image from cdn.phatesar.com
└── cdn-cgi/
    └── scripts/.../rocket-loader.min.js  # Cloudflare Rocket Loader
```

## Key Technical Details

| Aspect | Detail |
|--------|--------|
| Framework | Next.js (App Router with RSC) |
| Bundler | Turbopack |
| CDN | Cloudflare (Rocket Loader enabled) |
| Image CDN | cdn.phatesar.com |
| Fonts | Noto Sans Myanmar, Open Sans, Poppins (woff2) |
| CSS | 5 chunked stylesheets (~478 KB total) |
| JS | 10 chunked scripts (~1.1 MB total) |
| Database | MongoDB (ObjectId-style IDs) |
| Rendering | SSR + RSC streaming hydration |
