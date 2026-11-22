# Step 12

Production, auth off. A real new shift: the boot line, setup, the unit sheet, the intro, then the cafe. Walked a step and toggled sound.

The page logged no warnings and no errors. Nothing failed to load.

The one warning before this was Chrome's, on load: the audio context was built before a gesture. It now waits for a key or a click.

`node scripts/console-clean.mjs http://127.0.0.1:8099/`
