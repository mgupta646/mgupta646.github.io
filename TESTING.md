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

## Scope

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
