# Explorer edition validation

Run locally with `python -m http.server 8765 --bind 127.0.0.1`, then open `http://127.0.0.1:8765/`.

## Checked on October 10, 2026

- JavaScript syntax checks (`node --check` on every file) and `git diff --check`.
- Desktop landing and overview visuals at 1280 × 720; reading layouts at 390px and 320px widths.
- Enter on the landing page's Selected Work button opens reading mode instead of starting the game.
- AI/product, data/analytics and engineering selections display the corresponding three projects.
- Case-study links, direct-load refresh and native browser Back return the expected reading content.
- All 22 chapters can be selected and have no horizontal page overflow at a 320px viewport.
- Covered game controls are absent from the reading-mode accessibility tree. Entry focuses the reading heading; Escape returns focus to the visible Quick View button.
- The five-stop recruiter tour starts, walks to V-Lab and opens its landmark panel. Read Case opens that chapter in the reader.
- No warning or error messages appeared in the browser log during these checks.

## Illustrated field-guide follow-up, October 10, 2026

- New cover illustration and editorial landing inspected at 1280 × 720, 390 × 844 and 320 × 740.
- All 22 chapters rechecked at 320px with no horizontal reader overflow, including the expanded Dev Desk and new case briefs.
- Four engineering reports returned HTTP 200 and matching page titles. Their public repository READMEs were checked against the descriptions; synthetic/recorded data is explicitly labeled.
- Keyboard Enter opens Selected Work. Returning to the town restores visible Quick View focus. New Lab navigation scrolls to the correct section and focuses its heading.
- Direct case-study refresh, title loading, illustration loading, and the five-stop tour were rechecked.
- New raster cover is 1536 × 1024, approximately 3.7 MB; it is reused from browser cache between the title and reader. Gameplay rendering is idle behind the opaque title and paused in reading mode.
- LinkedIn's public-facing profile content was reviewed in the signed-in session. Graduate Teaching Fellow dates are included in the overview. December 2026 follows the supplied portfolio PDF and LinkedIn About; the Education entry still differs and was not edited.

## Playable-town remaster, October 10, 2026

This replaces the earlier illustrated landing with a live game title screen. The town now remains animated behind the title (30fps), with reading mode and hidden tabs still suspending rendering.

- `node tests/world-routes.cjs` checks all 22 chapters and every interactive prop for reachability from spawn, every bridge tile, and the six 16×20 explorer source frames. Passed with 2,057 reachable ground tiles.
- Seven major building sprites were redrawn: home, campus hall, AI lab, MaGic tower, gym, market and station. Browser inspection caught and corrected the dome and barrel-roof shading order.
- Start Game enters the playable world; the five-stop recruiter tour walks to V-Lab and opens its panel after the map changes.
- Desktop title and gameplay were visually inspected at 1280×720 and the title at 320×740. The optional reader opens and returns to the town; its 320px layout has no horizontal overflow. Keyboard Enter activates Start Game.
- Final local UI checks used an uncached server at port 8766 after intermittent missing-script responses from the earlier preview server. The fresh session successfully loaded the world, audio integration and reader.
- JavaScript syntax and whitespace checks are run before publishing.

## Validation limits

These are browser viewport checks, not physical iOS/Android device tests. Reduced-motion effects and animation/audio suspension were reviewed in the implementation; dedicated assistive-technology, battery and performance benchmarks have not been run. The existing external project demos and portfolio PDF were retained; they were not comprehensively audited or rewritten.

## Regression checks for later changes

1. Check title-button activation with both mouse and keyboard.
2. Check `/#quick`, `/#q-vlab` and the existing `/#vlab` town link after refresh.
3. Open a case, press Back, then Forward. Check Escape and focus restoration.
4. Change all role filters, then use the archive selector to open a non-featured chapter.
5. At 320px, check the BI gallery, Software Studio, Skill Library and tour planner for overflow.
6. Start a tour, open reading mode, return to the town and continue to the next stop.
7. With reduced motion enabled, confirm there is no title pan, screen shake or flash.
8. Enable music in the town; reading mode and a hidden browser tab should pause playback.
