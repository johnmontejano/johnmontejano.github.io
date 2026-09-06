# RESEARCH V7 — Design references for the portfolio rebuild

**Date:** 2026-09-05
**Scope:** Awwwards 2026 (SOTD / Honorable Mention / Nominee), Mobbin, and solo-operator sites selling automation / AI systems / ops consulting to businesses.
**Method:** Every reference below was rendered in headless Chromium at 1440×900, screenshotted, and measured by reading computed styles off the live DOM (type sizes, colour instance counts, transition durations, max content width, above-fold content density, motion libraries). Numbers in this document are measured, not estimated. Anything I could not verify is marked **UNVERIFIED**.

---

## Executive summary

**Top 3 candidates**

1. **Justus John — https://justus-john.com/en/** — Solo technical operator selling software and AI systems to businesses. Nearly identical positioning problem to yours ("I'm one person and I'm serious"), solved with typographic restraint rather than gimmicks. Measured: 12% of the fold carries content, hero is 6.4× body size, the accent colour appears exactly once above the fold.
2. **GRAIsol — https://www.graisol.com/ai-automation-agency** — "Most agencies resell a tool. I build the thing." Same audience as you, dark-ground variant, and the most disciplined motion system in the whole sample: exactly two transition durations across the entire page and no animation library at all.
3. **85CO — https://eightyfiveco.com** — The commercial half of the job. A 104px hero, three proof numbers pinned to the bottom of the fold, one accent colour used twice. This is what "a business owner can decide in 8 seconds" looks like.

**The one I'd bet on: Justus John.**

Reasoning: your two audiences pull in opposite directions. A business owner wants proof and legibility; a hiring manager wants evidence of judgment and restraint. Most sites in this space resolve that by adding — more badges, more gradient, more chat bubbles — and end up reading as a freelancer template (see the Dated section; `samuelochoa.com` has your exact positioning and looks three years old). Justus John resolves it by subtracting, and the subtraction *is* the credential: a page that holds 90px of serif and one line of monospace on an empty warm field is a page whose author has editorial judgment. That reads as taste to the hiring manager and as calm competence to the business owner, and it's the only reference in the set that serves both without splitting into two sites. It is also portable — its effects are type, colour and spacing decisions, not a WebGL set-piece you'd have to rebuild. 85CO is the fallback if the commercial audience proves to need more explicit proof above the fold; GRAIsol is the fallback if you go dark.

**Also read:** `a-lign.studio` (Awwwards HM, Aug 2026) for the tightest type system found — two sizes above the fold; `emilkowal.ski` for the credibility-through-restraint extreme; `wembi.ai` (SOTD, Jul 2026) for what 2026 flat colour actually looks like.

---

## 1. Awwwards 2026 — what actually won

**Mechanics of the source.** The public `/websites/portfolio/` feed mixes Nominees and SOTD; Honorable Mentions live on a separate feed at `/websites/honorable/`. I pulled both, extracted the live site URLs and award dates from the raw HTML of ~40 award pages, then rendered the relevant ones. Award type and date below are read from each site's own Awwwards page.

### 1.1 a-lign studio — Honorable Mention, Aug 10 2026
**URL:** https://www.a-lign.studio · Awwwards page: https://www.awwwards.com/sites/a-lign-studio
**Why it works:** A web studio selling to founders, using a dashed-wireframe motif as the entire brand device — the site looks like its own design process. Closest thing in the sample to a "consultant" site that won something in 2026.

Checkable mechanisms:
- **Two type sizes above the fold**, total: 96px display and 16px caps subline. Nothing else.
- **One typeface** (Geist) in three weights (400/500/600). No serif, no mono, no second family anywhere on the page.
- **Near-monochrome:** the dominant text colour is a single mid-grey `#4F4F4F` (74 of the measured text instances) on `#F7F7F7`. It is not black on white.
- **One accent** — coral `#DE7356` — appearing **exactly once above the fold**, on the CTA button.
- **Border-radius is 2px or 4px** on 61 of the measured boxes; full pills reserved for one element type.

### 1.2 Wembi — Site of the Day, Jul 1 2026
**URL:** https://www.wembi.ai · https://www.awwwards.com/sites/wembi
**Why it works:** The clearest read of 2026 colour language in the set — a full-bleed flat saturated field with a single line of neutral grotesk on it. No gradient, no glass, no image.

