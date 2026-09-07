# Atmospheric Image Assets

Original generated mood imagery for the site. Location: `assets/img/atmos/`.

These are **mood images only**. None of them depicts a real customer, a real
job, a real metric, a real review, or a real product screen. Every file was
inspected after generation and confirmed to contain no text, numbers,
handwriting, signage, logos, watermarks, user interfaces, or recognisable
human faces.

## How they were made

| | |
|---|---|
| Tool | `~/.claude/skills/gpt-image-bridge/bin/gpt-image-2` |
| Model | OpenAI **gpt-image-2**, via the `codex` CLI on a ChatGPT subscription |
| Generated | 2026-09-07 |
| Native size | 1536x1024 (1024x1536 for the 4:5 frame) |
| Post-processing | centre-cropped to 16:10 (or 4:5) with `sips`, encoded with `cwebp -q 88 -m 6 -sharp_yuv` |

The Higgsfield/`generate_image` MCP server was tried first but the account had
0.4 credits against a 2-credit-per-image cost, so the local bridge was used
instead.

### Shared house-look suffix

Every prompt below was submitted with this block appended:

> Photorealistic documentary photograph shot on 35mm film. NOT an illustration,
> NOT bright clean commercial stock photography. Near-black ground, extremely
> low-key warm cinematic lighting, a single warm amber practical light source,
> deep crushed shadows filling most of the frame. Muted desaturated palette with
> one warm amber-orange accent. Visible film grain, shallow depth of field, wide
> aperture, imperfect reportage framing. Generous empty negative space so that
> type could sit over the image. CRITICAL CONSTRAINTS: absolutely no text, no
> words, no letters, no numbers, no handwriting, no signage, no labels, no
> logos, no branding, no watermarks, no user interfaces, no charts or graphs. No
> human faces, no people visible.

## Files

### `van-dusk.webp`
- 1536 x 960 (16:10) — 92 KB
- Negative space: upper two-thirds (sky), left road
- Prompt: *A plain unbranded white service van parked at the kerb of a quiet residential street at dusk shortly after rain. Wide establishing shot with the van small in the lower third of the frame. Rain-dark asphalt reflecting the warm red tail lights and one distant amber street lamp. Bare trees and dim suburban houses receding into blue-black shadow. Large expanse of empty dark sky and wet road.*

### `bench-night.webp`
- 1536 x 960 (16:10) — 116 KB
- Negative space: left half (empty bench surface)
- Prompt: *A cluttered workshop bench at night seen from a high three-quarter angle. Worn hand tools, loose brass and steel fittings and small parts scattered across scuffed wood. A single warm amber task lamp is the only light source, pooling on the bench surface and falling off sharply into near-black at the edges. Empty bench space in the foreground.*

### `phone-counter.webp`
- 1536 x 960 (16:10) — 57 KB
- Negative space: upper half, right counter run
- Prompt: *An old corded desk telephone sitting alone on an empty reception counter very late at night. Low three-quarter camera angle. All room lights off except one warm amber highlight raking across the polished counter surface. Deep shadow fills most of the frame with a wide empty stretch of counter beside the phone.*

### `chair-lowlight.webp`
- 1536 x 960 (16:10) — 33 KB
- Negative space: left half (shadowed wall)
- Prompt: *An empty salon styling chair alone in a dark low-lit treatment room. Venetian blinds cast hard warm amber slats of light across the empty chair and the plain wall behind it. Everything else falls to near-black. Wide framing with the chair off-centre and a large area of empty shadowed wall.*

### `jobsheet-hand.webp`
- 1023 x 1279 (4:5) — 37 KB
- Negative space: upper third
- Prompt: *Close overhead three-quarter view of a single hand holding a pen, resting on a completely blank sheet of paper on a desk beside a closed dark laptop. Only the hand and forearm are in frame, no face and no body. One warm amber desk lamp rakes in from the side. The paper is entirely blank cream stock with no printing, no ruled lines and no writing. Deep shadow around the edges of the frame.*
- Note: the laptop is closed, so no screen content appears.

### `calendar-shadow.webp`
- 1536 x 960 (16:10) — 34 KB
- Negative space: left half
- Prompt: *A plain wall calendar hanging in deep shadow, its grid of empty squares almost entirely lost to darkness, with one single square catching a narrow shaft of warm amber light from a window. The calendar cells are completely blank with no dates, no numbers, no month heading and no writing of any kind. Straight-on framing, most of the frame in near-black.*
- Note: verified — the grid is empty; no dates or month heading were rendered.

### `glass-amber.webp`
- 1536 x 960 (16:10) — 167 KB
- Pure texture. Intended as a section divider / overlay ground.
- Prompt: *Extreme macro abstract of warm amber light diffusing through thick frosted textured glass. Pure texture, gradient and glow only, with no recognisable object, no edges of any product and no reflections of anything identifiable. Soft bokeh. A warm amber bloom in the upper left dissolving gradually into near-black at the lower right.*

### `pipe-macro.webp`
- 1536 x 960 (16:10) — 63 KB
- Negative space: left half
- Prompt: *Extreme close-up macro of a copper pipe elbow joint beaded with cold condensation, an old worn steel adjustable wrench resting against it. A warm amber rim light traces the top edge of the copper, everything else falls into near-black. Very shallow depth of field with only a thin sliver of the joint in focus. No hands and no people.*

**Total: 8 files, ~600 KB.**

## Not produced

No video loops. `gpt-image-bridge` is image-only, and the Higgsfield MCP
server — the one path to video generation here — had insufficient credits.
