# Night Watch plates — house look and what was kept

Written 20 November 2026, after the first three hero plates (turbine, corridor, pool).

**House look:** a fixed corner camera, mild wide lens, everything in focus, a little underexposed. Interiors are clean painted concrete or steel, cool fluorescent or warm-white, not a colour grade (the code grades every frame). Equipment is modern and maintained. Outdoor plates are night. Infrared scenes were generated in colour. No people, and sign boards are blank so the code can write the words.

Imagine has no strength slider and no separate negative prompt. Every plate was image-to-image from the code reference, with the section 2.6 lines in the prompt and "no people, no text" repeated. Sign rectangles that still came back with letters were painted flat (yellow, white, grey or green) at the code's own coordinates before export.

## Kept

| Scene | Tries | Kept | Why |
| --- | --- | --- | --- |
| turbine | 2 | text wipe of the first hall | One-point hall, turbine in the middle, pumps in both foreground corners. EXIT was painted blank. |
| corridor | 2 | the pass with the person removed | Symmetrical corridor, red door on the right, doors on the left. The first pass had a person. |
| pool | 2 | the darker pass | Railing, clear water, dark racks, no baked Cherenkov. |
| containment | 1 | first | Green motor centred, pipes left and right, yellow crane girder. |
| yard | 1 | first | Three lattice towers, gravel, sodium lamp on the right, night. |
| pressurizer | 2 | text wipe | Tall lagged vessel, red handwheel upper right. |
| msiv | 2 | text wipe | Full-width steam line, green actuator, blank monitor. |
| drywell | 1 | first | Green recirc motor, grating, crowded drywell. |
| torus | 2 | person removed | Dark water in the lower half, header pipe, empty catwalk. |
| tunnel | 2 | the centred pass | The first pass looked along one wall. The second looks down the tunnel. |
| cavity | 1 | first | Round head, row of rod drives, crane hook, matte metal. |
| blower | 1 | first | Green casing left, steam generator right, duct between. |
| discharge | 1 | first | Drop and horizontal run, panel with a dark window. |
| cell | 1 | first | Amber shielding window, pipe and tank, nobody behind the glass. |
| freeze | 1 | first | Frosted valve, open fan grille. |
| offgas | 1 | first | Three tanks and a header. |
| intake | 1 | first | Three travelling screens, night water, dark sky. |

Scenes with one try were kept because the layout matched the reference and the rule check passed. They were not padded with throwaway extras.

## State plates

door ajar, chair, hard hat, pool level, tool bag, frost gone, heater zone, intake debris. Each is a full frame; the game draws only its box, with a soft edge.

## Rover

Eight walk frames, side view, facing right, white hard hat, navy coveralls, reflective stripes, torch. Generated as a 2×4 sheet on magenta, chroma-keyed, then packed into `public/nightwatch/rover.webp` at 768×192. Feet sit on the bottom row.

## Not done

Looping video underlays for the pool and the torus were not made. The stills are the plates. Water shimmer, caustics and Cherenkov stay in code.