Checkable mechanisms:
- **Three distinct type sizes above the fold** (75px / 14px / 12px).
- **One typeface** (Haas Unica) for 673 of 682 measured text nodes; **one weight** (400) for 673 of them.
- **666 of 682 text instances are pure black** `#000`. Colour lives in the *ground*, not the type.
- Acid green `#BEFF8B` and a pale blue `#C0DFE9` used as full-panel grounds, 11 panels each — never as a text or icon accent.
- **Five transition durations total** on the page, dominated by 0.5s (94 elements).

### 1.3 Cipher — Site of the Day, Aug 20 2026
**URL:** https://cipher.tv · https://www.awwwards.com/sites/cipher
**Why it works:** A production studio whose entire homepage is one canvas and 12px of type. The extreme end of "let the work carry it".
Checkable mechanisms:
- **Two type sizes on the whole page**: 12px and 11px. There is no display type at all.
- **One typeface** (Favorit), effectively one weight (500 on 61 of 62 nodes).
- **One text colour** `#E9EAE4` on `#060403`. Two colours total.
- **Three transition durations**: 0.2s, 0.3s, 0.45s. Nothing over half a second.
- **One screen tall** — `scrollHeight` equals viewport height; navigation is not scroll.

### 1.4 Signal-A Studio — Nominee, Sep 1 2026
**URL:** https://signal-a.studio · https://www.awwwards.com/sites/signal-a-studio
**Why it works:** A pure-typographic studio page: two families, three sizes, black on white, and the whole hierarchy carried by weight and spacing.
Checkable mechanisms:
- **Three type sizes total** on the page: 17px, 12px, 23px. The largest thing on the site is 23px.
- **Two families, one weight each**: GT America Mono at 300 (117 nodes), Neue Haas Grotesk at 400 (105 nodes).
- **One text colour** — `#000` on 222 of 222 measured text nodes.
- **42% above-fold content density** — the sparsest non-hero-image layout in the sample.
- Only CSS motion is a 30s marquee; all interaction motion is GSAP-driven.

### 1.5 Sileent — Site of the Day, Feb 10 2026
**URL:** https://www.sileent.com · https://www.awwwards.com/sites/sileent
**Why it works:** A 461px letterform as the hero. Demonstrates that scale, not colour, is the 2026 way to be loud.
Checkable mechanisms:
- **Four type sizes above the fold**, with a 461px:38px ratio between the display letter and everything else.
- **Two colours on the entire page**: white type on `#000`. Zero background colours besides black.
- **Zero border-radius** anywhere on the page.
- **One transition duration** on the page: 0.1s.

### 1.6 OkayDev — Nominee, Aug 20 2026
**URL:** https://okaydev.co · https://www.awwwards.com/sites/okay-dev-r
**Why it works:** The loud pole of 2026 — flat saturated green ground, chunky display face, scattered thumbnails. Useful as the counter-direction to Justus John, not as your direction.
Checkable mechanisms:
- **Flat `#22C55E`-family green as the full page ground**, with `#EEE642` and `#6D42ED` as the only two other saturated hues.
- **Six type sizes above the fold**; hero display at 104px against a 46px secondary and 14–15px body.
- **Three families**, one display (Megazoid), one grotesk (Aeonik), one mono (Aeonik Mono) — the 2026 three-family stack.
- **Transitions cluster at 0.12–0.2s** (297 of ~380 measured transitions).

### 1.7 Terminal Industries — Site of the Day, Sep 3 2025 (business & services)
**URL:** https://terminal-industries.com · https://www.awwwards.com/sites/terminal-industries
**Why it's here:** Best available example of a serious operations/logistics product marketing site — the closest sector to your business audience.
Checkable mechanisms:
- **Body copy is 14px on 68 of the fold's text nodes**; the largest thing above the fold is 16px. It sells with copy density, not display type.
- **Suisse Intl at weight 450** on 517 nodes — a single optical weight used almost everywhere.
- **One accent** — acid `#ABFF02` — against a near-black `#052424` neutral.
- **0.4s is the house transition** (526 elements), with 0.1s reserved for hover feedback.
- **Caution:** its hero renders empty 4.5 seconds after DOMContentLoaded at 1440×900 — content is gated behind scroll-triggered JS. See Dated §3.8.

