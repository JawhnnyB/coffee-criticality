Fonts built from the exact glyphs used in the art.
- CCPixel3x5.ttf — labels, HUD, cabinet text. Caps and digits; lowercase maps to caps.
- CCPixel5x7.ttf — titles and big numbers. Caps and digits only (no punctuation beyond . - & : % /).
1 font pixel = font-size ÷ 10. Use whole multiples: 10, 20, 30 px. Regenerate with `python3 tools/artkit/make_fonts.py fonts`.
For mixed-case prose use Pixelify Sans (OFL, npm `@fontsource/pixelify-sans`).
