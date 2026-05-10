# Warrior Cats Life

A Tomodachi-Life-style sim where you build a Warrior Cats clan in a top-down clearing. Place dens, create custom cats, watch them wander, drag them together to talk, hunt for prey, feed your hungry warriors, and let crushes blossom into mates.

Runs entirely in the browser — saves are stored in `localStorage`.

## Where to play

- **Landing page:** http://warrior-cats-life/
- **Game page:** http://warrior-cats-life/game

The landing page has a "Open the Clearing »" button that takes you straight to `/game`.

## What's in the game

- A guided onboarding by your **guide cat** (four poses: talking, pointing, thinking, cheering).
- **Dens you can build:** leader, medicine, warrior, apprentice, nursery, elder, kit play mound, fresh-kill pile. Drag them anywhere.
- **Cat creator:** name, gender (she-cat / tom / non-binary), 10 pelt colors, 5 pelt designs (solid / tabby / spotted / mackerel / classic), 6 eye colors. Live SVG preview.
- **Wandering cats** — they pick targets and pad around the clearing. Drag any cat to move them.
- **Drop one cat onto another** to start a short conversation; their relationship score nudges up (or down if they're foes).
- **Click a cat** to see stats (mood, hunger, energy, happiness, eye color) and the line they're thinking about today.
- **Skip Day** button — each day cats get fresh thoughts/wants, hunger ticks up, friendships drift closer.
- **Hunt minigame** — click prey (mouse, vole, squirrel, bird) before they escape. Adds them to the fresh-kill pile.
- **Inventory & feeding** — feed any cat from the fresh-kill pile to satisfy hunger and bump happiness.
- **Relationships side panel** — every cat's bonds, with hearts that grow with score.
- **Crush / mate cutscene** — when two cats grow close, type what they should talk about (e.g. *"meeting under the moon"*) and watch them walk together under the stars and discuss your topic.

## Architecture

```
warrior-cats-life/
├── server.js              # Express: serves /, /game, and /public assets
├── package.json
├── docker-compose.yaml    # Podium-managed
├── .env                   # Podium-generated (PORT=3000, shared service hosts)
└── public/
    ├── index.html         # Landing page
    ├── game.html          # Game page (canvas-free, all DOM/SVG)
    ├── css/
    │   ├── style.css
    │   └── game.css
    ├── js/
    │   ├── data.js        # Pelt colors, designs, eyes, dens, names, want lines
    │   ├── sprites.js     # Procedural cat SVG generator
    │   └── game.js        # Game state, render loop, drag handlers, hunt, dialog, cutscenes
    └── img/               # Guide cat poses, den sprites, prey sprites (all SVG)
```

The game is **client-side only** — no DB, no API, no auth. Save data lives in `localStorage` under the key `warrior-cats-life-v1`. Hit "Reset save" on the title screen to wipe it.

## Useful commands

```bash
# Start / stop the project
podium up warrior-cats-life
podium down warrior-cats-life

# Restart node server (after editing server.js)
cd ~/podium-projects/warrior-cats-life
podium supervisor restart all

# Open a shell inside the container
podium bash

# Status check
podium status warrior-cats-life
```

The Express server binds to port 3000 inside the container; nginx in the cbc base image reverse-proxies port 80 → 3000.

## Default credentials

None — there's no auth and no DB.
