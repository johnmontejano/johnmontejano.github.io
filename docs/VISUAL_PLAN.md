# Visual Plan — cut the reading, show the work

Measured 2026-09-07 against `index.html` @ `main`, headless Chrome 1440×900
(document 1440 × 11,863), `--virtual-time-budget=20000`. Every number below is
read from a rendered DOM (`getBoundingClientRect`, `innerText`, `naturalWidth`),
not estimated. Reading speed 240 wpm. Replacement copy word counts were counted
by the same tokeniser, not eyeballed.

**Governing feedback (John, on record):** "it's not visual enough. Most people
don't have time to be looking at text for so long", and earlier: "people don't
have time to be reading paragraphs and guessing what you do", "this needs to
look high tech", and one section that "could actually have a lot of potential
but it's not very visual".

---

## Hard constraint carried into every item below

`memory/CURRENT_STATE.md` logs a **critical eval failure on v6, criterion 17
("no fabricated facts")** — the work screenshots had a star rating, review
count, price, duration, guarantee and a phone number baked into the pixels,
invisible to a DOM audit and only catchable by looking at the image. Nothing in
this plan may reintroduce that class of asset.

**Banned outright:** invented dashboards, fake app UI, mock analytics, sample
inboxes, star ratings, review counts, testimonials, client logos, invented
metrics, "trusted by" rows, before/after figures that were never measured, and
any image a stranger could mistake for a record of a real customer or result.

**Encouraged:** atmospheric documentary photography of the trades; diagrams
drawn from rules John actually operates; motion applied to text that is already
true; animated counting of numbers that already exist on the page **with their
existing attribution intact**; real, unaltered captures of the three live sites
he actually built.

Test before any asset ships: *could a stranger mistake this for evidence that
something happened?* If yes, it does not ship.

---

## 1. Current text load, measured

Totals: **940 words**, **235 seconds of reading (3 min 55 s)**, **4 images on an
11,863 px page**.

Image footprint, measured: 434×271 + 478×298 + 434×271 + 320×400 =
**505,672 px² of a 17,082,720 px² page = 3.0 %**. The hero orb adds ~6.9 %.
**Eight of the twelve sections contain no visual element of any kind.**

| # | Section | Words | Paras | Longest para (words) | Text ink % of section | Visual % of section | Read (s) |
|---|---|---|---|---|---|---|---|
| — | `nav` | 10 | 0 | — | 4.3 | 0 | 2.5 |
| — | `#top` hero | 8 | 0 | — | 13.0 | 178\* | 2.0 |
| — | `.mq` marquee | 42 | 0 | — | 0 | 0 | 10.5 |
| — | `#intro` | 24 | 1 | 15 | 10.5 | **0** | 6.0 |
| 01 | `#leak` | 101 | 6 | 18 | 14.0 | **0** | 25.3 |
| 02 | `#automate` | 85 | 8 | 21 | **43.8** | **0** | 21.3 |
| 03 | `#work` | **157** | 9 | **32** | 11.6 | 10.5 | **39.3** |
| 04 | `#instead` | 59 | 13 | 6 | 28.5 | **0** | 14.8 |
| 05 | `#how` | 84 | 5 | 15 | 20.0 | **0** | 21.0 |
| 06 | `#who` | 58 | 3 | 30 | 25.7 | 10.1 | 14.5 |
| 07 | `#questions` | **145** | 7 | 26 | **43.8** | **0** | 36.3 |
| 08 | `#book` | 131 | 10 | 24 | 24.7 | **0** | 32.8 |
| — | `footer` | 36 | 4 | 7 | 30.7 | 0 | 9.0 |
| | **Total** | **940** | **61** | | | | **235.3** |

\* the hero orb layer overflows its section box, hence >100 %.

### The image defect no DOM check can see

Measured `naturalWidth`/`naturalHeight` against the painted box at 1440:

| Image | Intrinsic | Box | Actually painted | % of its box |
|---|---|---|---|---|
| `work-fastfix.webp` | 1250×280 | 434×271 | **434×97** | **35.8 %** |
| `work-gelatotech.webp` | 800×500 | 478×298 | 478×298 | 100 % |
| `work-lisa.webp` | 1600×1000 | 434×271 | 434×271 | 100 % |
| `jm-portrait.webp` | 900×1124 | 320×400 | 320×400 | 100 % |

