# Taskbar under the plant: browser check, 24 November 2026

`bar.mjs` drives the built game with real clicks at 1280×720 and 390×844. Hooks are used only for labelled setup (boot straight into the plant, start a talk with Mabel) and to read the mode and the plant clock. Results: `checks.txt`.

What it checks, at both sizes:

- The bar sits on the bottom edge under the plant, with nothing cut off or scrolled away.
- Cameras opens the desk with the live feeds; a feed enlarges; the plant clock does not move while you're out; the plant tab on the desk's own taskbar takes you back.
- Music starts from the bar, the Music app shows the same track, and closing the app keeps it playing in the plant.
- Plant data opens the Plant Monitor. Academy runs in its window and comes back to the plant. Start opens the start menu (wide screens).
- During a conversation the bar stays but its tabs wait.
- No page errors.

Screenshots: `plant-*`, `cameras-*`, `camera-big-1280`, `music-*`, `data-*`, `academy-*`, `talk-*`.
