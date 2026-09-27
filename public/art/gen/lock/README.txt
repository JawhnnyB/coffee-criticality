Identity freeze — Pillar A. Do not re-roll from text.

Locks (edit-chain only):
  mabel_chibi.png   silver bun, cream apron, copper stripe
  holt_chibi.png    grey hair, tan work shirt
  elena_chibi.png   long dark hair, green shirt, brown boots
  tommy_chibi.png   cap, steel shirt
  marcus_chibi.png  glasses, reddish shirt
  priya_chibi.png   dark braid, blue-grey shirt
  jordan_chibi.png  gold shirt
  player_chibi.png  glasses, copper hoodie, brown hair
  cafe_counter.png
  wood_tile.png

Packer law (tools/packBody.py):
  Paper is border-flood only. Peach/tan is never paper.
  Alpha is 0 or 255. No mid-alpha cheeks.
  Idle + talk bust from the lock. Walk 4x4 uses the IDLE ruler.
  Never stamp a second face PNG.

Engine: 32×64 blit, integer zoom, ellipse shadow, HUD E-prompt.
Palette: cream #f3e6d0 copper #c4783a leaf #6b8f71 ink #16110d steel #3d5c66 gold #c9a227.