The FastFix capture is a 1250×280 letterbox strip — what survived v6's
fabricated-facts crop — floating as a 97 px band inside a 271 px grey box. The
LISA capture is a whole-page shot squeezed to 434 px wide, so its type renders
at roughly 4 px and is unreadable. The portrait is 320 px on a 1440 px canvas
and cuts John's face at the eyeline. **The three pieces of real proof on this
page are the three least legible objects on it.**

Also confirmed: `.orb-gl` measures **0×0** in a headless render — the WebGL orb
never initialises, so the fold is a static CSS gradient. Open item in
`memory/NEXT_STEPS.md` §1.

Corroborating figures already in `docs/GAP_ANALYSIS.md`: image area as a share
of page — reference ≥30 %, ours ~4 %. Type as a share of the fold — reference
2.4 %, ours 59 %. From y=1,600 to the bottom (84 % of the page) there are zero
chromatic pixels.

---

## 2. Targets, and what they actually come out at

The copy in §3 was written first and then counted. These are the counted
results, not aspirations.

| | Now | New | Change |
|---|---|---|---|
| Total rendered words | 940 | **531** | **−44 %** |
| Skimmable prose (excl. nav, marquee, legal footnote) | 888 | **447** | **−50 %** |
| Read time (prose only, 240 wpm) | 3 min 42 s | **1 min 52 s** | −50 % |
| Read time (everything on the page) | 3 min 55 s | **2 min 13 s** | −44 % |
| Sections with zero visual | 8 of 12 | **0** | — |
| Longest paragraph | 32 words | **13 words** (legal footnote exempt) | −59 % |
| Image + motion area as share of page | ~10 % | **≥30 %** | ×3 |

**Why the total lands at −44 % and not −50 %:** 84 of the remaining words are
structurally fixed and cannot be cut — the nav (10), the trade marquee (42,
which is a moving object and costs nothing to skim) and LISA's non-affiliation
disclaimer (32, a legal statement kept verbatim). Against everything a visitor
actually has to *read*, the cut is exactly half.

| Section | Now | New | Cut |
|---|---|---|---|
| `nav` | 10 | 10 | 0 % — fixed |
| `#top` hero | 8 | 8 | 0 % — already right |
| `.mq` marquee | 42 | 42 | 0 % — moving object |
| `#intro` | 24 | 16 | −33 % |
| 01 `#leak` | 101 | 46 | −54 % |
| 02 `#automate` | 85 | 43 | −49 % |
| 03 `#work` | 157 | 78 | −50 % |
| 03 legal footnote | (in 157) | 32 | verbatim, exempt |
| 04 `#instead` | 59 | 35 | −41 % |
| 05 `#how` | 84 | 42 | −50 % |
| 06 `#who` | 58 | 31 | −47 % |
| 07 `#questions` | 145 | 70 | −52 % |
| 08 `#book` | 131 | 60 | −54 % |
| `footer` | 36 | 18 | −50 % |
| **Total** | **940** | **531** | **−44 %** |

---

## 3. Section by section

Ranked in §4; presented here in page order.

---

### HERO `#top` — 8 → 8 words

**Keep the copy.** It is the best thing on the site. The problem is that the
backdrop is a still: `.orb` is CSS radial gradients on a 24 s rotate and
`.orb-gl` measures 0×0, so nothing behind the headline actually moves.

**Replace with:** a full-bleed 10-second seamless video loop under the headline
(`object-fit:cover`, muted, `playsinline`, `poster` still, paused under
`prefers-reduced-motion`), with the iridescent orb kept as a `screen`-blended
colour layer on top. This is the "high tech" moment, and it is atmosphere — it
asserts nothing.

> You run the jobs.
> The office runs itself.

**Asset:** `A1` (video, 10 s, ≥1920×1080, H.264 + WebM, ≤3 MB).

---

### `#intro` — 24 → 16 words

Today: a 15-word lead and two buttons alone in 494 px of black. 10.5 % text,
0 % visual — a dead viewport at the most expensive position on the page.

