# Independent final visual audit

## Summary

2026-09-09. Evaluated `portfolio-live-worktree`, HEAD `f1eedf4` plus the existing uncommitted changes, against John's current monopo.vn design/layout/motion brief. Visual quality and reference fidelity: **8.6/10**. **5/10 visual criteria reach the requested 9/10 threshold.** This is an editorial assessment, not a pixel-similarity measurement. Three projects and one person are fully normalized; no penalty for having fewer projects, people, offices, or social links.

The parent `SPEC.md` and historical parent `FINDINGS.md` concern v6, which current project memory explicitly supersedes. Their 43-item rubric is not a meaningful acceptance rubric for this monopo rebuild. Applicable ancestor AGENTS and project operating rules/memory were read. No implementation, tests, configuration, SPEC, or shared memory was edited. Only this report was written. No Notion record or external memory was written under the evaluator's restricted-output instruction; ECC memory tools were unavailable.

| Visual criterion | Score / 10 | Reached 9 | Evidence and judgment |
| --- | ---: | :---: | --- |
| Hero composition/material | 8.5 | No | Pass4 hero plus freshly reloaded current browser render; m_00 reference. Placement and scale are close; updated rim improves depth, but broad opaque-looking color lobes still dominate the lens. |
| Typography | 9 | Yes | Desktop strengths, manifesto, footer and mobile manifesto. Clear hierarchy and reference-like sans scale, line spacing and editorial alignment. |
| Genuine project assets | 9 | Yes | Current browser project cards, HTML, ASSET_REFRESH provenance and direct LISA asset inspection. Real product/site material replaces unrelated atmosphere covers; credit remains John's product/build work. This is not an independent historical provenance certification. |
| Work composition | 8 | No | Pass4 work and live scroll through all three cards. Correct stagger, portrait plates and resting darkness; FastFix's diagram and GelatoTech's small device grid leave large low-information areas instead of a strong cover focal point. |
| Image art direction | 8.5 | No | Pass4 gallery/strengths/film, pass3 portrait, current image references. Daylight scenes are a substantial improvement; repeated neutral interiors and plain portrait treatment remain less authored than the reference. |
| Strengths | 9 | Yes | Pass4 strengths versus reference strengths and m_33; mobile geometry also inspected. Rules, three-column relationship, optical objects and copy scale now read coherently. |
| Film | 9 | Yes | Pass4 film versus reference m_40; actual playback/pause/reduced-motion checks passed. Full-width moving street footage gives the intended visual break. Paris stock is illustrative, not evidence of John's location or clients. |
| Gallery | 8 | No | Pass4 gallery versus reference tiles_y9167. Diagonal field and crop rhythm are present; adjacent repetitions and limited shot variety weaken the editorial effect. |
| Portrait | 8.5 | No | Pass3 person/mobile person, current portrait reference in HTML, reference team portraits. Position/name overlap and solo adaptation work; neutral headshot treatment lacks the reference's distinctive lighting/refraction. |
| Page rhythm | 9 | Yes | Work, trust, manifesto, strengths, giant type/film, gallery, portrait and white footer sequence. Reference m_24, m_40, m_53 and section captures. Content count normalization preserves the pacing without inventing additional people/projects. |

Equal-weight total: 86/100. Functional motion checks passing does not automatically establish identical perceived motion to monopo.

## Open

### VIS-01 — major — Hero material remains below reference quality

Reproduce: load `http://127.0.0.1:4176/`, let the introduction finish, inspect the revealed lens, and compare with `docs/scroll-frames/m_00.jpg`. The earlier `/private/tmp/portfolio-pass4/hero.png` predates the latest shader edit; this finding was rechecked after browser reload against current source, including its new inner shoulder highlight.

Observed: the new thicker rim is visibly better, but the interior still reads as large, soft green/brown patches with weaker transmitted/reflected structure than the reference. This is a material/field-composition gap, not a missing lens or a demand for the exact same animated frame.

Concrete improvement: preserve the current placement and sharpen the relationship between the background ribbons, transmitted pattern and edge compression so the lens reads as glass across several animation phases, not principally as a tinted disc. Verify with matched revealed desktop/mobile captures and a short live motion comparison.

### VIS-02 — major — Authentic work covers still lack reference-level focal composition

