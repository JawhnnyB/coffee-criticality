# Open questions

Written on the dream pass, 2026-11-13. Each one stopped a package. The default was used. Nothing below was built.

## Art source

Question: may Imagine-generated art ship, given `docs/GROK_HANDOFF.md` section 1 ("No AI-generated text or copyrighted assets in the shipped game") against `GROK_ART_101.md` rules 39 and 51?

Options: allow Imagine for plates and the menu video, or do not.

Default used: no new Imagine art. WP3, WP6, and WP7 were not drawn.

## DELAY LAMBDA

Question: the cabinet uses `const LAMBDA = 0.005` in `src/game/DelayGame.tsx`. The comment on that line says an older Λ of 0.055 took 1.6 s. The frozen list names `LAMBDA` and does not pick a number.

Options: leave 0.005, or change it to 0.055 with an owner approval.

Default used: change neither. `N_MAX` is 40. Not changed.

## Name over Mabel's head

Question: is a name over Mabel's head a bug?

What the code does on this branch: `drawNameplate` in `src/game/pixel.ts` is not called from `render.ts`. The room draw paints the chibi and the emote only. The string "Dr. Mabel Quinn" is in the credits and in one dialogue line, not over the sprite.

Options: leave it (nothing is drawn), or the owner has a screenshot from another build and wants that label removed there.

Default used: do not paint a name, and do not delete a label that this branch does not draw. WP3 was not started.

## Furniture labels

Question: are the words "Counter", "Shelf", and "Window tab" meant to stay on the cafe art?

Search of `src/` and JSON for those three strings: no matches. They are not a React overlay on this branch. If they are in a screenshot, they are baked into an image, and this pass did not find the file.

Options: leave the art, or the owner points at the file and says to remove the letters.

Default used: do not edit art. WP4 was not started.

## Frozen values and real numbers

Any visual change that needs a frozen value, a real name, a region value, or a radiation number stays stopped. Regions stay "Pending verification". `news.json` stays `[]`. `background.json` stays pending.
