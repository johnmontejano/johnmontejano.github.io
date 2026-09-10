# Image and motion refinement verification

## Scope

Reference: live monopo.vn, measured at 1440×900. Content belongs to John
Montejano; project artwork is authentic existing project material, not invented
project evidence. See ASSET_REFRESH.md and VIDEO_SOURCE.md for provenance.

## Motion review

| Before | After | Why |
| --- | --- | --- |
| Offscreen timer reveals | Viewport-entry reveals | Images animate when reached, not before the visitor sees them. |
| Recursive hero interruption callback | Callback detached before timeline cancellation | Fast scrolling cannot recurse or strand the headline. |
| Shared image transforms | Separate cover, gallery, portrait and name layers | Scroll movement and image scale no longer overwrite one another. |
| CDN-gated startup | Local pinned dependencies and visible static fallback | A delayed CDN cannot leave content hidden. |
| Generated still with camera zoom | Licensed live-action film and pause control | The scene itself moves; manual pause persists across scrolling. |

Motion verdict: approve after isolated regression suite passes. Reference
entrance timings are deliberately retained on this occasional-use portfolio.
The user's explicit fidelity request takes precedence over generic short-UI
timing preferences from the animation-review skill.

## Reproducible checks

- `node tools/motion-check.cjs`: ephemeral local server and separate Chrome;
  startup with CDNs blocked, injected boot fault, real JavaScript-disabled
  desktop/mobile loads, delayed entry, measured parallax, actual mid-cycle hero
  interruption, keyboard navigation/focus/scroll lock, film playback, manual
  pause persistence, normal and reduced-motion modes.
- `node tools/browser-check.cjs URL OUTPUT_DIR MODE`: isolated tab in a test
  Chrome on port9222; cache disabled; explicit startup gate; actual wheel
  events; full-card resting/hover captures; advancing film frames; image,
  overflow, reveal, exception and console diagnostics.
- JavaScript syntax checks and `git diff --check`.

Visual evaluation is separate from functional tests. A passing script is not
evidence of a 9/10 design. Final independent evaluation and deployment evidence
are recorded below when complete.

## Verified before publication

- Full desktop1440×900 and mobile390×844 scroll passes: zero overflow, broken
  images, uncaught exceptions and hidden reveals after traversing all sections.
- A320×700 mobile run and full reduced-motion run also pass.
- Isolated motion suite passes after final UI/shader startup ordering.
- Three screenshots of a text-free hero region have distinct SHA-256 hashes,
  proving the background itself advances. Four film frames visibly progress.
- Production checker `tools/verify-deployment.cjs` covers29 referenced HTML,
  CSS, script, image, video, icon and font files; local preflight matches all29.

Independent review progression: quality8.0 →8.6 →8.8; desktop fidelity8.2
→8.7 →8.8. These are iteration scores, not rounded approvals. Desktop footer
contrast, native-size source logo, lens rim depth and live-reference mobile
hero proportions were refined in response. 

## Final visual gate

Iteration11 independent review reached **9.0/10 visual quality on both desktop and
mobile**, with no remaining must-fix visual defect in the reviewed captures.
Strict reference fidelity was **8.8/10 desktop and 8.7/10 mobile**. Scores are
subjective screenshot-based judgments, not pixel-equivalence measurements.

The final iteration12 refinement increases the mobile manifesto to approximately
40px at390px viewport width, with1.35 line height, addressing the review's remaining
type-scale discrepancy. Desktop behavior is unchanged. Exact shader refraction
and the substituted font remain fidelity differences; content is intentionally
John's, not monopo's clients or project evidence.

The independent iteration12 follow-up accepted this final refinement with no
visible regression: **9.0/10 quality and8.8/10 fidelity on desktop and mobile**.
The390px and320px scoped manifesto/strengths checks both pass with zero overflow,
failed images or exceptions. These supplement, rather than replace, iteration11's
complete desktop/mobile, narrow and reduced-motion validation.

Durable evidence is under the adjacent `Portfolio-John-main/qa-final/` directory:
`iteration11`, `iteration11-mobile`, `iteration11-narrow`, `iteration11-reduced`,
and the final `iteration12-mobile` and `iteration12-narrow` scoped captures.
Unchanged desktop sections are in `iteration8`; reference screenshots are in
`reference` and `reference-mobile`. Earlier temporary captures are not required.

Publication verification must confirm main's SHA in GitHub Pages and run the
29-file byte checker plus live desktop/mobile browser checks and motion suite.
The final deployment SHA and results are recorded in shared project memory and
the existing Agent Tasks record after the push, not inferred from local tests.
