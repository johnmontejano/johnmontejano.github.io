# John Montejano — portfolio (v5, "Paper and Machine")

A static one-pager. Plain HTML, one stylesheet, one vanilla JS file. No build
step, no bundler, no npm install, no framework, no runtime CDN dependency.

## Run it

From this directory:

```
python3 -m http.server 8777
```

Then open <http://localhost:8777/>.

Any static file server works; the page has no server-side requirements. Opening
`index.html` directly with `file://` also renders, but the self-hosted fonts and
the `fetch`-free JS behave more like production over HTTP.

## What is here

```
index.html          all markup and all copy
styles.css          the single stylesheet
assets/js/main.js   the single script (one IIFE, no dependencies)
assets/type/        two self-hosted Instrument faces, both preloaded
assets/img/         the portrait, the avatar, three project screenshots
                    and their three 640x800 mobile crops (-m.png)
favicon.svg  apple-touch-icon.png  robots.txt  sitemap.xml  .nojekyll
```

## Ground rules this build holds to

- The page is complete and readable with JavaScript blocked: every FAQ row
  ships `open`, every reveal is opaque, every animated vignette renders its
  final state, and the booking block falls back to a plain link.
- No animation library. Motion is CSS transitions, CSS scroll-driven animation
  behind an `@supports` guard, IntersectionObserver, and one shared
  `requestAnimationFrame` ticker.
- `prefers-reduced-motion: reduce` stops every loop and renders final states,
  and it is watched for mid-session changes.
- Two neutral hexes (`#faf9f5`, `#141413`) at alphas, one accent per register.
- Every `<img>` carries explicit `width` and `height`, and no image is ever
  displayed above its intrinsic width.

## Deploying

GitHub Pages serves `main` directly. This branch is `redesign/v5-premium` and
is not pushed.