---

## 2. Mobbin

**Login-gated. Confirmed, not worked around.** `https://mobbin.com/browse/web/apps` returns HTTP **307** to anonymous browsers, and a reader-proxy fetch of the same URL returns the marketing landing page rather than the browse grid. Per the brief I stopped there. Nothing from Mobbin informs this report.

---

## 3. The peer set — solo operators selling automation / AI systems / ops

I rendered and measured 20 sites in this category. Twelve are recorded below: the ones that are genuinely good, plus the ones whose failure modes are instructive. **Finding: the craft floor in this category is extremely low.** Search results for "AI automation consultant" are dominated by n8n-freelancer template sites. The handful of good ones are good in a very specific and repeatable way, which is the useful part.

### 3.1 Justus John — the benchmark
**URL:** https://justus-john.com/en/ — "Software and AI solutions for businesses that need something of their own."
**Why it works:** A solo builder selling custom systems to businesses, and the page never once says "trust me" — the restraint does it.

Checkable mechanisms:
- **12% above-fold content density.** Measured by union-rasterising every painted box under half a viewport in area. Nothing else in the sample is under 20%. Roughly seven-eighths of the first screen is empty warm paper.
- **Hero is 6.4× body size** (90px display serif / 14px body). Seven distinct type sizes above the fold, eighteen across the whole page.
- **Three-family system with three jobs:** Instrument Serif for display, Inter for body, JetBrains Mono for labels and the subline. Weight 400 on 140 of 184 measured nodes — hierarchy is size and family, not weight.
- **The accent (`#B5470B` rust) appears exactly once above the fold** — as the blinking cursor caret at the end of `// I put into code.` It is one 4×20px rectangle.
- **Ground is warm off-white `#FAF9F7`, never `#FFFFFF`.** Pure white appears only as a card surface (21 instances) deeper in the page.
- **Three navigation items** (wordmark, language toggle, one CTA). No menu bar.
- **Motion is tiered and fast:** 0.18s and 0.25s carry 51 of the transitions; the only things over 0.6s are two ambient 2.4–2.6s keyframe loops. Custom easing `cubic-bezier(0.16, 1, 0.3, 1)` on the deliberate transitions.
- Ships a `prefers-reduced-motion` media query. Uses GSAP + ScrollTrigger + Lenis, but you cannot tell from the fold.

### 3.2 GRAIsol
**URL:** https://www.graisol.com/ai-automation-agency
**Why it works:** The positioning line does the whole job — *"Most agencies resell a tool. I build the thing."* — and the page structure argues it with a two-panel comparison rather than a claim.

Checkable mechanisms:
- **Exactly two transition durations on the entire page**: 0.15s (38 elements) and 0.2s (7). No animation library loaded at all — no GSAP, no Lenis, no Framer.
- **The hero headline is one sentence in two colours**: the concession in cream `#F2EDE4`, the claim in rust `#E8623C`. The accent is applied to *meaning*, not to decoration.
- **A literal strikethrough comparison block**: left panel "A typical AI automation agency" with its line struck through in grey; right panel "GRAIsol" in full-strength serif. One mechanism, whole argument.
- **Three-family stack, three roles:** Instrument Serif (display), Instrument Sans (body), JetBrains Mono (eyebrows/labels at 12–14px, letterspaced caps).
- **Four background colours total** across the page: `#0B0B0C`, `#1A1918`, the rust, and one 80%-alpha nav scrim.
- 72px hero against 14px body = **5.1× ratio**; six type sizes above the fold.

### 3.3 85CO
**URL:** https://eightyfiveco.com
**Why it works:** The best commercial fold in the sample. A business owner can decide in one screen: what it is, what it costs you to find out, and three numbers of proof.

Checkable mechanisms:
- **104px hero against a 16px body = 6.5× ratio**, with the entire value proposition in two lines.
- **Proof row pinned to the bottom of the fold**: three figures (`20+` founders served, `35+` products shipped, `2–4` week avg. launch) at 30px with 11px mono captions, above a single hairline rule.
- **One accent** — lime `#9ED629` — used **twice** above the fold: the 8px square before the eyebrow, and the full stop after "development".
- **Two families:** Inter for everything readable, Sometype Mono for all eyebrows and captions (77 nodes, all at 10–11px caps).
- **All CTAs are full pills** (`border-radius` resolving to a max value on 25 boxes); no other rounded rectangles compete with them.
- **39% above-fold density** despite carrying five distinct content blocks — achieved by pushing the proof row to the fold edge and leaving the right third to the gradient.

