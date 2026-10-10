# Mehul Town: a playable portfolio

An interactive, GBA-style pixel town where every building is a piece of my work: AI products, data and analytics, software, NYU coursework, aerospace engineering and more.

**Live:** https://mgupta646.github.io/ (after deploying, see below)

- **Explore:** walk with arrow keys / WASD, click or tap to walk, Shift to run
- **Panels open automatically** when you walk up to a landmark and close when you leave
- **Guided tour:** the red **TOUR** button lets visitors choose what to see; the guide walks them there and narrates
- **Quick View:** the whole portfolio on one scrolling page, for recruiters in a hurry
- Quest log, minimap, day/night, a train, a rocket you can launch, a dog named Byte, and a secret code

No build step, no frameworks, no dependencies. Plain HTML/CSS/JS. All pixel art is drawn in code (`js/sprites.js`), so there are no image assets to license.

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

All text and links live in **`js/data.js`**: each landmark is one entry in `SECTIONS`.

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
- `/#tour`: opens the guided-tour planner
- `/#vlab`, `/#rosi`, `/#magic`, `/#aviation`, `/#citibike`, … opens one landmark's panel

## Files

```
index.html          page shell, HUD, panels, tour UI, metadata
css/style.css       GBA-style UI
js/data.js          ← all portfolio content
js/sprites.js       pixel art (characters, buildings, trees, tiles), drawn in code
js/world.js         the 64×48 town map, landmarks, collisions
js/game.js          engine: movement, pathfinding, guided tour, train, rendering, input
js/ui.js            panels, Quick View, quest log, menu
js/audio.js         chiptune SFX + background music
assets/             screenshots, portfolio PDF, music, social preview image
```

## Credits

- Background music: *Cukies Zelda* by **feedeorfano** ([Pixabay](https://pixabay.com/music/), Pixabay Content License)
- Fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) (SIL Open Font License)
- Pixel art, code and sound effects: original, made for this site
