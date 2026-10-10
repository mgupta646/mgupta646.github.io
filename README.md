# Mehul Town: a playable portfolio

An interactive, GBA-style pixel town where every building is a piece of my work: AI products, data and analytics, software, NYU coursework, aerospace engineering and more.

**Live:** https://mgupta646.github.io/ (after deploying, see below)

- **Explore:** walk with arrow keys / WASD, click or tap to walk, Shift to run
- **Panels open automatically** when you walk up to a landmark and close when you leave
- **Guided tour:** the red **TOUR** button lets visitors choose what to see; the guide walks them there and narrates
- **Quick View:** a two-minute selected-work overview, with AI/product, analytics and engineering filters. Each case study has its own shareable reading link; all 22 chapters remain available in the archive selector.
- Quest log, minimap, day/night, a train, a rocket you can launch, a dog named Byte, and a secret code

No build step, no frameworks, no dependencies. Plain HTML/CSS/JS. Original pixel art is drawn in code (`js/sprites.js`). Screenshots show the projects themselves. The explorer edition uses an emerald-and-paper interface, clustered tree canopies, bevelled paths, a fountain and district labels inspired by handheld-era RPGs.

The opening is a game title screen over the living town, with Start Game as the primary action. Water, residents, birds and the camera animate in the background. The town includes a campus-to-pond creek, wooden crossings, garden courtyards, seven individually drawn buildings, larger textured trees and an explorer with a satchel. Ambient title animation is capped at 30fps; the game retains normal animation timing.

Music is off by default and can be enabled in the game menu. Reading mode pauses music and the game loop, isolates covered controls from keyboard navigation, and moves focus to the reading heading. Reduced-motion preferences disable camera easing, ambient effects, flashes and screen shake.

---

## Deploy to GitHub Pages (5 minutes)

1. Create a **public** repo named exactly **`mgupta646.github.io`** on GitHub (this gives you the clean URL `https://mgupta646.github.io/`).
2. From this folder:

   ```bash
   git init
   git add .
   git commit -m "Mehul Town portfolio"
   git branch -M main
   git remote add origin https://github.com/mgupta646/mgupta646.github.io.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)` → Save**.
4. Wait about a minute, then open `https://mgupta646.github.io/`.

> Using a different repo name (e.g. `portfolio`)? The site is then served at `https://mgupta646.github.io/portfolio/`.
> Everything still works (all paths are relative). Just update the two social-preview URLs (`og:url`, `og:image`) at the top of `index.html`.

## Run locally

Double-click `index.html`, or serve the folder:

```bash
py -m http.server 8000
```

then open http://localhost:8000.

## Edit the content

Full case studies and links live in **`js/data.js`**: each landmark is one entry in `SECTIONS`. The concise project summaries, status labels and role-based selections live in **`js/selected-work.js`**. Keep summary claims consistent with the full case studies when updating either file.

The illustrated field-guide edition adds an original town cover, four public engineering demonstrations and concise case briefs. Edit these in **`js/field-notes.js`**. The demos also appear at the playable Dev Desk. See `CONTENT-SOURCES.md` for factual scope and `ASSET-NOTES.md` for illustration provenance.

| Want to…                         | Edit                                                        |
| -------------------------------- | ----------------------------------------------------------- |
| Change a panel's text or links   | that section's `blocks` in `js/data.js`                     |
| Change what the guide says       | the section's `blurb`, or `NPC_LINES` at the bottom          |
| Change tour presets / categories | `TOUR_PRESETS` and `CATEGORIES` in `js/data.js`             |
| Move a building                  | `add({ … })` calls in `js/world.js`                          |
| Swap the background music        | replace `assets/audio/bgm.mp3` (volume is set in `js/audio.js`) |
| Update the downloadable PDF      | replace `assets/Mehul_Gupta_Portfolio.pdf`                   |

After editing, bump `?v=` on the CSS/JS links in `index.html` so browsers fetch the new files.

## Share links

- `/#quick`: opens Quick View directly (great for a resume or email signature)
- `/#q-vlab`, `/#q-rosi`, `/#q-citibike`, … opens a case study in reading mode, with refresh and Back/Forward support
- `/#tour`: opens the guided-tour planner
- `/#vlab`, `/#rosi`, `/#magic`, `/#aviation`, `/#citibike`, … opens one landmark's panel

## Files

```
index.html          page shell, HUD, panels, tour UI, metadata
css/style.css       GBA-style UI
css/refresh.css     explorer-edition theme, responsive overview and reader
css/field-notes.css game title screen, case briefs and engineering lab
js/data.js          ← all portfolio content
js/selected-work.js concise project summaries and role-based selections
js/field-notes.js   case briefs and reproducible engineering demos
js/sprites.js       pixel art (characters, buildings, trees, tiles), drawn in code
js/world.js         the 64×48 town map, landmarks, collisions
js/game.js          engine: movement, pathfinding, guided tour, train, rendering, input
js/ui.js            panels, Quick View, quest log, menu
js/audio.js         chiptune SFX + background music
assets/             screenshots, portfolio PDF, music, social preview image
tests/world-routes.cjs landmark and bridge reachability regression check
```

## Credits

- Background music: *Cukies Zelda* by **feedeorfano** ([Pixabay](https://pixabay.com/music/), Pixabay Content License)
- Fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) (SIL Open Font License)
- Pixel art, code and sound effects: original, made for this site
- Town cover: original AI-generated illustration; prompt and file location in `ASSET-NOTES.md`. Gameplay uses code-drawn sprites.