### 3.4 Itmeo Studio
**URL:** https://itmeo.studio — "Build. Ship. Automate."
Checkable mechanisms:
- **1024px max content width** on a 1440px viewport — the narrowest measured column of any commercial site in the set. Everything sits in a single readable measure.
- **Two transition durations**: 0.15s (24) and 0.2s (4). No motion library.
- Warm ground `#F2F1ED`, ink `#26251E` (not black), one orange `#F54E00` used on one word of the headline and one dot in the status pill.
- **Four proof figures** on the fold in a 4-up row (10 yrs / 75+ / 3 wks / 100%).
- Geist for UI, Bricolage Grotesque for display — two families, no mono body.

### 3.5 Ops Automators
**URL:** https://www.opsautomators.com — "Automate the Work Nobody Wants to Do."
**Why it works:** Best *headline* mechanism in the peer set: the sentence splits across two typefaces, and the split is the joke.
Checkable mechanisms:
- **96px headline set half in Satoshi grotesk (white) and half in Instrument Serif italic (yellow `#F5C518`)** — one line, two voices.
- **Underlines used as semantic markup** in the subhead: "Ops automation" and "RevOps consulting" are underlined, the rest is not. Keywords are underlined, not bolded or coloured.
- **Yellow appears three times above the fold** (headline half, nav CTA fill, one bolded phrase) and nowhere else.
- **0.15s is the only meaningful transition duration** (161 of 187 measured).
- **16px border-radius on 98 boxes** — one radius token, applied consistently.
- Weakness: seven nav links plus a cart icon on a consultancy site. See Dated §3.10.

### 3.6 AbhijeetBuilts
**URL:** https://abhijeetbuilts.tech — "Capture every lead. Follow up automatically. Cut the manual work."
**Why it works:** Closest to your exact offer (lead capture, follow-up, CRM hygiene for service businesses) with real craft applied. Ground and type are 2026; a couple of the widgets are not.
Checkable mechanisms:
- **Three-line hero, one italic word.** `automatically` is the only italic on the fold, and it's the word the whole offer turns on.
- **Faint technical-drawing linework as the ground** (blueprint gears, a vertical rule at x≈65px) at very low contrast — texture without a gradient wash.
- **`solo operator` set as a monospace chip** next to "You talk to the person who builds it." The positioning liability is stated as a feature in 11px mono.
- **A capability row of five thin cards** (Obsidian / AI OS / n8n / WhatsApp AI / Zoho) each with a 6px orange square — tool literacy shown as a spec sheet, not logos.
- Warm ground `#F6F4EE`, ink `#161510`, one orange `#FF4D00`. Two transition durations (0.15s, 0.3s).
- Weaknesses: nine nav links; a floating chat bubble bottom-right; a "WhatsApp chat" secondary CTA.

### 3.7 initIA Studio
**URL:** https://www.initia.studio — "60% of your team's time is spent on work you didn't hire them for."
**Why it's here:** Your exact positioning (diagnose → quantify → redesign workflows), executed as competent generic dark SaaS. Instructive as the level you have to clear.
Checkable mechanisms it gets right:
- **The headline is a statistic, and the statistic is the only coloured word** (amber `#FFB800` on `60%`).
- Five type sizes above the fold; 60px hero against 18px body.
- Two CTAs only, one primary one ghost.
Checkable mechanisms that date it: faint tech-grid background; `box-shadow` glow on the primary button; a WhatsApp glyph inside the secondary CTA. See Dated §3.6, §3.11.

### 3.8 House Eleven
**URL:** https://house11.ai — "Decision. Data. Design. Delivery."
Checkable mechanisms:
- **23% above-fold density** — the sparsest dark site measured.
- 72px hero against 14px body; five type sizes on the fold.
- Weakness worth noting: **three accent hues** in the text palette (`#ED1D2E` red, `#3B82F6` blue, `#4E99A2` teal). Compare to Justus John's one. This is the most common way a good dark page loses coherence.

