# Gap Analysis — johnmontejano.github.io vs monopo.vn

Captured 2026-09-06 at 1440×900, DPR 1, headless Chrome 152 (SwiftShader for WebGL).
monopo uses Locomotive smooth scroll, so it was driven over CDP with synthetic wheel
events; positions below are its `[data-scroll-container]` transform offsets.
All numbers are measured from the live DOM (`getBoundingClientRect` / `getComputedStyle`)
or from the captured PNGs, not estimated.

**Captures** live in
`/private/tmp/claude-501/-Users-johnmontejano-Documents-Projects-Portfolio-Portfolio-John-main/e57d67c5-264a-44bc-9015-b2c7b4ddb71a/scratchpad/gap/`
— referenced below as `<gap>/`. Copy them somewhere durable before the scratchpad is cleared.

Key frames:

| file | what |
|---|---|
| `<gap>/mono_HERO2.png` | monopo hero, settled |
| `<gap>/ours_y0.png` | our hero |
| `<gap>/CMP_hero.png` | hero side by side |
| `<gap>/CMP_work.png` | work sections side by side |
| `<gap>/CMP_type.png` | monopo manifesto vs our section heading |
| `<gap>/CMP_people.png` | monopo team vs our about |
| `<gap>/CMP_footer.png` | footers |
| `<gap>/mono_s00…s29.png` | monopo top→bottom |
| `<gap>/ours_y0…y9311.png` | ours top→bottom |
| `<gap>/mono_measure.json`, `<gap>/ours_measure.json` | raw DOM measurements |

### Headline numbers

| | monopo.vn | ours |
|---|---|---|
| Page height @1440 | 16,267 px | 10,211 px |
| Discrete content elements | 58 | 147 |
| Average vertical pitch | 1 element / 280 px | 1 element / 69 px |
| Median gap between elements | 125 px | 65 px |
| Ink coverage (vertical) | 36.6 % | 46.1 % |
| Frames carrying colour | 28 of 30 | 2 of 13 |
| Hero frame that is chromatic | 73.4 % | 27.9 % |
| Type as share of the fold (bbox) | 2.4 % | 59 % |
| Visible images | ~20 + video, all colour | 4, all `grayscale(1)` |
| Image area as share of page | ≥ 30 % | ~4 % |
| Empty-background pixel | `#000000` (range 0–0) | `#0f0f0f` (±50 noise) |
| Content column | 1078 px @ x=181 | 998 px @ x=221 |

---

## 1. Colour dies 1,500 px into the page — theirs never does

**Ranked first because it is measurable in a single glance and affects 84 % of the page.**

Sampling every capture (chromatic = pixels with channel spread > 22 and max > 40):

| our scroll y | chromatic |
|---|---|
| 0 | 18.3 % |
| 800 | 4.1 % |
| 1600 → 9311 | **0.0 %** at every position |

From y=1600 to the end — 8,600 px, **84 % of the page** — our site contains literally zero
coloured pixels. monopo never drops to zero until the deliberately white footer, and it
spikes back to 44.7 % (Saigon Souls video/tiles, `mono_s20.png`) and 40.7 % (`mono_s22.png`)
and sits at 10–15 % through the whole team section (`mono_s23–s27.png`).

Three compounding causes on our side:

- The orb is scoped to `.hero` only. Every `.block` below is flat `--bg:#000`.
- All four of our images carry `filter: grayscale(1)` (styles.css:135, 148). Colour returns
  only on hover, so a static view of the page is monochrome by construction.
- There is no coloured accent anywhere else — no tinted button, no gradient rule, no
  coloured link state. monopo's CTA pills are filled with the orb gradient itself
  (`mono_s14.png`, `mono_s21.png`), and `contact@monopo.vn` is a green→gold gradient text
  fill at 61.5 px (`mono_s29.png`).

**Close it by:** (a) dropping `grayscale(1)` from the default state and letting the work
imagery carry colour; (b) reusing the orb gradient as the fill of the primary CTA pills and
of one or two display words; (c) placing at least one more full-bleed coloured moment
somewhere between y≈4000 and y≈8000 so the lower half of the page is not a monochrome run.