**Replace with:** an **animated flow strip**. Four hairline nodes on one
horizontal rule — `answers → quotes → chases → books` — with a luminous dot
travelling the rule on a 6 s ambient loop and a scroll-linked draw-in. The four
verbs stop being a clause and become a mechanism. Inline SVG, ~4 KB.

> **I build the system. You stay on the job.**
>
> `answers` → `quotes` → `chases` → `books`
>
> `[Book 30 minutes]`

Both claims in the current lead survive: the system does those four things, and
it does them while he's on the job. The second CTA goes — it duplicates the nav
anchor two rows above it.

**Asset:** `D1` flow strip (built, not generated).

---

### 01 `#leak` — 101 → 46 words

Today: 1,384 px tall, 25 s of reading, **zero visual**, and four cells that each
say the same thing twice — a headline, then a body sentence restating it. This
is the section John's earlier note fits best: real potential, not visual.

**Replace with:** four **photographs**, one per leak, each carrying the existing
headline as its caption. The body sentences go. 4:5 portrait plates, colour,
grain, staggered ~120 px vertically so the grid reads as a composition rather
than a table. One piece of honest micro-motion: a mono clock in the section
header ticking `6:58 → 7:04` on scroll-in. It references the copy's own "7pm"
and "7:04pm" and asserts nothing external.

> `01 / Leaks`
> ## Four leaks
> Four hours a week, none of it your work.
>
> `01 Missed calls` — **The 7pm call nobody caught.**
> `02 Double entry` — **Typed here. Typed again there.**
> `03 Dead quotes` — **It died of silence, not a no.**
> `04 No-shows` — **The 2pm that never showed.**

Four headlines unchanged. Lead compressed 18 → 9 words, keeping both claims
(the recurring hours, and that it is not the work you were hired for).

**Assets:** `A2` `A3` `A4` `A5` + `D2` clock tick.

---

### 02 `#automate` — 85 → 43 words

Joint-densest type block on the page (43.8 % text ink), zero visual — and
**already a diagram wearing a paragraph's clothes**. Cheapest large win on the
site: no photography, no asset pipeline, no new claim.

**Replace with:** keep the six rules; make them run. On scroll-in each arrow
draws left→right over 350 ms with a 60 ms stagger, the trigger side sits at
55 % opacity and the action side resolves to full white as the arrow lands, then
a single dot travels the six rows top to bottom on a slow ambient loop. Rules
shortened to two-beat tokens so the column reads as a register.

> `02 / Automated`
> ## If it happens twice, it happens without you
>
> `job created` → `quote sent`
> `quote unanswered` → `chased at 48 hours`
> `job booked` → `calendar blocked`
> `work complete` → `invoice sent`
> `invoice paid` → `review requested`
> `needs judgment` → `comes to you`
>
> Your accounts. Judgment stays with you.

Every rule keeps its meaning, including the sixth (human in the loop) and the
"accounts you already own" claim. Trailing paragraph 21 → 6 words.

**Asset:** `D3` rule-register animation (CSS + IntersectionObserver, no library).

---

### 03 `#work` — 157 → 78 words (+ 32-word legal footnote, verbatim)

**The worst section on the page and the most important.** 2,504 px, 39 s of
reading, 9 paragraphs, a 32-word block, and three pieces of real proof rendered
at 434 px wide with one painting at 36 % of its own box.

**Replace with, in order of impact:**

1. **Re-capture all three sites at portrait viewport** (900×1120, DPR 2), then
   `object-fit: cover` at `aspect-ratio: 506/554`, rendered ~560 px wide, right
   column staggered 275 px down. These are genuine, unaltered captures of live
   sites John built — real evidence, correctly sized for the first time. FastFix
   must be **re-shot, not re-scaled**: a portrait capture removes the letterbox
   without touching a pixel of content.
2. **One atmospheric plate per project**, paired beside the capture as a second
   frame, labelled `Context` — never as a customer, a job or a result.
3. **Animate the three LISA figures** counting up over 700 ms on scroll-in. They
   already exist on the page and already carry their attribution; the
   attribution line stays directly beneath them.
4. One line of description each.

