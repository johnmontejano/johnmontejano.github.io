# bar.md — the reference and what actually makes it good

**Reference:** monopo saigon — https://monopo.vn
**Refero style:** https://styles.refero.design/style/3e52dd36-6ab1-48c6-bc40-47ef6d33abc2

## Why this one, over the other 19 in the Refero catalog

Refero's catalog has 20 styles. Ruled out, with reasons:

- **Monad, Superhuman, OFF+BRAND** — all warm-parchment + editorial. That *is*
  the current live v6 ("Paper and Machine"). Picking one would be a reskin, not
  the full replacement that was asked for.
- **Cal.com** — v6 already borrowed Cal's booker geometry. Utility SaaS look,
  not a $20k signal.
- **ORYZO AI** — built around a single hero product object presented as a museum
  artifact. John has systems and screenshots, not one object. Structural mismatch.
- **Auros, Slash** — fintech-specific (bioluminescent data orbs / didone-serif
  luxury). Both risk reading as decoration John can't justify to a plumbing or
  gelato client.
- **Linear** — the strongest runner-up and the canonical "serious software"
  language. Rejected on one risk: it is the most-cloned system on the internet,
  and a Linear clone reads as template — the exact failure mode being avoided.
- **Duolingo, Phantom, Seed, Resend, Mintlify, Apple, GSAP, Dala, shadcn/ui** —
  wrong register for the audience.

**monopo saigon wins on three counts.** It is an actual creative studio selling
craft to businesses, so the category matches John's. Radical monochrome is the
maximum possible contrast with the current warm-parchment site, so this is a
genuine rebuild. And it is the only style in the catalog whose spec pins an
actual motion system — which matters because the instruction was to copy the
animations exactly, and a craft critic can only check motion that is specified.

## The mechanisms

Every line below was verified against the live site's computed styles, not taken
from the written description.

1. **One typeface carries everything.** A single geometric-humanist sans sets
   nav, hero, body, labels and footer. Weights live in a low band — 200, 300,
   400 — and never reach 600. A second face may appear at most once on the page.
   *Live: Roobert on 168 elements, Raleway on 5, system-ui on 3.*

2. **The display headline locks.** Hero headline is >=180px at 1440 wide with a
   line-height **ratio <=0.80**, so the lines physically touch and read as a
   typographic object rather than a sentence. Nothing shares its band — no
   subhead, no CTA, no image beside it.
   *Live: 200px/400/lh 250, and 84px/400/lh 64 = ratio 0.76.*

3. **Display-to-body ratio >=8:1**, with at most 6 distinct sizes in common use.
   *Live: 200px display against 16px body = 12.5:1.*

4. **Achromatic interface, exactly one chromatic event.** Every border, fill,
   control and string is black, white or gray. Colour appears once per page as
   an iridescent gradient wash behind the hero, and never touches a control.

5. **One curve, three durations — retuned fast.** `cubic-bezier(0.19, 1, 0.22, 1)`
   on every transform and colour transition, at **0.15s / 0.25s / 0.35s**.
   **No state change may exceed 350ms.** Ambient loops (marquee, gradient drift)
   may be any length; nothing is allowed in between.
   *Deviation from the reference, on purpose.* monopo runs this curve at
   0.8s/1.25s. RESEARCH_V7 §4.4 measured 34 sites: every strong 2026 reference
   clusters at 0.15–0.35s (Emil 0.15; GRAIsol 0.15/0.2; Itmeo 0.15/0.2; Rauno
   0.15/0.2/0.35; Ops Automators 0.15 on 161 of 187 elements), and the page that
   feels worst in the whole sample — XUMU at 1.2s x 206 elements — has monopo's
   exact motion profile. The curve is kept; the duration is not.

6. **Radius is binary.** 75px full pills on buttons and tags only. Cards,
   images, inputs and nav are 0px. No intermediate radius exists in the system.

7. **Flat.** Zero `box-shadow` anywhere on the page. Separation comes only from
   1px hairline borders and whitespace.

## Grid and rhythm

Base unit 4px - container max 1078px - section gap 46px - card padding 34px -
element gap 14px - density spacious.

## Open item

Roobert is proprietary. Substitute is a free geometric-humanist sans with a
200-600 range (General Sans or Switzer via Fontshare; Inter Variable is the
spec's own named fallback). Whichever is chosen must hold at weight 200 and at
200px without the aperture closing up.