`<gap>/CMP_work.png`, `<gap>/CMP_people.png`

---

## 2. The fold: they show a picture with a caption, we show a wall of type

| | monopo | ours |
|---|---|---|
| Hero headline size | 54 px | **178.56 px** (3.3×) |
| Weight / case | 400, sentence case | 400, `text-transform: uppercase` |
| Tracking | `normal` | `-0.018em` (−3.21 px) |
| Lines | 1 | 4 |
| Line-height | 75.0 px (1.39) | 135.7 px (**0.76**) |
| Width of the type block | 410 px = 28.5 % vw | 1,353.6 px = **94 % vw** |
| Height of the type block | 75 px = 8.3 % of fold | 543 px = **60 % of fold** |
| Type bbox as share of fold | 2.4 % | ~59 % |
| Also in the fold | nothing else | lead paragraph, 1 px hairline rule, 2 pill CTAs |
| Position | optically centred | bottom-anchored, flush left |

monopo's fold is an image with a small line of text floating in the middle of it. Ours is a
poster: four lines of 178 px capitals reaching to within 44 px of both edges, then a rule,
then a subhead, then two buttons. Nothing about the composition rhymes.

Note also that the hero uses a *different container from the rest of the site*:
`.hero__in{max-width:1600px;padding-inline:clamp(20px,3vw,44px)}` gives 1,352 px of usable
width, while every `.block` below uses `.wrap{max-width:1078px;padding-inline:40px}` = 998 px.
So the hero is 35 % wider than the page it introduces.

**Close it by:** dropping `--fs-display` to roughly `clamp(34px,3.8vw,56px)`, removing
`text-transform:uppercase` and the negative tracking, setting it as one or two lines
optically centred in the frame, deleting the hairline rule and the lead from the fold, and
moving the CTAs out of the hero entirely (monopo has none). Run the hero on `.wrap`'s
container, not a 1600 px one.

`<gap>/CMP_hero.png`

---

## 3. The backdrop: theirs is an object in the frame, ours is a glow in one corner

monopo renders a `<canvas>` at exactly **1440 × 900 — 100 % × 100 % of the viewport**,
`position:static`, `opacity:1`, no blend mode. What it draws is a *sphere*: there is a hard
circular silhouette arc sweeping from the top edge down through the lower right
(`mono_HERO2.png`), with tight caustic folds inside it and broader, softer bands of the same
palette outside. Palette runs forest green → sage → olive → gold → amber → bronze → near-black,
with specular highlights bright enough that the top luminance band in the frame is `#907848`
(gold) at 59 % of the brightest 2,000 pixels. Dense film grain is baked into the shader and
appears *only over the orb*.

Ours is `.orb` (styles.css:205–216): four CSS radial gradients in a 1420 × 1235 box,
`filter: blur(72px) saturate(1.3)`, `opacity: .82`, rotating ±14° over 24 s.

Measured over the frame:

| | monopo | ours |
|---|---|---|
| Frame that is chromatic | 73.4 % | 27.9 % |
| Left third chromatic | 28.4 % | **0.0 %** |
| Middle third | 39.3 % | 10.4 % |
| Right third | 35.1 % | 44.8 % |
| Brightest pixel band | `#907848` (gold, artwork) | `#f0f0f0` (100 % — it is the type) |
| Mean luma | 49.0 | 65.3 (inflated by the white capitals) |
| Edges / structure | hard circular silhouette, folds, highlights | none — a uniform blur |

The left third of our fold is pure black. Theirs is 28 % coloured. And every bright pixel in
our fold is a letterform; every bright pixel in theirs is artwork.

**Close it by:** the 72 px blur is what destroys the object. Either (a) replace with a real
WebGL/shader sphere — a radial-gradient sphere body with a masked hard edge, plus 2–3
overlapping conic/radial highlights at low blur (8–16 px) to make folds, or (b) if staying in
CSS, keep an unblurred `border-radius:50%` element with an internal multi-stop gradient as the
sphere body, blur only the *outside* wash, and push the composition so the gradient reaches all
four edges rather than pooling right of centre. Move the orb centre from `left:52%` toward the
frame centre and enlarge past 100 % on both axes.

