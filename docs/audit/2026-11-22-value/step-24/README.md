# Step 24

The desktop window can be windowed, fullscreen, or borderless. The last windowed or borderless size is kept in `cc.window`. A fullscreen resize does not replace that size. It is not in the week save.

The browser build hides the three buttons. This sandbox cannot open the Tauri window, so the proof is the saved size plus a click that the web menu has no borderless button.

From the unit test: 1600×900 was kept, a 1920×1080 resize stuck, and fullscreen left 1920×1080 alone. The web menu showed 0 window buttons.