### 3.9 ClawOps Studio
**URL:** https://clawops.studio — "We build and run your AI workforce."
Checkable mechanisms:
- **96px hero against 14px body**, five type sizes on the fold.
- **Acid `#E8FF47` on `#0A0A0A`** — the dark-mode expression of the same 2026 acid-accent language as Wembi and 85CO.
- **Only 4.7 screens of scroll depth** — the shortest commercial page measured. Compare: Justus John 39.6, Wembi 23.7, Moritz Dunkel 22.3.
- Weakness: **76% above-fold density**. Everything is right except the breathing room.

### 3.10 XUMU
**URL:** https://www.xumu.ai
Checkable mechanisms:
- **One family (Nhu), weight 300 on 85 of 168 nodes** — a light grotesk as the entire voice.
- Warm ground `#F7F5F3`; four type sizes above the fold.
- Weakness and a clear line to draw: **1.2s is its most common transition duration, applied to 206 elements.** This is the single largest motion outlier in the sample and it makes the page feel underwater. Contrast GRAIsol's 0.15s.

### 3.11 Samuel Ochoa — *right positioning, dated execution*
**URL:** https://samuelochoa.com — "Find the follow-up gaps. Before buying more software."
Your closest positioning twin: follow-up audits and workflow fixes for small service businesses, evidence before a build. The copy is genuinely good. The design is 2022. Full breakdown in Dated §3.9.

### 3.12 Timothy MK / AI with Anouk — *the category floor*
**URLs:** https://timothymk.com · https://www.aiwithanouk.com
Both are working automation consultants with sites that actively cost them credibility. Recorded in full in the Dated section; they are the proof that in this category, restraint alone is a differentiator.

### Credibility models for the hiring-manager audience

**Emil Kowalski — https://emilkowal.ski**
- **Two type sizes on the entire page**: 16px (14 nodes) and 14px (2). That's it.
- **692px max content width** on a 1440px viewport — about 48% of the frame, and the page is left-aligned in it.
- **One transition duration on the whole site**: 0.15s.
- **Three background colours total**; 26% above-fold density; no hero, no headline, no CTA — the page opens with his name at 16px and a one-line role.

**Rauno Freiberg — https://rauno.me**
- **Four type sizes**, one of which is a 720px letterform used as a graphic element.
- **One typeface** across every text node measured.
- **Three background colours**: white, a pure yellow `#FFFF02`, and one `display-p3` orange. The yellow appears as a single circle.
- **Three transition durations**: 0.15s, 0.2s, 0.35s.

---

## 4. What 2026 design language actually is — measured

Derived from computed styles across ~34 rendered sites, not from trend posts. Each claim states the evidence.

**4.1 Warm off-white, not white; warm near-black, not black.**
Grounds measured: `#FAF9F7` (Justus John), `#F6F4EE` (Abhijeet), `#F2F1ED` (Itmeo), `#F7F5F3` (XUMU), `#F7F7F7` (a-lign), `#FBF9F4` (Surinder). Dark grounds: `#0B0B0C` (GRAIsol), `#16181D` (initIA), `#09090B` (House11), `#08090A` (Linear), `#052424` neutral (Terminal). Pure `#FFFFFF` as the whole page ground now correlates with the template-y end of the sample (Samuel Ochoa). 85CO is the exception that works, and it covers a third of the fold in a gradient.

**4.2 The three-family stack: grotesk + mono + one serif for emphasis.**
Instrument Serif specifically appears on **four** measured sites (Justus John, GRAIsol, Ops Automators, Samuel Ochoa). The pattern is consistent: serif carries display or one emphasised clause; a neutral grotesk carries body; a monospace carries eyebrows, labels, metadata and nav at 10–14px letterspaced caps. Mono is never the body face. Sites using this stack: Justus John, GRAIsol, Abhijeet (SF Mono), Ops Automators, 85CO (Sometype Mono), OkayDev (Aeonik Mono), Terminal (Geist Mono), Linear (Berkeley Mono).

