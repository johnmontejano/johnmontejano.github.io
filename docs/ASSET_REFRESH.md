# Image refresh — 2026-09-09

## Final cover refinement

The FastFix cover now renders the same four existing marketing-map capability
labels as crisp HTML, using the actual logo downloaded from
https://fastfix.ai/newhome/logo-mark-dark.png . This is an adapted marketing
cover, not a screenshot of application functionality. The original 500×430
capture remains preserved. GelatoTech retains its authentic device-selector
capture, with a typographic project-cover heading added to the empty field.

John rejected the previous crushed-shadow amber imagery as artificial. This
pass replaces every atmosphere image referenced by the page. Original assets
remain recoverable; they are not silently overwritten.

## Provenance

- Six new atmosphere scenes are generated illustrations, not photographs of John's customers, premises, employees, or project outcomes. They are decorative and used only in the atmosphere gallery.
- Project covers use the existing authentic FastFix product map, GelatoTech device selector, and LISA website event-photo collage. The product map and collage were recovered from the previous site-v2 implementation; no new interfaces or project evidence were generated. Original screenshots are preserved. The map is a website marketing graphic, not an application screenshot. LISA photography is site content; John's credit remains website design/build.
- `jm-portrait-editorial-v2.webp` is an AI-assisted background/lighting edit of
  `jm-portrait.webp`, not a new portrait from a text prompt. The original is
  retained. The edit was inspected alongside the original for identity, pose,
  clothing and facial proportion continuity.
- Glass objects are explicitly abstract artwork, not stock photography.
- The film is actual licensed live-action footage, not an animated generated
  still. See [VIDEO_SOURCE.md](VIDEO_SOURCE.md). It depicts Paris and is used
  as illustrative neighborhood atmosphere, never claimed as San Francisco.

## Tool and prompt set

All stills used the built-in `image_gen` tool, one call per distinct asset.
Final assets are project-local WebP files, converted with `cwebp -q 88`.
No API-key fallback or paid image/video service was used.

Shared photographic direction: `photorealistic-natural`, one full-bleed 3:2
editorial photograph, ordinary believable environment, soft natural daylight,
real material wear, restrained color, retained shadow detail, casual framing.
Avoid cinematic orange/teal grading, glowing lights, luxury showroom staging,
plastic textures, implausible hardware, text, brands, logos and watermarks.

| Saved file under `assets/img/atmos/` | Asset-specific prompt |
| --- | --- |
| `service-street-v2.webp` | An ordinary compact white unbranded service van on a residential San Francisco street in overcast late-afternoon light, photographed from across the street, three-quarter rear view, weathered houses, leafy tree, slightly dirty tires, realistic window reflections and asphalt. Documentary 35mm. |
| `repair-daylight-v2.webp` | A small electronics repair workbench beside a window; a technician's naturally proportioned hand holding a precision screwdriver beside an opened black smartphone on a faded blue antistatic mat; believable screws, spudger and used cloth. Diffuse daylight, 50mm documentary framing. |
| `meeting-daylight-v2.webp` | A quiet ordinary meeting room after a workshop; wood table, closed notebook, water glass, two fabric chairs, concrete wall and window facing green trees. Seated-eye-level 35mm interior photograph. No named company or university. |
| `salon-daylight-v2.webp` | A modest neighborhood salon between appointments; worn burgundy chairs, tall mirror, leafy plant, comb and spray bottle, scuffed tile floor. Soft daylight and real muted red/cream/green. No people. |
| `garden-daylight-v2.webp` | A gardener's pale grey worn gloves repotting a green plant on a blue painted outdoor bench, terracotta pots, scattered soil and leafy courtyard. Crop at forearms; diffuse daylight, tactile leaves, realistic hands and mild asymmetry. |
| `clinic-daylight-v2.webp` | A modest dental room with a turquoise chair, white cabinetry, turned-off articulated lamp, pale pink wall and window blinds. Clean practical equipment, believable scale, real daylight, neutral exposure. No patients or named practice. |
| `glass-lens-v2.webp` | Clear thick glass sphere with a small convex lens attached, pure black background, precise optical refraction, silver edges and subdued ivory/sea-green reflections. One centered abstract optical object, no floor or glow. |
| `glass-pair-v2.webp` | Two overlapping transparent solid glass spheres of different sizes on pure black; accurate overlapping refraction, narrow silver rims, restrained sea-green and warm ivory reflections. No floor or text. |
| `glass-cube-v2.webp` | Transparent solid glass cube rotated diagonally in three-quarter perspective, gently rounded corners, nested internal refraction, narrow silver/ivory/sea-green highlights, pure black background. No metallic surface or neon. |

Portrait edit prompt: Change **only** the bright background to plain charcoal
and exposure/color grading to subtle natural side lighting. Preserve exact
identity, facial geometry, expression, eyes, skin texture, cap and logo,
clothing, pose and crop. No beautification, reshaping, invented environment or
added body parts. Saved as `assets/img/jm-portrait-editorial-v2.webp`.

`service-film-poster-v2.jpg` is a frame extracted from the delivered film, not
a generated stand-in.

## Visual inspection

All generated outputs were viewed before integration. The selected atmosphere
images replace the prior dramatic night lighting with varied daylight scenes.
They remain synthetic images even where visually convincing; photorealism is
an appearance assessment, not a claim of documentary provenance.
