# John Montejano · portfolio (v6, "Paper and Machine, refined")

A static one-pager. Plain HTML, one stylesheet, one vanilla JS file. No build
step, no bundler, no npm install, no framework, no runtime CDN dependency.

## Run it

From the repository root that contains this directory:

```
python3 -m http.server 8737 --directory site
```

Then open <http://localhost:8737/>.

From inside this directory, `python3 -m http.server 8737` does the same thing.
Any static file server works; the page has no server-side requirements. Opening
`index.html` directly with `file://` also renders, but the self-hosted fonts and
the `fetch`-free JS behave more like production over HTTP.

## What is here

```
index.html          all markup and all copy
styles.css          the single stylesheet
assets/js/main.js   the single script (one IIFE, no dependencies)
assets/type/        two self-hosted Instrument faces, both preloaded
assets/img/         the portrait, the square avatar, the small avatar,
                    three project screenshots and their three 640px-wide
                    mobile crops (-m.png). The two client screenshots are
                    cropped to regions that carry no rating, review count,
                    price, duration, guarantee or phone number.
favicon.svg  apple-touch-icon.png  robots.txt  sitemap.xml  .nojekyll
```

## What v6 changed on top of v5

- **Serif heading layer.** Instrument Serif at 400 sets every `h1`, `h2` and
  `h3`. The italic is retired; zero elements compute `font-style: italic`.
- **A 6.55x display-to-body ratio.** The `h1` resolves to 98px at 1440 against a
  15px body, and body prose moved to `--ink-body` (the ink at 68%, 6.10:1 on
  paper) so the page reads quiet rather than shouted.
- **One easing curve, four durations.** `cubic-bezier(0.16, 1, 0.3, 1)` at
  180 / 250 / 350 / 500ms, with no exceptions.
- **A mono machine register.** The system monospace stack sets labels,
  numerals, times, URLs and index numbers, never prose. The hero is a split
  sentence: a serif clause on paper completed by a mono clause. A new rule
  block prints the literal workflow logic.
- **A numbered section index.** The nav is four slots (wordmark, index, Menu,
  text-link CTA), the drawer is the page's full numbered index at every width,
  and a 2px ink rail tracks scroll position (it survives reduced motion,
  because position is state and not motion).
- **A rebuilt booking widget** on the measured Cal.com geometry: 1040 x ~470,
  three columns at 280 / 480 / 280, an honest month grid where only the next
  eight weekdays are selectable, and a day list below 480px where a 7-column
  grid cannot make a 44px target. The submit is still `mailto:`.

## Ground rules this build holds to

- The page is complete and readable with JavaScript blocked: every FAQ row
  ships `open`, every reveal is opaque, every animated vignette renders its
  final state, and the booking block falls back to a plain email link with no
  empty calendar shell.
- No animation library. Motion is CSS transitions, CSS scroll-driven animation
  behind an `@supports` guard, IntersectionObserver, and one shared
  `requestAnimationFrame` ticker.
- `prefers-reduced-motion: reduce` stops every loop and renders final states,
  and it is watched for mid-session changes.
- Two neutral hexes (`#faf9f5`, `#141413`) at alphas, one accent per register.
- Every `<img>` carries explicit `width` and `height`, and no image is ever
  displayed above its intrinsic width.
- No fabricated metric, testimonial, client logo, rating, price or fake UI.

## Deploying

GitHub Pages serves `main` directly. This branch is `redesign/v6-refined`,
branched from `redesign/v5-premium`, and is not pushed.