**4.3 Hero is 5–7× body size, and there are 4–8 type sizes above the fold.**
Measured ratios: 85CO 6.5× (104/16), Justus John 6.4× (90/14), Ops Automators 6× (96/16), Itmeo 5.3× (80/15), GRAIsol 5.1× (72/14), ClawOps 6.9× (96/14). Distinct sizes above the fold on the strong references: a-lign 2, Wembi 3, Signal-A 3, Rauno 4, GRAIsol 6, Justus John 7, 85CO 8. On the weak ones: Timothy MK 9, Roberto Izquierdo 13. **Fewer than nine sizes above the fold is the practical line.**

**4.4 Motion is fast and single-tier. The "slow is premium" idea is dead.**
This contradicts a common assumption, so here is the evidence. Transition durations on the strongest references cluster in one or two values, all under 0.35s: Emil Kowalski `{0.15s}`; GRAIsol `{0.15, 0.2}`; Itmeo `{0.15, 0.2}`; Abhijeet `{0.15, 0.3}`; Rauno `{0.15, 0.2, 0.35}`; Ops Automators `{0.15}` on 161 of 187; Cipher `{0.2, 0.3, 0.45}`; Sileent `{0.1}`. Long durations appear only on ambient loops (2–30s marquees and gradients), never on interface response. The outlier in the other direction, XUMU at 1.2s × 206 elements, is the page that feels worst. **A useful rule to check: no state change over 350ms; ambient loops may be any length; nothing in between.**

**4.5 One accent hue, used one to three times per screen.**
Justus John: rust `#B5470B`, once above the fold. a-lign: coral `#DE7356`, once. 85CO: lime `#9ED629`, twice. Ops Automators: yellow `#F5C518`, three times. GRAIsol: rust `#E8623C`, on one clause and one button. The failure mode is visible in House Eleven (three accent hues) and AI with Anouk (a single cyan applied to everything, which is the same failure inverted).

**4.6 Two accent families dominate: warm rust/orange, and acid lime.**
Rust/orange: `#B5470B` Justus John, `#E8623C` GRAIsol, `#F54E00` Itmeo, `#FF4D00` Abhijeet, `#FF4C24` Grigoletti, `#DE7356` a-lign, `#B0552F` Surinder. Acid lime/green: `#9ED629` 85CO, `#E8FF47` ClawOps, `#ABFF02` Terminal, `#BEFF8B` Wembi, `#EEE642` OkayDev. Violet and blue-gradient are conspicuously absent from everything recent and good, and present in the dated set.

**4.7 Radii are small or full — nothing in between.**
Justus John `{3, 5, 7, 14}px`. a-lign `{2, 4}px` on 61 boxes. GRAIsol `{6, 12, 16}px`. Signal-A `{1px}`. Cipher and Sileent: none at all. Full pills (`9999px` / a max value) are reserved for buttons, chips and status dots. The 20–32px "soft card" radius that defined 2021–2023 appears mainly on the dated references.

**4.8 Folds are sparse. 12–48% content density on the good ones.**
Measured as the union area of painted boxes smaller than half a viewport, rasterised on a 16×10px grid over the first 1440×900. Justus John 12%, House11 23%, Terminal 23%, Emil 26%, Deeflect 26%, Ops Automators 35%, Itmeo 37%, Linear 38%, 85CO 39%, XUMU 40%, Samuel Ochoa 43%, Rauno 47%, GRAIsol 48%. The dated cohort: AI with Anouk 59%, Timothy MK 61%, Abhijeet 70%, ClawOps 76%, Moritz Dunkel 78%.

**4.9 Body copy is 14–16px; metadata is 10–13px.**
Terminal runs 14px on 68 of 74 fold nodes. Linear's two most common sizes are 12px and 13px. Justus John's most common size across the page is 15px. 18px+ body is now a marker of a template.

**4.10 Smooth-scroll is near-universal on award sites and absent from credibility sites.**
Lenis was detected on 11 of the measured pages (Justus John, Cipher, Wembi, Montfort, Terminal, Serious Business, Sileent, Signal-A, ClawOps, XUMU, Grigoletti). It was absent from every one of the restraint models (Emil, GRAIsol, Itmeo, Abhijeet, Ops Automators, Samuel Ochoa). This is a genuine fork, not a trend: awards reward the scroll feel, engineers read it as overhead. Justus John is the one site that has it and doesn't announce it.

---

## 5. What reads as DATED in 2026 — with a reference proving each

Every item below was observed on a rendered page in this sample.

