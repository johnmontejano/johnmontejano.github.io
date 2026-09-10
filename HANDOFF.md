# Handoff — John Montejano portfolio site

## Marketing clarity release — 2026-09-09

This release supersedes the imagery/fidelity-only snapshot below. John likes
the monopo design, but asked to make the service and imagery meaningful and
improve conversion readiness to at least8/10 through independent agent critique.

- Preserved the WebGL hero, reference type/palette, staggered work, meaningful
  scroll movement, founder portrait and white contact close.
- Hero now states custom workflow automation for service businesses, with a
  concrete subhead and booking CTA. Early selectable illustrative workflows
  explain trigger → automation → human handoff; all are readable without JS.
- Replaced glass objects with process diagrams and removed the Paris film and
  generated trade photography from the DOM. Original files are preserved.
  Compact moving gallery uses real project sources and labeled examples.
- Project roles are explicit. GelatoTech includes a verified observable case:
  choosing iPhone opens exact-model selection. No savings or sales claims added.
  LISA's Stanford non-affiliation disclaimer remains intact.
- User supplied and main verified `https://calendly.com/johnmontejano2/free30`:
  actual Free30 minutes event, available dates, workflow-map/first-priority
  deliverable. This is the primary CTA. Email composer is secondary and never
  pretends to send or book. No third-party embed or analytics added.
- Source files: `assets/css/marketing.css`, `contact.css`, `proof-gallery.css`,
  `assets/js/workflow.js`, `contact.js`, plus edited index/main. Social preview
  is rendered from `tools/social-card.html` using `tools/render-social.cjs`.
- See `docs/MARKETING_PASS.md` for fixed rubric and final evidence. Local preview
  uses `node tools/serve.cjs 4177`; the old Python4176 server produced intermittent
  connection resets under parallel asset loads and is not the final QA source.
- Motion regression now tests the current workflow/Calendly/email experience,
  not removed film controls. Proof crops stay fixed inside moving bands.
  Run `node tools/motion-check.cjs`, browser checks and byte-level deployment check.
- Final publish SHA/results are recorded in shared memory and the current task
  record after publication; historical9/10 design scores are not marketing scores.

## Latest snapshot — 2026-09-09 image/motion refinement

This snapshot supersedes the historical implementation and next-step notes below.

- Active worktree: `../Portfolio-John-main/portfolio-live-worktree`, branch `codex/monopo-fidelity`. Real main checkout: `../portfolio-live`. Never run Git in the parent `Portfolio-John-main` directory.
- Image entrances now trigger in view; cover, gallery, portrait and name motion use independent transform layers. Hero interruption, menu keyboard/focus behavior, film pause persistence and startup failure fallbacks have regression coverage.
- GSAP/ScrollTrigger 3.12.5 and Lenis 1.1.14 are self-hosted. Main UI starts before the WebGL shader. Reduced motion and actual JavaScript-disabled browsing remain usable.
- Decorative images now use natural-daylight generated artwork. The portrait is an AI-assisted lighting/background edit of John's real photograph. The film is licensed live-action Paris street footage, not a generated still or a claim of San Francisco location. Original assets remain preserved. See `docs/ASSET_REFRESH.md` and `docs/VIDEO_SOURCE.md`.
- Desktop section geometry, restrained cover opacity, rotated gallery, hero lens and typography follow live monopo measurements. Mobile strengths and portrait now have reference-aligned stacking. The final mobile manifesto refinement restores approximately 40px type at 390px width.
- Final independent iteration12 assessment: visual quality **9.0/10 desktop and mobile**; strict fidelity **8.8/10 both**. This is a subjective screenshot-based review, not a pixel-identical claim. Reference font and shader material remain different.
- Durable QA captures live in `../Portfolio-John-main/qa-final/`, especially `iteration11`, `iteration11-mobile`, `iteration11-narrow`, `iteration11-reduced`, and the final `iteration12-mobile` manifesto refinement. Unchanged desktop sections are in `iteration8`; live reference captures are in `reference` and `reference-mobile`.
- Run `node tools/motion-check.cjs` for isolated motion/startup/accessibility regressions. Run `node tools/browser-check.cjs URL OUTPUT_DIR MODE` against test Chrome on port9222. Run `node tools/verify-deployment.cjs https://johnmontejano.github.io COMMIT_SHA` to compare all 29 served assets byte-for-byte.
- Publication is explicitly authorized by John. Main agent owns final commit, fast-forward of main, push and GitHub Pages verification. Final deployment evidence belongs in shared `memory/CURRENT_STATE.md` and the current Agent Tasks record.

