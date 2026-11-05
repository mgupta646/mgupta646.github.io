# Explorer edition validation

## Character chat and Mango — November 5, 2026

- All JavaScript syntax checks, `git diff --check`, and the three regression scripts pass: `tests/world-routes.cjs`, `tests/assistant-core.cjs`, `tests/character-chat.cjs`.
- Mango is the 23rd chapter and a reachable robot landmark on the Dev Deck. It appears in AI/product and engineering selected work and loads directly at `/#q-mango`.
- Desktop chat submission displays a short text bubble above Mehul and a source-chapter link. The 390×844 layout collapses the panel after a reply; the bubble and character remain visible. The mobile Mango reader has no horizontal overflow.
- Microphone behavior is tested with event doubles, including no automatic submission, denied permission, unsupported recognition and stopping when hidden. Live microphone recording was not exercised.
- Optional model loading completed in the embedded browser and Chrome. Initial generation exceeded the original 60-second limit; the fallback worked. The revised generation budget is 80 tokens with a 120-second deadline and a composing status.
- Chrome then successfully generated a grounded Mango reply within the short display limit, rendered above the character. No browser warnings/errors appeared in that run. This is a smoke test, not a factual-accuracy benchmark or a guarantee of performance on other devices.

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
# Portfolio-only guide and navigation — November 5, 2026

- Tour lifecycle suite checks guide detachment on pause/completion, orphan cleanup, path cancellation and completed-stop filtering. Chat confirmation tests verify no navigation before consent and no navigation after declining.

- Tour confirmation regression: requesting a route does not call the game, declining does not move, and replying “yes” starts only the offered route.

- Performance regressions: a new question replaces the previous bubble with pending text; another submission terminates a pending worker; the game can stop inference on sustained long frames. Event tests, retrieval tests, route tests and syntax checks pass.

- Added regression checks for off-topic rejection before model calls, common instruction overrides, explicit routes, unknown destinations and negated movement requests.
- Browser check: an unrelated geography question receives the portfolio-only reply; “Take me to Mango” starts the existing walking tour with Mango as its destination.
- The local topic gate and grounded model prompt are defense layers, not a guarantee of perfect model compliance.
- Category-question routing and retained project context for how/when follow-ups pass the regression suites. The guide receives detailed case-study blocks and instructions to acknowledge missing dates.
- A real Chrome answer explained Mango's implementation. A subsequent date question hallucinated 2024, which prompted deterministic date-question handling and a generated-number check. Regression tests now assert that missing dates never reach inference and that unsupported years are rejected.