**5.1 Neon-on-black cyber/HUD.** Cyan `#00F0FF` type on `#050810`, corner-bracket status panels, a particle field, and Orbitron/Rajdhani/Share Tech Mono as three display faces.
*Proof:* **https://www.aiwithanouk.com** — every one of its six most-used text colours is `#00F0FF` or `#00FF88` at varying alpha; nine keyframe animations run 2s or longer; 59% fold density.

**5.2 Rainbow / multi-hue gradient applied to a person's name.**
*Proof:* **https://timothymk.com** — the wordmark "Timothy MK" is a five-stop rainbow gradient at 102px.

**5.3 Cosmic / particle / starfield backdrops.**
*Proof:* **https://timothymk.com** (nebula and node-graph render behind the hero) and **https://www.aiwithanouk.com** (drifting particle field).

**5.4 The arms-crossed cutout headshot floating in the hero.**
*Proof:* **https://timothymk.com** (in a rounded card, right half of the fold) and **https://www.surinder.design** (full-bleed cutout, right half). Note Surinder is an Awwwards *Nominee* dated Aug 22 2026 — being listed does not make a trope current.

**5.5 Certification badge stickers and rotating circular seals.**
*Proof:* **https://www.surinder.design** — two badge graphics (NN/g, HFI-CDPA) and a rotating gradient roundel on the fold. Reads as a 2019 LinkedIn profile.

**5.6 Persistent floating chat FABs, and messaging-app glyphs inside CTAs.**
*Proof:* **https://www.surinder.design** (two circular FABs, mail and WhatsApp, top-right), **https://abhijeetbuilts.tech** (one, bottom-right), **https://www.initia.studio** (a WhatsApp glyph inside the secondary hero CTA). None of the strong references has one.

**5.7 The percentage preloader that gates the page.**
*Proof:* **https://christoph-nagel.dev** — a blurred hero behind a glass card reading "WEBSEITE WIRD GELADEN — 86%" with a bar-chart progress graphic. This site is an Awwwards Nominee dated Aug 27 2026; the preloader still dates it, and it costs measurable time-to-content.

**5.8 A hero that does not exist until JavaScript fires.**
*Proof:* **https://terminal-industries.com** and **https://linear.app** — both screenshot with a completely empty hero region 4.5 seconds after DOMContentLoaded at 1440×900, showing only the nav bar. Whatever this looks like on a fast connection, the failure mode is real and checkable.

**5.9 The 2022 SaaS-template stack: violet gradient wash + stacked pill CTAs + chip badge + avatar-stack social proof + green "Available" dot.**
*Proof:* **https://samuelochoa.com** — violet `#5A1FE0` on 35 text instances; a lavender-to-white gradient across the fold; three pill CTAs stacked in two rows; a check-mark chip; a two-avatar overlap with "Past implementation work"; a name-chip with avatar above the headline. Also **https://www.surinder.design** for the green-dot "Available" status pill. This matters most: Samuel Ochoa's positioning is nearly identical to yours and his copy is strong. The design is what makes him read as a freelancer rather than an operator.

**5.10 Full site navigation on a one-person site.**
*Proof:* visible nav links measured — **samuelochoa.com** 10, **abhijeetbuilts.tech** 9, **timothymk.com** 8, **opsautomators.com** 7. Against: **justus-john.com** 3, **itmeo.studio** 2, **emilkowal.ski** 1, **grigoletti.ch** 0. A ten-item menu on a solo site advertises a content library, not a practice.

**5.11 Button glow and faint tech-grid backdrops.**
*Proof:* **https://www.initia.studio** — amber `box-shadow` bloom on the primary CTA, plus a low-contrast grid with glowing node intersections. Also **https://www.opsautomators.com** for the circuit-trace background.

**5.12 A cookie modal centred over the hero on first paint.**
*Proof:* **https://timothymk.com** (dark modal covering the CTAs) and **https://www.wembi.ai** (a 400px consent panel over the lower-right of an SOTD-winning fold). Both destroy the first impression they spent the fold building.

**5.13 The "desktop OS" portfolio conceit.**
*Proof:* **https://www.robertoizquierdo.com** (Awwwards Nominee, Aug 21 2026) — menu bar, dock, draggable windows, an assistant mascot, a LinkedIn feed widget, a fake security log. **Thirteen distinct type sizes above the fold**, the most in the entire sample. The concept reads as effort; the execution reads as a 2020 hackathon demo. If you are tempted by an interactive conceit, this is the failure mode.