> `03 / Work`
> ## Three things I built and still run
>
> `01 My product, founder`
> ### FastFix.ai
> Booking, quotes, invoices for home services. My code, live.
> `Live` · fastfix.ai ↗
>
> `02 Owner-operator`
> ### GelatoTech
> Device repair, San Francisco. My calls, my repairs, my invoices.
> `Every call` · gelatotech.com ↗
>
> `03 Client, design and build`
> ### LISA
> Startup accelerator run by Stanford GSB LEAD alumni. I built the site.
> **220+** startups supported · **42** countries · **200+** mentors
> `Figures published by LISA on their own site.`
> `Design and build` · gsb-lead-lisa.com ↗
>
> `LISA is an independent program created and operated by alumni of the LEAD program. It is not affiliated with, endorsed by, or sponsored by Stanford University or Stanford Graduate School of Business.`

The non-affiliation disclaimer is **kept word for word** and excluded from the
target — it is a legal statement, not copy. The LISA attribution line stays
attached to the figures. "My product, my code" survives as the label `My
product, founder` plus "My code, live". GelatoTech's three-verb claim (calls,
repairs, invoices) survives intact.

**Assets:** `C1` `C2` `C3` re-captures + `A6` `A7` `A8` plates + `D4` count-up.

---

### 04 `#instead` — 59 → 35 words

Two five-item lists, 13 paragraph-level nodes, zero visual. Recurring cost
versus one-time cost is inherently a picture and is currently prose.

**Replace with:** a **before/after bar diagram** — left, twelve stacked hairline
bars (one per month) building in sequence; right, a single bar. **No values
printed on either**, because no figure exists to print. The left column's items
strike through on scroll-in as the right column's light up.

> `04 / Instead`
> ## Skip the next hire. Build the system.
>
> `Another hire` — Monthly salary · Payroll tax · Training weeks · Turnover · Forty hours, then stops
> `One built system` — One invoice · 7:04pm, Sundays · Taught once · Never quits · Every follow-up

Smallest cut on the page (−41 %) because the items are already near-atomic; the
diagram is doing the work here, not the editing.

**Asset:** `D5` recurring-vs-once bars (SVG, valueless).

---

### 05 `#how` — 84 → 42 words

Four steps, each a heading plus a sentence restating it. Zero visual.

**Replace with:** a four-node **progress rail** filling as the section scrolls
(`@supports (animation-timeline: view())` with an IntersectionObserver
fallback), plus a four-frame **icon sequence** in the same 1px hairline as the
rest of the register — a cursor on a time slot, a phone handset, a folded map
sheet, a running rule.

> `05 / How`
> ## Book it. Map it. Build it. Own it.
>
> `01` **Pick a time.** Two minutes.
> `02` **Walk me through your week.** Free. No pitch.
> `03` **Get your map.** Yours either way, two days.
> `04` **I build it. It runs.** Your accounts.

Claims kept: two minutes, free and no pitch, yours either way within two days,
built in accounts you own. "Judgment calls come to you" is dropped here only
because rule six in §02 already states it — no claim is lost from the page.

**Asset:** `D6` progress rail + icon sequence (SVG).

---

### 06 `#who` — 58 → 31 words

The portrait is 320×400 — 10 % of its section — and crops at the eyeline. The
section also carries two headings that say the same thing.

**Replace with:** the **same real photograph at four times the area** — 3:4 at
~600 px wide, `object-fit: cover` anchored on the eyes, colour retained, text
set beside it at half its length. **No generated portrait of John may ever be
used** (`memory/DECISIONS.md`, 2026-07-23). A better frame is a photo shoot, not
a prompt — brief at `P1`. Drop the duplicated `h2`.

> `06 / Who`
> ## I ran a service business before I automated one.
> It broke on me first. You talk to the person who writes it.
> `San Francisco, CA` `Solo`
> `[Book 30 minutes]`

**Asset:** `P1` portrait re-shoot brief (photography, not generation).

---

### 07 `#questions` — 145 → 70 words

Joint-densest ink on the page (43.8 %), 36 s of reading, zero visual, and every
answer restates its question before answering it.

**Replace with:** two moves. (a) Questions shortened to the thing being asked
and answers cut to their first sentence — five of six already open with the
answer word, so the rest is padding. (b) A **two-column accordion** with a
hairline drawing across on open and a `+`/`−` rotating 90° in 250 ms. This
section does not need photography; it needs to stop being a wall. Six questions
stay — cutting one loses a claim.