Written 2026-09-08 for a fresh agent (Codex or otherwise) to pick up with zero prior context.

## Repo location — read this first

**This file lives in the real repo: `~/Documents/Projects/Portfolio/portfolio-live/`.**
That is where `.git`, `main`, and the GitHub remote all live.

There is a *different* folder, `~/Documents/Projects/Portfolio/Portfolio-John-main/`,
that looks like the project (it has a `memory/` directory with project notes) but
**has no `.git` of its own** — any git command run there resolves to an accidental
repo at `~/.git` (the whole home folder). Do not treat it as the working repo.
Its `memory/NEXT_STEPS.md`, `memory/DECISIONS.md`, `memory/CURRENT_STATE.md` are
still useful reading (cross-tool project notes shared with Claude Code), just don't
run git there.

- Live site: **https://johnmontejano.github.io**
- Remote: `git@github.com:johnmontejano/johnmontejano.github.io.git` (also has an
  `origin` HTTPS remote configured — push has been flaky over HTTPS this session,
  see "What didn't work" below)
- Current `main` HEAD: `f5eacc4`, confirmed identical to `origin/main` and to what
  the live URL is serving.
- Backup branch `backup/live-v6-2026-09-06` on origin holds the pre-rebuild site if
  a full rollback is ever needed.

## Goal

John wants his portfolio site (workflow-automation consulting for service
businesses — plumbing, HVAC, dental, salons, auto repair, etc.) to look and feel
like **monopo.vn** (a Tokyo/Saigon creative studio site), with the content adapted
to his own experience, projects, and offer. He picked monopo from Refero's style
catalogue (https://styles.refero.design) and has asked repeatedly, across many
iterations, for the match to be as close as possible — animations, section
structure, hero, nav, scroll feel, the "Manifesto" section by name — not just the
color palette.

He has now said he wants to try handing this same brief to Codex/GPT to see if it
does a better job, starting from the inspiration site directly. That's a green
light to replace or diverge from what's here if a genuinely closer match is
possible — this file exists so Codex doesn't have to rediscover the same ground.

## Current state (v8.1, live)

The page is a full section-for-section port of monopo.vn's structure with John's
own content, dark from top to bottom (matching the reference — its only light
moment is a hard cut at the footer). In order:

1. **Hero** — WebGL shader background (custom GLSL, not Three.js — see
   `assets/js/orb.js`) plus a second "lens" canvas clipped to a circle for the
   glass-sphere look; a two-part headline that swaps lines on a timer, mimicking
   the reference's slot animation; nav links stacked vertically top-right; a
   rotating "SCROLL DOWN" badge bottom-left.
2. **Selected work** — staggered two-column grid (not a straight list) of his
   three real projects: FastFix.ai, GelatoTech, LISA (Stanford GSB LEAD program
   site). Screenshots are real captures, cropped to remove star-rating/review-count
   claims that don't belong on a portfolio (see "What didn't work" — this was a
   deliberate content-integrity fix, not a style choice).
3. **"Built for"** — word-by-word animated list of trades he serves, echoing the
   reference's "They trust us" client-logo section but with trade names since he
   has no client logos to show.
4. **Manifesto** — the section John named explicitly. Large wipe-in lines:
   "Assess. Simplify. Automate. If it happens the same way twice, it can happen
   without you..." — adapted from the reference's "We Integrate, Collaborate, and
   Challenge" manifesto structure.
5. **Strengths rows** — the "four leaks" (missed calls, double-entry, dead quotes,
   no-shows), each a self-drawing hairline rule + label + circular photo + numbered
   copy, echoing the reference's strengths/services rows.