**5.14 Glassmorphism.**
*Proof:* **https://christoph-nagel.dev** preloader card (blurred translucent panel with a 1px light border). It survives in 2026 only as a nav scrim; as a content surface it is gone from every strong reference measured.

---

## 6. Reference index

| # | URL | Kind | Award / status | Fold density | Sizes on fold | Hero:body |
|---|---|---|---|---|---|---|
| 1 | https://justus-john.com/en/ | Solo operator, AI/software | — | 12% | 7 | 6.4× |
| 2 | https://www.graisol.com/ai-automation-agency | Solo operator, automation | — | 48% | 6 | 5.1× |
| 3 | https://eightyfiveco.com | Small studio, AI design/dev | — | 39% | 8 | 6.5× |
| 4 | https://www.a-lign.studio | Web studio | Awwwards HM, Aug 10 2026 | 93%¹ | 2 | 6.0× |
| 5 | https://www.wembi.ai | Product | Awwwards SOTD, Jul 1 2026 | n/m² | 3 | 5.4× |
| 6 | https://cipher.tv | Studio | Awwwards SOTD, Aug 20 2026 | n/m² | 2 | — |
| 7 | https://signal-a.studio | Design studio | Awwwards Nominee, Sep 1 2026 | 42% | 3 | 1.4× |
| 8 | https://www.sileent.com | AI content studio | Awwwards SOTD, Feb 10 2026 | n/m² | 4 | 12.1× |
| 9 | https://itmeo.studio | Small studio, automation | — | 37% | 8 | 5.3× |
| 10 | https://www.opsautomators.com | Ops/RevOps consultancy | — | 35% | 5 | 6.0× |
| 11 | https://abhijeetbuilts.tech | Solo automation consultant | — | 70% | 8 | 4.3× |
| 12 | https://emilkowal.ski | Design engineer | — | 26% | 2 | 1.1× |
| 13 | https://rauno.me | Interaction designer | — | 47% | 4 | 51.4×³ |
| 14 | https://terminal-industries.com | Ops product | Awwwards SOTD, Sep 3 2025 | 23% | 3 | 1.1× |
| 15 | https://www.initia.studio | AI ops studio | — | 100%¹ | 5 | 3.3× |
| 16 | https://house11.ai | AI studio | — | 23% | 5 | 5.1× |
| 17 | https://clawops.studio | AI ops studio | — | 76% | 5 | 6.9× |
| 18 | https://www.xumu.ai | Brand studio | — | 40% | 4 | 3.8× |
| 19 | https://samuelochoa.com | Workflow consultant | — | 43% | 5 | 4.1× |
| 20 | https://okaydev.co | Community platform | Awwwards Nominee, Aug 20 2026 | 100%¹ | 6 | 6.9× |

¹ Density is inflated where a scattered-thumbnail or full-panel layout produces many mid-sized painted boxes; treat as "dense" rather than as a precise figure.
² Measured before the density metric was corrected to exclude full-viewport panels; **UNVERIFIED**, do not cite.
³ Rauno's 720px figure is a decorative letterform, not a headline.

**Honorable mentions found but not measured in depth (all Aug 2026):** https://boc.studio · https://lutstudios.com · https://irisventure.com · https://leoparpeix.com · https://1000whales.com · https://www.250broadway.com

---

## 7. Caveats

- Above-fold density is my own metric (union of painted boxes under half a viewport, rasterised at 16×10px over 1440×900). It is repeatable and comparable within this document, but it is not a standard measure.
- Colour instance counts are counts of *DOM nodes* carrying a colour, not of visible pixels. A colour used once on a large panel and a colour used once on a 4px caret both count as one.
- Awwwards nominee status is a low bar. Several Nominee-listed sites here (Surinder, Christoph Nagel, Roberto Izquierdo) carry tropes I've classified as dated. SOTD and Honorable Mention are the meaningful tiers.
- Sites were measured 4.5 seconds after DOMContentLoaded on a fast connection. Scroll-triggered content below that threshold is not captured; where a hero rendered empty I have said so rather than assumed.
- Mobbin was not consulted (login-gated, confirmed by HTTP 307).