> `07 / Questions`
> ## Before you book
>
> **Replace my people?** No. Retyping and chasing come off their plate.
> **Not technical?** Fine. Plain English. Every account in your name.
> **Only for trades?** No. Any business where customers book a time.
> **Cost?** Call and map free. Builds quoted first.
> **Have you run one?** Yes. FastFix.ai is mine. I ran GelatoTech in SF.
> **What if nothing's worth automating?** I'll say so. You keep the map.

**Asset:** `D7` accordion motion (CSS).

---

### 08 `#book` — 131 → 60 words

The conversion point, guarded by 33 s of prose. The 00–10 / 10–25 / 25–30
agenda is a timeline that has been written out as sentences.

**Replace with:** an **animated 30-minute bar** — one horizontal rule divided
0–10 / 10–25 / 25–30, each segment filling in sequence on scroll-in with its
label above it. It diagrams an agenda John sets himself, so it asserts nothing
external. Keep the slot grid (already a visual object). Mailto note to one line.

> `08 / Book`
> ## Take a slot. Take the map.
>
> `Workflow assessment` — **Thirty minutes. Free. You keep the map.**
> `00–10` You talk. A normal week.
> `10–25` I dig. One customer, call to cash.
> `25–30` What to automate first, and what it costs.
> Video or phone. Pacific.
>
> `Windows` — [slot grid] — [Name] [Business + what you do] `[Open the email ↗]`
> Opens an email. You press Send.
> johnmontejano2@gmail.com

The "nothing is submitted to this page" reassurance compresses to "You press
Send", which carries the same meaning: it isn't booked until the visitor acts.

**Asset:** `D8` thirty-minute timeline bar (SVG).

---

### `footer` — 36 → 18 words

Links and the giant `Montejano` mark. Drop the duplicated CTA heading to one
line. Lowest priority on the page.

> **One call. One map.** `[Book 30 minutes]`
> `Live work` fastfix.ai · gelatotech.com · gsb-lead-lisa.com
> `Contact` johnmontejano2@gmail.com · LinkedIn · San Francisco, CA

---

## 4. Ranking — where the effort pays

| Rank | Section | Words | Read cut | Why it ranks here |
|---|---|---|---|---|
| **1** | 03 `#work` | 157 → 78 | −20 s | The only proof on the site, and all three assets are currently illegible — one paints at 36 % of its box, one is a whole page crushed to 434 px. Re-capturing them changes the page more than any other single edit. Hiring managers judge this section; owners skim it for "has he actually done it". |
| **2** | 01 `#leak` | 101 → 46 | −14 s | 1,384 px of pure type describing four things that are inherently photographs. Answers "guessing what you do" head-on — a plumber sees a phone ringing on an empty counter at 7pm and needs no sentence. Best ratio of visual payoff to effort on the page. |
| **3** | 02 `#automate` | 85 → 43 | −11 s | Already 90 % a diagram. Animating the six arrows is the cheapest "high tech" win available: no photography, no asset pipeline, no new claim, and it is the section that most literally shows what he sells. |
| **4** | 08 `#book` | 131 → 60 | −18 s | It is the conversion point and 33 seconds of prose stands in front of it. The agenda is a timeline written as sentences; drawing it removes most of the words for free. |
| **5** | 07 `#questions` | 145 → 70 | −19 s | Densest ink on the page. Needs no imagery — just answers that stop restating their questions, and an accordion that moves when touched. |
| 6 | Hero | 8 → 8 | 0 | No words saved, but `.orb-gl` renders 0×0 and the fold is a still. Largest perception change per byte on the site. |
| 7 | 05 `#how` | 84 → 42 | −11 s | Four restated sentences; a progress rail and four icons carry it. |
| 8 | 04 `#instead` | 59 → 35 | −6 s | Small, but the idea is a bar chart trapped in two bullet lists. |
| 9 | 06 `#who` | 58 → 31 | −7 s | Mostly an asset-sizing fix (320 px → 600 px) plus one duplicated heading. |
| 10 | `footer` | 36 → 18 | −5 s | Housekeeping. |

---

## 5. Asset schedule

### House look — append verbatim to every photography prompt