6. **Job timeline** — a scroll-scrubbed "7:04pm you're under a sink" story showing
   what the automation actually does end-to-end.
7. **Video band** — full-bleed video (ffmpeg-generated push-in on a still, see
   below) with a text overlay.
8. **Tile gallery** — rotated/tilted grid of atmosphere photos, matching the
   reference's diagonal tile sections.
9. **Who** — portrait + bio.
10. **Questions** — FAQ accordion.
11. **Contact/footer** — light background (the one deliberate color inversion),
    gradient-text email link with animated underline, matching the reference's
    footer treatment.

All motion runs on **GSAP + ScrollTrigger + Lenis** (CDN-loaded, no bundler — this
is a static site, plain HTML/CSS/JS, deployed via GitHub Pages with no build step).

### Documentation already written (in `docs/`)

These are the result of six research agents studying the reference in parallel.
Read them before re-deriving anything:

- `GAP_ANALYSIS.md` — side-by-side comparison of what was missing vs. the reference
- `SCROLL_SPEC.md` — exact scroll-trigger timing/easing measured off monopo.vn
- `MONOPO_CSS.md` / `MONOPO_JS.md` — reverse-engineered notes on the reference's
  actual implementation (fonts, easing curves, breakpoints, structure)
- `VISUAL_PLAN.md` / `VISUAL_DEVICES.md` — the plan for translating reference
  sections into John's content, and the interactive devices (word-reveal, orb,
  scroll-scrub timeline, etc.)
- `ASSETS.md` — inventory of generated images/video and their prompts
- `scroll-frames/` — screenshots captured while scrolling the reference site

## What worked

- **Studying the reference's actual captured frames/DOM, not just its stylesheet.**
  Early attempts styled to a written description of monopo and it looked nothing
  like the real site. The breakthrough was screenshotting the reference at many
  scroll positions and matching pixel-for-pixel structure (section order, spacing,
  type scale, what pins vs. what scrubs).
- **A CDP wheel-scroll harness for verification**, not the Browser-pane tool. The
  Browser pane runs the page as a hidden document — `requestAnimationFrame` is
  throttled/paused and IntersectionObserver/ScrollTrigger don't fire reliably
  there, so it's useless for checking scroll-linked animation. Instead: launch
  headless Chrome with `--remote-debugging-port`, connect over the Chrome DevTools
  Protocol, and dispatch synthetic wheel events to actually drive the page while
  it's visible/foregrounded. The harness for this exists at
  `../../../../../private/tmp/.../scratchpad/main/live/see.js` from this session
  (a genuinely useful reusable pattern — consider copying it into the repo, e.g.
  `tools/scroll-verify.js`, rather than leaving it in scratch).
- **ffmpeg for the video band**, since no video-generation credits were available
  (Higgsfield MCP tool needs 2 credits/image, account only had 0.4). A slow
  Ken-Burns push-in on a generated still, encoded with ffmpeg, reads as "video"
  at a glance and cost nothing.
- **gpt-image-bridge (local skill) for stills** when Higgsfield credits ran out —
  produces comparable atmosphere photography without burning API credits.
- Headless Chrome screenshot diffing at multiple scroll depths to catch things
  like "the mask animation never completes" or "the headline goes blank between
  slot swaps" before shipping.

## What didn't work / traps to avoid

