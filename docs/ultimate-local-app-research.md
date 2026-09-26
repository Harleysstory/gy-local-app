# Research: What the world's best town apps do — and what GY Local should steal

*26 Sep 2026 · desk research with sources cited · feeds the improvement plan at the end*

---

## 1. The exemplars

### 🇦🇹 Vienna — the gold standard (Stadt Wien + Sag's Wien)

The consistently top-ranked smart city runs two apps worth studying:

- **[Stadt Wien](https://play.google.com/store/apps/details?id=wien.at.live)** — "direct answers to all areas of the city from towing to tick vaccinations": most-used services at a glance, a rich city map (down to **drinking fountains**), and — crucially — **real-time notifications: transit disruptions, weather warnings, events, civil defense**. "My Vienna" personalises: departure times at your location, your dates, neighbourhood info, digital membership cards, even a city Advantage Club.
- **[Sag's Wien](https://smartcity.wien.gv.at/en/sags-wien-app)** ("Tell it Vienna") — snap a photo of a problem, and it reaches the municipal administration in under a minute. **30,000 reports in its first 18 months, 97% resolved.** It's framed as *digital participation*, not complaint-filing — and that framing is why it works.
- An earlier [wien.at live app](https://smartcity.wien.gv.at/en/wien-at-live-app-2) proved the pattern: **push was the most-loved feature** (12,000 weather-warning subscribers before push was mainstream), an **offline city map** mattered, and the emergency add-on (refugee help, 2015) showed civic apps must be redeployable in a crisis.

**What Vienna teaches:** notifications drive daily opening; problem-reporting works when outcomes are *visible*; the map should know the town's small details.

### 🇬🇧 FixMyStreet — the civic template

**[FixMyStreet](https://www.fixmystreet.com/)** (mySociety charity, [open source](https://fixmystreet.org/), nationwide UK): photo + pin + description → routed to the right authority; reports are **published on a public map** so others see what's already reported (prevents duplicates), can subscribe to reports, comment, and watch status. The App Store reviews tell you exactly what matters: *"it informs the relevant council and you get regular updates on progress"* ✓, and the one-star reviews are all about **lost geolocation on drafts and stale reports that never get closed** — accountability hygiene is the product.

**What FixMyStreet teaches:** a public record with status is the difference between "shouting into a void" and a civic tool. Open source + open data (it's built on OSM) is a viable model.

### 🇬🇧 InYourArea — the UK's biggest hyperlocal app

Reach plc's **[InYourArea](https://www.inyourarea.co.uk/)** (1M+ downloads, ["third most downloaded news app in the UK" per Reach's 2020 results](https://www.reachplc.com/content/dam/reach/corporate/documents/investors/financial-reporting/2021/FY2020%20Reach%20Prelims%20Combined%20Script%20.pdf.downloadasset.pdf)): postcode-tailored aggregation of news, jobs, homes, things-to-do, traffic & weather; community features; **free event submission and free business promotion**; WhatsApp communities; giveaways.

The reviews are the lesson: users *love* the concept ("the glue that keeps us connected") and **hate the ads** — "all I get is adverts for loft conversions or solar panels — not even by local companies. Uninstalled." A town app monetised by non-local advertising destroys the very trust that makes it useful.

**What InYourArea teaches:** aggregation + free local listings is the adoption engine; ad-loading is the failure mode. GY Local's no-ads stance is a feature, not an omission.

### 🇬🇧 Too Good To Go — the local commerce hook

**[Too Good To Go](https://www.toogoodtogo.com/en-gb)** (180,000+ businesses): "Surprise Bags" at half price from local cafés — a reason to open the app *and* a reason for businesses to be in it, wrapped in a social mission (food waste). It's the proof that **local deals drive daily engagement** better than any amount of information.

### 🇫🇮 Helsinki — the ecosystem model

Helsinki's [Helsinki Region Infoshare](https://msd.unimelb.edu.au/__data/assets/pdf_file/0003/3940329/Smart-City-Report-revised_European-case-studies.pdf) opened 1,000+ city datasets; "dozens of mobile apps developed by start-ups and enthusiastic citizens" followed. Hackathons ("Reboot the City") produced a snow-plough routing app. The city deliberately runs **Smart Cities 3.0: citizen co-creation** rather than tech-vendor-led.

**What Helsinki teaches:** don't build everything — publish the platform and let the town build on it. GY Local's "fork it for your own town" README and open data layer are already this pattern in miniature.

### 🇬🇧 Great Yarmouth — the current local landscape

- **Parking:** the borough uses **[MiPermit / "Parking Ops"](https://www.great-yarmouth.gov.uk/article/4157/New-cashless-pay-by-phone-service-for-car-parking-in-Great-Yarmouth)** (Norfolk Parking Partnership; [Yarmouth location code 706811](https://secure.mipermit.com/parkingoperations/Account/PayAndStayAdd.aspx)); Saba/PayByPhone covers the station car park. Permits are [virtual via the MiPermit portal](https://www.great-yarmouth.gov.uk/article/2313/Resident-parking).
- **Council services:** [GYBC's digital offer is website-based](https://www.great-yarmouth.gov.uk/payonline) (OPENPortal, My Account) — **no council app**.
- **Tourism:** Visit Great Yarmouth is a website, not an app.
- **News:** the town is covered by postcode through InYourArea — i.e. the "local app" experience is currently a national product with non-local ads.

**The gap:** Great Yarmouth has **no town-specific app at all.** GY Local is the only game in town — literally.

---

## 2. The patterns distilled

What the successful ones share, in order of observed impact:

| Pattern | Evidence | GY Local today |
|---|---|---|
| **1. Notifications that matter** | Vienna: push was the most-loved feature; InYourArea newsflashes | ❌ **None — the single biggest gap** |
| **2. Report a problem, see the outcome** | Sag's Wien 97% resolved; FixMyStreet's public map + status | ⚠️ Reports exist but go privately to one inbox |
| **3. Free local listings** | InYourArea's adoption engine; free business promotion | ✅ Community places, moderated — already there |
| **4. Local deals as the commerce hook** | Too Good To Go's daily-open driver | ⚠️ `saved_items` table still waiting |
| **5. The map knows small things** | Vienna: drinking fountains; FixMyStreet: grit bins | ✅ Good (ATMs, toilets surfaced as subsections) |
| **6. Postcode / "my area" personalisation** | InYourArea's core mechanic | ✅ Personal layer (device-local) — different but honest take |
| **7. Aggregation done politely** | InYourArea (but ad-ruined) | ✅ News + events, no ads |
| **8. Offline map** | Vienna's offline city plan | ⚠️ PWA caches pages, not map tiles |
| **9. Open data / open source platform** | Helsinki HRI; FixMyStreet | ✅ Strongest-in-class already |
| **10. Emergency redeployability** | Vienna's refugee-help pivot | ❌ (n/a until the day it's needed) |

---

## 3. What GY Local should steal — ranked, costed, Yarmouth-shaped

### A. Web push notifications — the #1 gap 🥇
*"Rain easing by 4pm · low tide at the pier 17:32 · fireworks tonight 8pm."* Every exemplar treats notifications as the retention engine. PWA **web push is free** (VAPID keys, no accounts, works on Android Chrome + desktop; iOS supports it for installed PWAs since 16.4). Subscribers get one daily digest + opted-in event categories. *Effort: 2–3 evenings. Cost: £0.*

### B. The community noticeboard — public problem reports 🥈
Upgrade the private "report" channel into the Sag's Wien/FixMyStreet pattern: report a pothole/flytip/broken bench with photo + pin → **appears on a public map with status** (new → acknowledged → fixed) → optionally forwarded to FixMyStreet (which already routes to GYBC). The status hygiene FixMyStreet's reviewers demand is the lesson: closed reports must close. *Effort: 3–4 evenings. Cost: £0.*

### C. The specials board — local deals 🥉
The Too Good To Go pattern without the payment rails: local businesses post offers (2-for-1 coffee, late deals) through the existing submission pipeline → moderated → a "Specials today" strip on home. This is the first genuine *value-return* for businesses joining the platform — and the natural seed of the premium-listings idea from the original blueprint. *Effort: 2–3 evenings. Cost: £0.*

### D. The parking layer — Yarmouth-specific utility
A car parks layer (OSM already has the parks; council pages have the charges) with "pay here → Parking Ops (MiPermit, code 706811)" deep-links. For a tourist town where seafront parking is a summer sport, this is daily-use gold — and it costs nothing to link to the official app. *Effort: 1–2 evenings. Cost: £0.*

### E. The seaside extras
Seafront webcams (Visit GY already runs them), market days, Yarmouth Town FC fixtures — recurring, local, charming. All free. *(Already on the backlog.)*

### F. The Helsinki move — publish the platform
Push the "fork it for your own town" story harder: the events scraper, the category map, and the whole pipeline are already town-agnostic. One blog post on how GY Local was built is the marketing *and* the legacy. *Effort: an afternoon of writing.*

### Things deliberately NOT to copy
- **Ads** (InYourArea's failure mode) — GY Local's trust is the product
- **Accounts everywhere** (InYourArea's data-collection vibe) — the device-local personal layer is a differentiator; keep it
- **Council-service replication** (Vienna's towing/tick-vaccination depth) — that's GYBC's job via OPENPortal; link out instead
- **Payments** (Too Good To Go's rails) — the specials board deliberately avoids money handling

---

## 4. The verdict

GY Local already matches the best-in-class on **platform principles** (open data, aggregation, free listings, privacy, self-hosting, £0) and is genuinely ahead on **honesty** (no ads, device-local personal data). Where it lags the Viennas and InYourAreas is **retention plumbing** — notifications, visible civic outcomes, and commerce hooks. The improvement list above closes that gap without abandoning a single principle the app was built on.
