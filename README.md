# Jaadu Diet — Landing Page

Static, dependency-free landing page (HTML + CSS + vanilla JS). Upload the whole folder to any static host (Netlify, Vercel, cPanel, S3, etc.).

```
index.html
assets/css/utilities.css   themes, design tokens, reset, utility classes, motion
assets/css/style.css       sections & components (uses tokens only)
assets/js/main.js          store links, tracking hooks, demo, app-tour slider
assets/img/                optimised WebP screens, crops, logo, icons, QR codes, og-image
```

## Switching theme
Open `assets/css/utilities.css` → section **1. THEMES**. Four themes are included:

1. **Fresh Garden** (default, active)
2. **Mint & Coral**
3. **Midnight Forest** (dark)
4. **Sunrise Citrus**

Comment out the active `:root { … }` block and uncomment the one you want. Keep only one active.

## Download links
- Android → `https://play.google.com/store/search?q=jaadu%20diet&c=apps`
- iPhone → `https://apps.apple.com/in/app/jaadu-diet/id6744672805`

Buttons marked `data-store-link="auto"` send Android visitors to Google Play, iPhone/iPad visitors to the App Store, and desktop visitors to the download section (both badges + one smart QR code). If you get the direct Play Store app URL (`…/details?id=…`), replace the search URL in `index.html`, `download.html` and `main.js` (`STORE.play`).

## QR code
The desktop QR code opens the live landing page, `https://jaadudiet.vaibhavsaaol.workers.dev/`. On the phone, the download buttons there point to Google Play (Android) or the App Store (iPhone). To change the address, edit `QR_URL` in `assets/js/main.js`. Clicking the QR card on desktop opens `download.html` (a page showing both stores).

## Analytics / ads tracking
Nothing is tracked until you add your IDs. In `<head>` of `index.html` there are commented snippets for **Google Tag Manager**, **gtag.js (GA4 / Google Ads)** and **Meta Pixel**: replace the placeholder IDs and uncomment.

`main.js` already pushes these events to `dataLayer`, `gtag` and `fbq` (when present):

| Event | When | Params |
|---|---|---|
| `download_click` | any store button | `store`, `location`, `platform` |
| `tour_slide` | user changes app-tour slide | `slide`, `source` |
| `demo_interaction` | score demo food toggled | `food`, `added`, `total` |
| `faq_open` | FAQ opened | `question` |

UTM parameters, `gclid`, `gbraid`, `wbraid` and `fbclid` are captured for the session and attached to every event. Mark `download_click` as the conversion in Google Ads / Meta.

## Before going live
- Set the canonical URL and `og:url` (commented in `<head>`) and make `og:image` an absolute URL.
- Add a Privacy Policy link in the footer (Google Ads and Meta require one when tracking is enabled).
- The profile screenshot has the user's phone number and email blurred. Keep it that way, or replace it with a demo account screenshot.