Reproduce: scroll through `#work` at desktop width, both resting and focused/hovered, and compare its first two plates with reference work. Evidence: `/private/tmp/portfolio-pass4/work.png`, browser scroll inspection of current FastFix/GelatoTech/LISA cards, and current `.job__cover--product` / `.job__cover--device` rules.

Observed: the grid geometry is close, but the FastFix diagram is sparse and GelatoTech's device selector occupies a relatively small portion of a tall dark plate. More brightness alone would not solve that composition. The reference's equally dark plates still have decisive full-frame subjects.

Concrete improvement: art-direct the existing genuine product/site material into stronger portrait covers with one clear focal subject and less unused internal canvas. Keep evidence legible and the reference's resting-opacity behavior. Do not add projects or fabricate UI.

### VIS-03 — major — Gallery/portrait art direction remains less distinctive

Reproduce: inspect `/private/tmp/portfolio-pass4/gallery.png` next to `docs/scroll-frames/tiles_y9167.jpg`, then pass3 person versus the reference team portraits. Current HTML confirms the daylight gallery and editorial portrait assets remain selected.

Observed: the same clinic, repair scene and meeting room recur within one desktop gallery viewport. The reference varies subjects, human gestures, colors and photographic scale more strongly. John's portrait layout is sound but its neutral lighting does not reproduce the reference's optical color treatment. These are art-direction differences independent of project/person count.

Concrete improvement: sequence a more varied set of atmosphere compositions so duplicates do not sit near each other in a viewport; add reference-like controlled optical/light treatment to the existing real portrait while preserving identity. Judge the rendered results, not asset filenames or generation prompts.

## Resolved

- Historical **F-01** (critical, v6 fabricated screenshot facts): retain its ID and historical resolution; current changed covers do not reproduce the previously flagged rating/review/price/guarantee blocks in the inspected render. The retired v6 screenshot suite was not rerun and is not being recertified here.
- Historical **F-02** (major, v6 Google Calendar wording): retain its ID. `memory/DECISIONS.md` records John's acceptance of that real source wording. The current FastFix cover uses a product map; the prior screenshot wording is not the displayed cover. Not reopened under this visual brief.
- The old mobile atmosphere-backed work cover, glass tiles in the gallery, and dark still-based film are superseded. Current HTML, pass4 screenshots, and live film tests confirm replacements; those obsolete screenshots were not used to score the new assets.

## Verification and limitations

- Inspected all requested pass4 captures: hero, work, trust, strengths, film, gallery. Inspected pass3 manifesto/person/footer and mobile hero/work/trust/manifesto/strengths/film/gallery/person/footer. Used current sources to distinguish superseded mobile assets.
- Compared against `/private/tmp/portfolio-reference-now` and matching `docs/scroll-frames`, including m_00, m_24, m_33, m_40, m_53 and tiles_y9167. Some live reference filenames capture an adjacent section because their scroll positions differ; they were not treated as aligned screenshot pairs.
- Read current diff across index.html, styles.css, assets/js/main.js and assets/js/orb.js and asset provenance documents. Concurrent edits occurred: orb.js timestamp was 12:10:47, after pass4 hero at 11:49:17. Reloaded and visually inspected the later shader through an independent in-app browser tab.
- `git diff --check` — exit 0.
- `node --check assets/js/main.js` and `node --check assets/js/orb.js` — exit 0.
- `node tools/motion-check.cjs http://127.0.0.1:4176` — initial sandbox Chrome launch failed (`Chrome exited: null`); authorized retry completed with exit 0. Existing suite exercised cover/row/inner/portrait/name motion configuration, real wheel-triggered reveals and hero cycle interruption, mobile keyboard menu/focus/scroll locking, and actual video controls including persistent manual pause and reduced motion. It launches its own Chrome with a random port and explicitly rejects port 9222.
- Browser interaction independently confirmed rendered current content, work navigation and scroll, current project plates and updated hero. No shared CDP 9222 access was used. The evaluator created no HTTP server; the suite closed its own browser in cleanup and completed. The temporary in-app audit tab was closed at completion. A separate OS process-list confirmation was unavailable because `ps` is restricted in the sandbox.
- Exact motion fidelity against a simultaneously played reference and a fresh full mobile capture of every final asset remain outside the evidence of this pass. Passing the existing motion suite proves its assertions, not every visual timing detail. No production deployment, full accessibility recertification, or external project-site recapture was performed.