> **House look:** near-black ground (#000–#0a0a0a), a single warm practical
> light source, deep shadow occupying most of the frame, shallow depth of field
> (f/1.4–f/2, focus plane ~15 cm deep), 35 mm or 50 mm perspective, fine
> analogue film grain, slight halation on highlights, muted desaturated palette
> with one warm accent, documentary reportage — not stock photography, not
> advertising, nothing staged or smiling. **No text, no signage, no numbers, no
> screens showing readable interface, no logos, no brand marks, no faces, no
> identifiable people.** Colour, not monochrome. 4:5 portrait, 2000×2500.

---

**`A1` — Hero loop (video, 10 s seamless, 1920×1080 landscape)**

> A worn wooden workshop bench in a dark garage at night, seen from just above.
> A single hanging bulb out of frame throws warm amber light across one third of
> the bench; the rest falls to near black. Slow, almost imperceptible camera
> drift left to right over 10 seconds, seamlessly loopable. Dust motes moving
> through the light. A phone lies face up on the bench and its screen glows
> softly on and off once during the loop, lighting the grain of the wood — the
> screen is pure diffuse light with nothing legible on it. Warm tungsten key
> against cool blue ambient from a window far behind. Anamorphic lens character,
> gentle halation, 16 mm film grain, shallow depth of field with the bench edge
> sharp and the background dissolving. No hands, no people, no text, no logos.
> *House look applies, 16:9 landscape instead of 4:5.*

**`A2` — Leak 01, missed calls (4:5)**

> A cordless landline handset sitting in its cradle on a cluttered reception
> counter, photographed at counter height in an empty shop after closing. The
> handset's indicator light glows a single warm point of red. Evening light from
> one window camera-left, low and orange; everything past the counter falls into
> black. An unattended stool, a roll of receipt paper, a set of keys. Nobody
> present. The frame should feel like the moment just after the ringing stopped.
> *House look.*

**`A3` — Leak 02, double entry (4:5)**

> Two identical paper job tickets on a metal clipboard on a van's passenger
> seat, the same handwriting filled in twice, photographed close and at an angle
> so the writing reads as *marks* but never as *words* — out of focus past the
> first few centimetres. A pen lies across them. Late-afternoon sun through a
> windscreen lays one hard warm stripe across the paper; the footwell below is
> black. Grain, dust on the dashboard vinyl. *House look.*

**`A4` — Leak 03, dead quotes (4:5)**

> A single folded printed estimate lying forgotten on a workbench beside a
> coiled tape measure, its corner curled, a fine layer of dust on the top
> surface catching a low warm sidelight. The bench beyond dissolves into black.
> The paper is blank or its print entirely illegible — no readable line items,
> no figures, no letterhead. Still, quiet, faintly sad. *House look.*

**`A5` — Leak 04, no-shows (4:5)**

> One empty chair in a small waiting area, shot from across the room at eye
> level. Warm 2pm sun through a blind lays hard horizontal bars of light across
> the empty seat; the rest of the room is deep shadow. A magazine face down on
> the seat beside it. Nobody there. Dust visible in the light bars.
> *House look.*

**`A6` — Work context, FastFix (4:5) — labelled `Context`, never as a customer**

> A white service van parked on a residential street at blue hour, seen
> three-quarter from behind. Its rear doors stand open; warm interior light
> spills onto racked tools and coiled hose. Sodium streetlight above, cold blue
> sky behind, wet asphalt catching both. The van's panels are entirely plain —
> no livery, no lettering, no numbers, no logos of any kind. *House look.*

**`A7` — Work context, GelatoTech (4:5) — labelled `Context`**

> An electronics repair bench photographed from directly above: an anti-static
> mat, a screwdriver set laid out in order, tweezers, a magnifying lamp throwing
> a tight warm pool of light onto the mat, a disassembled unnamed device with
> its back panel off beside a small tray of screws. Everything outside the
> lamp's pool falls to black. Fingerprints on the mat, solder marks, real use.
> No branding on any component, no screens switched on, no text. *House look.*

**`A8` — Work context, LISA (4:5) — labelled `Context`**

> An empty seminar room at night: a horseshoe of chairs around tables, one
> pendant light left on over the near table throwing warm light across notebooks
> and paper cups, the far end of the room in complete darkness. Chairs pushed
> back at angles, as if a session just ended. A blank wiped whiteboard catching
> a faint reflection. No writing, no slides, no screens, no people.
> *House look.*

**`A9` — Marquee tiles (set of 10, square 1:1, 1600×1600)**

Feeds the 45°-rotated tile marquee scoped in `memory/NEXT_STEPS.md` §2. Same
house look, square crop, one prompt per line:

> 1. A pipe wrench and a headlamp on a wet concrete floor, one warm work light.
> 2. A dental chair in an unlit surgery, one overhead lamp warm on the headrest.
> 3. A rooftop condenser unit at dusk, warm sun on one fin bank, sky going cold.
> 4. A salon station: scissors and clips on a folded towel, mirror bulbs warm, room dark.
> 5. An open consumer unit with a voltage tester resting on it, torchlight from one side.
> 6. A mop bucket and a folded cloth in a dark office corridor, one exit-sign glow.
> 7. A treatment-room trolley with rolled towels, one warm lamp, everything else black.
> 8. A car on a two-post lift seen from below, inspection lamp warm on the underside.
> 9. A stack of roof tiles at first light on scaffolding boards, warm rim light.
> 10. A watering can and secateurs on a potting bench, one warm shed bulb.

### Diagrams and motion to build — no generation, no assets

| ID | Section | What | Notes |
|---|---|---|---|
| `D1` | `#intro` | Four-node flow strip, travelling dot on a 6 s loop + scroll draw-in | Inline SVG ~4 KB |
| `D2` | 01 `#leak` | Mono clock ticking 6:58 → 7:04 on scroll-in | References existing copy only |
| `D3` | 02 `#automate` | Arrow draw-in per rule, 350 ms, 60 ms stagger; trigger dims, action resolves; ambient dot down the column | CSS + IntersectionObserver |
| `D4` | 03 `#work` | Count-up on the three LISA figures, 700 ms | Attribution line must stay attached |
| `D5` | 04 `#instead` | Twelve stacked bars vs one bar, hairline stroke, **no values printed** | Shape only; asserts no figure |
| `D6` | 05 `#how` | Four-node progress rail + four hairline icons | `@supports (animation-timeline: view())` with IO fallback |
| `D7` | 07 `#questions` | Accordion hairline draw + 250 ms `+`/`−` rotation | CSS only |
| `D8` | 08 `#book` | 30-minute bar, three segments filling in sequence | Diagram of John's own agenda |

All motion uses the existing single curve `cubic-bezier(.19,1,.22,1)` and must
render final states under `prefers-reduced-motion: reduce`, per `README.md`.

### Production steps — not generation

| ID | What |
|---|---|
| `C1` | Re-capture fastfix.ai at 900×1120 DPR 2, portrait. **Must not** include any rating, review count, price, duration, guarantee or phone number in frame — that was the v6 criterion-17 failure. Pick a scroll position carrying none, and check the PNG by eye. |
| `C2` | Re-capture gelatotech.com, same spec, same exclusion check. |
| `C3` | Re-capture gsb-lead-lisa.com, same spec, same exclusion check. |
| `P1` | Portrait re-shoot brief for John (**photograph, never generated**): 3:4, single warm key from camera-left at 45°, near-black background, f/2, framed chest-up with enough headroom that a `cover` crop anchored on the eyes never cuts the eyeline. Working clothes, not a suit. One frame; no smile required. |
| `X1` | Fix `.orb-gl` — it measures 0×0 in a headless render, so the WebGL orb never initialises. `memory/NEXT_STEPS.md` §1. |

---

## 6. Verification gate

1. Re-run the measurement pass: ≤531 rendered words, ≤120 s read.
2. No section measures 0 % visual area.
3. Every `<img>` paints ≥95 % of its box — the `naturalWidth`-vs-box check in
   §1. A DOM audit cannot catch this.
4. **Look at every shipped image at full size.** The v6 failure was invisible to
   `innerText` and to a DOM audit; it was only findable by looking. Nothing
   ships that a stranger could mistake for a record of a real customer or a real
   result.
5. LISA's non-affiliation disclaimer and the "Figures published by LISA on their
   own site" attribution are both present and unaltered.
6. The page is complete and readable with JavaScript blocked.