- **GSAP `yPercent` + a plain CSS `y` transform fight each other.** If an element
  has a CSS `transform: translateY(...)` and GSAP also animates `yPercent`, they
  don't compose the way you'd expect — this caused the headline to render
  completely blank mid-cycle. Fix was to let GSAP own the transform entirely
  (don't pre-set `translateY` in CSS on elements GSAP will animate).
- **Headless Chrome `--window-size` is not mobile emulation.** Using
  `--window-size=390,844` does not set `devicePixelRatio`, touch flags, or
  `matchMedia` the way real mobile emulation does — some responsive bugs only
  showed up when using proper device emulation (`--mobile` flag or CDP
  `Emulation.setDeviceMetricsOverride` with `mobile: true`).
- **Browser-pane MCP tool for judging animation/scroll feel.** Covered above —
  it's fine for static DOM/screenshot checks but the page is backgrounded/hidden
  from the renderer's perspective, so anything relying on visibility or rAF
  timing (i.e. basically all of the scroll-linked motion) behaves differently
  there than in a real foregrounded tab. Always verify motion with the CDP
  harness or by asking John to look at the live site himself.
- **Pushing to GitHub over HTTPS was flaky this session** — several pushes timed
  out or needed retries. If push fails, retry; it wasn't a credentials problem
  (SSH remote also configured as a fallback).
- **Screenshots with star ratings / review counts baked in reused from the old
  site.** These got cropped out — a portfolio showing "4.9★ (312 reviews)" on a
  screenshot for a project he's showcasing his own dev work on reads as either
  fake or irrelevant. If Codex re-captures screenshots, keep them clean of
  metrics that aren't his own claims.
- **Refero's style catalogue was the starting point but its own site is *not* an
  accurate live mirror of monopo.vn** — it's a curated style breakdown, and some
  of its described values (spacing, exact hex colors) didn't match what's
  actually live on monopo.vn when checked directly. Always verify against the
  live reference site itself, not just a third-party style summary of it.

## Next steps (whichever agent continues)

From `Portfolio-John-main/memory/NEXT_STEPS.md` (still accurate as of this commit):

1. **Video is synthetic** — the hero/band video is an ffmpeg push-in on a still,
   not real footage. If real video assets or credits become available, swap it in.
2. **Portrait crop/lighting** doesn't fully match the reference's photo treatment
   yet — worth a closer pass if pursuing pixel-parity.
3. **Card opacity/hover states** in the work grid could be tuned closer to the
   reference's exact values (see `SCROLL_SPEC.md` for measured numbers).
4. If John wants a literal **Codex-driven rebuild from scratch**: point it at
   `https://monopo.vn` directly, have it inspect the live DOM/CSS/scroll behavior
   itself (not just Refero's summary), and keep this repo's `docs/` folder as a
   reference for what's already been learned/measured — no need to re-derive
   easing curves, breakpoints, etc. that are already documented.
5. Current word count on the page: **648 words** (previous iteration was 796,
   trimmed further this pass per "less text, more visual" feedback).

## Verification checklist before calling anything "done"

- `git status` clean, `main` pushed and matching `origin/main`
- `curl -s -o /dev/null -w "%{http_code}" https://johnmontejano.github.io` → 200
- Scroll-verify with the CDP harness (not the Browser pane) at a few scroll
  depths to confirm animations actually fire and complete
- Check mobile with real device emulation, not just a narrow `--window-size`
# 2026-09-09 image/motion refinement — current pass

This update supersedes the historical next steps below. The active working
copy is `../Portfolio-John-main/portfolio-live-worktree`, branch
`codex/monopo-fidelity`. Production remains `f1eedf4` until this pass is published.

- Fixed viewport-triggered image entrances, hero interruption, separate cover/
  gallery/portrait transforms, film pause persistence, menu focus and startup
  failure fallbacks. Pinned GSAP/ScrollTrigger/Lenis are served locally, with UI
  boot ordered before WebGL initialization.
- Replaced crushed-shadow decorative images with natural daylight art and the
  animated still with licensed live-action footage. `docs/ASSET_REFRESH.md` and
  `docs/VIDEO_SOURCE.md` document the generated/real distinction and licensing.
- Restored measured desktop geometry, gallery rotation/density, hero type and
  offscreen lens geometry. FastFix's existing marketing capability map is now
  crisp HTML with its genuine logo; GelatoTech uses the existing real selector.
- Independent review scored the preceding candidate8.0 quality/8.2 fidelity.
  The next pass fixes its five findings: header contrast/overlap, cover clarity,
  marquee separator, hero material/geometry, and industry-list spacing. Re-score
  pending; do not claim9 based only on passing tests.
- Latest durable captures: `../Portfolio-John-main/qa-final/iteration8` and
  `iteration8-mobile`; both full-scroll runs passed startup, image, overflow and
  exception checks. `tools/motion-check.cjs` provides isolated regression tests.
- Main agent owns final commit/push and byte-level GitHub Pages verification.
