# Step 13

The menu does not load the night plates, the outage data, or the minigames.

Plates load when a night starts, not when the desk app is opened. The outage bench, Night Watch, and the arcade games are separate files, fetched the first time they open.

Before the menu was on screen, the production build transferred 412,239 bytes (0.39 MB). Decoded, that is 1.10 MB. The target was under 3 MB. None of those requests is a plate, the outage chunk, or a minigame. Page errors: 0.

The list is in result.txt.