---

## 4. Density: 147 things in 10,000 px vs 58 things in 16,000 px

| | monopo | ours |
|---|---|---|
| Page height | 16,267 px | 10,211 px |
| Content elements | 58 | 147 |
| Average pitch | 1 per 280 px | 1 per 69 px |
| Median inter-element gap | 125 px | 65 px |
| Ink coverage (vertical) | 36.6 % | 46.1 % |
| Largest empty runs | 348 px repeated ×6 between team members; multi-viewport runs at the marquee/parallax sections | 899, 367, 323, 288, 276 px, then 179 px and below |

*(Caveat: monopo's three largest gaps — 3,183 / 1,426 / 1,135 px — sit at its canvas, video and
rotated-tile marquee sections, whose absolutely-positioned children my element walker skipped.
Read those as "sections with no measurable text", not as literal voids. The 348 px repeated
team gaps and the 125 px median are solid.)*

Our page is **4× denser per pixel of scroll**. Concretely: monopo puts 275 px of black between
the "Selected project" label and the first project image, and another ~250 px between the hero
and that label (`mono_s04.png`). We put a 62 px marquee immediately under the hero and then a
144 px section pad.

**Close it by:** raising `--pad-block` from `clamp(80px,10vw,168px)` to roughly
`clamp(140px,15vw,280px)`, raising `--gap-section` from 46 px to ~120 px, and — more
importantly — *cutting elements*. Four leak cards, four how-it-works cards, six workflow rows,
three work cases, eight FAQ rows and a two-column booking block is more discrete content than
monopo's whole homepage carries.

`<gap>/CMP_type.png`

---

## 5. Boxes and repeated section furniture — monopo has none of either

**monopo has zero borders and zero boxes on the entire page.** No card outlines, no grid
rules, no containers. Content is separated by empty black only. The single exception is one
full-width 1 px hairline between manifesto items (`mono_s17.png`), and hairlines under the
footer columns.

Ours draws boxes constantly:

- `.grid2` — `gap:1px; background:var(--hair); border:1px solid var(--hair)` — a 1 px-ruled
  2×2 table (`ours_y800.png`)
- a 4-column bordered grid for "how it works" (`ours_y5600.png`)
- a 3-cell bordered stat block on LISA (`ours_y4000.png`)
- a 2-column bordered booking block (`ours_y9311.png`)
- pill-outlined tag chips throughout

And every section repeats the *same* header device: an 89.28 px ALL-CAPS heading + a
full-width 1 px rule + a right-aligned `0N / LABEL` index. **Eight times.** By the third one it
reads as a template.

monopo announces a section with an 11.95 px bold label preceded by a `→` glyph, at the left
margin, and nothing else — no rule, no number, no giant word. Its only large display type is
the manifesto, used **once**, at 94.46 px.

**Close it by:** delete `border` and the 1 px `gap`-as-rule from `.grid2` / `.grid4` / the stat
block and let whitespace do the separating; replace the eight section headers with monopo's
`→ Label` at 12 px; keep exactly one 90 px+ display moment on the page.

---

## 6. Case and tracking: we shout in condensed capitals, they speak in sentence case

Measured across every text node:

| | monopo | ours |
|---|---|---|
| Letter-spacing | `normal` on **100 %** of text | `-0.018em` display, `-0.014em` h2, `-0.01em` h3, `+0.09em` labels, `+0.16em` wordmark |
| Uppercase | only 10.5–12 px labels and nav | **every** heading: `.display` and `.h2` both set `text-transform:uppercase` |
| Display line-height | 1.16 (manifesto) | **0.76** (`.display`), 0.80 (`.h2`) |
| Weight range in use | 200–400 | 200–500 |
| Fonts | Roobert (+ Raleway for Vietnamese) | Switzer |

Roobert and Switzer are close cousins, so the typeface is not the problem — the *setting* is.
Their 94 px manifesto line breathes at 1.16 line-height in sentence case; our 89 px section
heads are jammed at 0.76–0.80 with negative tracking and forced capitals, which turns every
heading into a solid block. And the uppercase + `-0.014em` combination is exactly the
"condensed poster" look monopo never uses.

**Close it by:** remove `text-transform:uppercase` from `.display` and `.h2`; set
`letter-spacing:normal` everywhere except the 11 px labels (and even there, drop `+0.09em` to
about `+0.02em` — monopo's 10.5 px nav uses `normal`); raise `.display`/`.h2` line-height from
0.76/0.80 to ~1.05–1.15.

---

## 7. Imagery: 4 grayscale screenshots vs a gallery

| | monopo | ours |
|---|---|---|
| Project images | 8 at **506.3 × 554.3** (ar 0.91, portrait), `object-fit:cover`, full colour | 3 browser screenshots at 453.6 × 283.5 and 499 × 311.9 (ar 1.6, landscape), `object-fit:**contain**`, `grayscale(1)` |
| Portraits | 6 at 607.6 × 665.1 | 1 at 384 × 480, `grayscale(1)` |
| Other | ~30 tiles at 844 × 844 in a 45°-rotated marquee; one 1077.7 × 889.5 full-width; a full-bleed video | none |
| Share of page area | ≥ 30 % | ~4 % |
| Layout | two columns at x=181 and x=751, **staggered ~275 px vertically** | left/right alternating, aligned |

Two problems beyond the count. First, `object-fit: contain` on the work shots means the image
does not fill its frame — the FastFix panel in `ours_y3200.png` is a ~90 px band of content
floating in a 278 px-tall grey box, with dead space above and below. monopo's `cover` crops
tight so the photograph *is* the block. Second, their columns are offset vertically by ~275 px,
which is most of what makes their grid feel composed rather than tabular (`mono_s07.png`); ours
are baseline-aligned rows.

**Close it by:** switch to `object-fit:cover` with a portrait aspect near 0.9 (e.g.
`aspect-ratio: 506/554`), drop the default grayscale, and offset the right column down by
~250–280 px. Real photography — even one or two frames — would move this further than anything
else on the list.

`<gap>/CMP_work.png`

---

## 8. Navigation — and a live overprinting bug

| | monopo | ours |
|---|---|---|
| Header height | 66.2 px, `position:fixed`, transparent | 70 px, `position:fixed`, transparent |
| Link size | **10.512 px**, uppercase, `letter-spacing: normal` | 12 px, uppercase, `+0.06em` |
| Arrangement | 5 items in a **vertical right-aligned stack**, 26.2 px step, y = 49.5 / 75.7 / 101.9 / 128.1 / 154.3 | 5 items in a horizontal row, centred, 28 px gap |
| Extras | wordmark left at x=181; centred `EN / VN / 中文` language row at x=860–945; rotating "SCROLL DOWN" badge, 80 px, bottom-left at (180, 730) | white pill CTA at right |
| Desktop hamburger | none (burger and the 75 px overlay menu are mobile-only — both measure 0×0 at 1440) | none |

The vertical right-hand nav stack is one of monopo's most identifiable features and we have no
counterpart to it.

**Separately, our header is broken on the live site.** `.nav` is
`position:fixed; mix-blend-mode:difference` (styles.css:190) with **no background and no scroll
handler anywhere in `assets/js/main.js`** — nothing hides, shrinks or backs it. It therefore
overprints body copy at essentially every scroll position: visible in `ours_y800.png`
(over the hero lead and the wordmark), `ours_y2400.png`, `ours_y5600.png` (over the leak grid),
`ours_y7200.png` (over the about paragraph), `ours_y9311.png` (over the booking block). The
`difference` blend makes each collision invert, which reads as a rendering fault. monopo never
collides because its content starts ~250 px below the header everywhere.

**Close it by:** move the nav links into a right-aligned vertical stack at 10.5 px with normal
tracking; drop `mix-blend-mode:difference`; and either add a hide-on-scroll-down handler or
guarantee ≥180 px of clear space at the top of every section.

---

## 9. Grain: theirs is inside the orb, ours is over the whole page

`.grain` (styles.css:75) is a `position:fixed` SVG-turbulence overlay at `opacity:.16` across
the entire viewport, animated at 900 ms steps.

Measured on flat background regions:

| | monopo | ours |
|---|---|---|
| Empty dark background | `#000000`, pixel range **0–0** (perfectly flat) | `#0f0f0f`, range 6–57 (**±50 levels of noise**) |
| Light register background | `#ffffff`, range 255–255 | `#f4f4f3` with visible noise |

monopo's grain is baked into the WebGL shader, so it exists only where the orb exists; its
empty black is mathematically pure and its white footer is pure `#fff`. Our global overlay
lifts black to `#0f0f0f` and dirties white to `#f4f4f3`, which is a large part of why our page
reads flatter and greyer than theirs even in sections that are structurally similar.

**Close it by:** scope `.grain` to `.hero` (or to the orb element) instead of `position:fixed`
over the document, or drop its opacity to ~0.05 outside the hero. The dark register should
resolve to a true `#000` and the light register to a true `#fff`.

---

## 10. Present on theirs, absent on ours entirely

- **A rotating circular "SCROLL DOWN" badge**, ~80 px, bottom-left of the hero, with the
  monogram at its centre (`mono_HERO2.png`).
- **A bilingual rotating hero line** — the headline cycles English → Vietnamese
  ("United, Unbound" → "Hội tụ, Không giới hạn" → "Tokyo-born, Creative studio" →
  "Creative studio, Đến từ Tokyo") with a per-letter italic accent (the `i` in "Un*i*ted",
  "Creat*i*ve stud*i*o") — see `mono_s00.png`, `mono_s02.png`, `mono_HERO2.png`.
- **A word-by-word scroll-driven colour reveal** on the 94 px manifesto: words shift from
  ~`#555` to `#fff` as they cross the viewport, mid-word (`mono_s14.png`, `mono_s15.png`).
- **Animated 3D glass-orb letterforms** as manifesto illustrations — a rendered "m", "p", etc.
  in the brand gradient, paired with 36 px body copy carrying a hanging `01 / 02 / 03`
  (`mono_s17.png`).
- **Gradient-filled CTA pills** — the orb palette used as the button fill, not white
  (`mono_s14.png`, `mono_s21.png`).
- **A giant horizontal text marquee** at ~200 px+ running edge to edge (`mono_s19.png`).
- **A 45°-rotated tile marquee** of 844 × 844 imagery (`mono_s21.png`).
- **A full-bleed video** section.
- **A "They trust us" client-logo statement** set as a 54 px centred paragraph of brand names
  (`mono_s12.png`).
- **Gradient text fill** on the contact email at 61.5 px (`mono_s29.png`).
- **A hover `+` affordance** on team cards and a `(1) … (5)` index (`mono_s24.png`, `mono_s27.png`).
- **A circular back-to-top button**, bottom-right of the footer (`mono_s29.png`).
- A **language switcher** (not applicable to us, but it is part of the header's composition).

Ours has, with no counterpart on theirs: an industry-name ticker directly under the hero, 1 px
bordered card grids, per-section `0N / LABEL` indices, an accordion FAQ, and a 208 px
`MONTEJANO` outline wordmark in the footer.

---

## Suggested order of work

The first three items produce most of the visual change:

1. **Rebuild the hero.** Display type from 178 px → ~54 px, sentence case, normal tracking,
   one line, optically centred; delete the rule, lead and CTAs from the fold; make the orb an
   object with an edge that fills 100 % × 100 % of the frame.
2. **Get colour past the fold.** Remove default `grayscale(1)`; use the gradient on CTA pills
   and one display moment; add a second full-bleed coloured section in the lower half.
3. **Halve the element count and double the air.** `--pad-block` → ~`clamp(140px,15vw,280px)`,
   `--gap-section` → ~120 px, cut the bordered grids, cut the repeated section headers down to
   a 12 px `→ Label`.
4. Fix the nav (vertical right stack at 10.5 px; remove `mix-blend-mode:difference`; stop the
   overprinting).
5. `object-fit: cover`, portrait aspect ~0.91, and a ~275 px stagger on the work grid.
6. Scope the grain to the hero so black is `#000` and white is `#fff`.
