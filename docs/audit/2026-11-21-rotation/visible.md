# Night Watch visibility

Pixels that change by 24 or more, best of three times (0.45 s, 1.25 s, 2.5 s), on a 960×540 frame.
Events fail under 2074 pixels (0.4% of the frame).
Oddities must land between 623 and 10368 pixels (0.12% to 2.0%). Too faint and too loud both fail.
Rover and the van are neither. They use the event floor and have no loud cap.
Plate is the game path (photos loaded). Code is the same paint with plates turned off.
The same scene and visual draws the same frame on every site, so those rows share one count.

| Site | Camera | Scene | Visual | Kind | Plate px | Code px | Plate % | Event rule | Oddity rule |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |
| pwr | core | containment | puddle | event | 5204 | 5672 | 1.00 | pass | n/a |
| pwr | pzr | pressurizer | steamWisp | event | 4799 | 3786 | 0.93 | pass | n/a |
| pwr | pzr | pressurizer | flicker | oddity | 204606 | 137185 | 39.47 | n/a | FAIL >2.0% |
| pwr | steamline | msiv | beacon | event | 15328 | 14835 | 2.96 | pass | n/a |
| pwr | turbine | turbine | pumpStopped | event | 19612 | 18543 | 3.78 | pass | n/a |
| pwr | turbine | turbine | hardhat | oddity | 12273 | 12289 | 2.37 | n/a | FAIL >2.0% |
| pwr | aux | corridor | puddle | event | 12142 | 10938 | 2.34 | pass | n/a |
| pwr | aux | corridor | doorAjar | event | 41602 | 13228 | 8.03 | pass | n/a |
| pwr | aux | corridor | flicker | oddity | 429689 | 429005 | 82.89 | n/a | FAIL >2.0% |
| pwr | aux | corridor | chair | oddity | 8580 | 2858 | 1.66 | n/a | pass |
| pwr | pool | pool | toolBag | event | 10361 | 6533 | 2.00 | pass | n/a |
| pwr | pool | pool | poolLow | event | 38361 | 28928 | 7.40 | pass | n/a |
| pwr | pool | pool | ripple | oddity | 2810 | 2814 | 0.54 | n/a | pass |
| pwr | yard | yard | arc | event | 160231 | 173035 | 30.91 | pass | n/a |
| pwr | yard | yard | fog | oddity | 129917 | 142108 | 25.06 | n/a | FAIL >2.0% |
| pwr | yard | yard | rover:0.5 | other | 3447 | 3857 | 0.66 | pass | n/a |
| pwr | yard | yard | van:0.5 | other | 20115 | 20102 | 3.88 | pass | n/a |
| pwr | intake | intake | debris | event | 64294 | 11653 | 12.40 | pass | n/a |
| pwr | intake | intake | gull | oddity | 3169 | 3168 | 0.61 | n/a | pass |
| bwr | core | drywell | puddle | event | 3957 | 4679 | 0.76 | pass | n/a |
| bwr | pzr | torus | steamWisp | event | 10373 | 10893 | 2.00 | pass | n/a |
| bwr | steamline | tunnel | beacon | event | 20728 | 20512 | 4.00 | pass | n/a |
| bwr | steamline | tunnel | condensate | oddity | 5438 | 6774 | 1.05 | n/a | pass |
| bwr | turbine | turbine | pumpStopped | event | 19612 | 18543 | 3.78 | pass | n/a |
| bwr | turbine | turbine | hardhat | oddity | 12273 | 12289 | 2.37 | n/a | FAIL >2.0% |
| bwr | aux | corridor | puddle | event | 12142 | 10938 | 2.34 | pass | n/a |
| bwr | aux | corridor | doorAjar | event | 41602 | 13228 | 8.03 | pass | n/a |
| bwr | aux | corridor | flicker | oddity | 429689 | 429005 | 82.89 | n/a | FAIL >2.0% |
| bwr | aux | corridor | chair | oddity | 8580 | 2858 | 1.66 | n/a | pass |
| bwr | pool | pool | toolBag | event | 10361 | 6533 | 2.00 | pass | n/a |
| bwr | pool | pool | poolLow | event | 38361 | 28928 | 7.40 | pass | n/a |
| bwr | pool | pool | ripple | oddity | 2810 | 2814 | 0.54 | n/a | pass |
| bwr | yard | yard | arc | event | 160231 | 173035 | 30.91 | pass | n/a |
| bwr | yard | yard | fog | oddity | 129917 | 142108 | 25.06 | n/a | FAIL >2.0% |
| bwr | yard | yard | rover:0.5 | other | 3447 | 3857 | 0.66 | pass | n/a |
| bwr | yard | yard | van:0.5 | other | 20115 | 20102 | 3.88 | pass | n/a |
| bwr | intake | intake | debris | event | 64294 | 11653 | 12.40 | pass | n/a |
| bwr | intake | intake | gull | oddity | 3169 | 3168 | 0.61 | n/a | pass |
| pebble | core | cavity | warmGlow | oddity | 79541 | 80104 | 15.34 | n/a | FAIL >2.0% |
| pebble | pzr | blower | shake | event | 28725 | 22866 | 5.54 | pass | n/a |
| pebble | pzr | blower | steamWisp | event | 4507 | 4082 | 0.87 | pass | n/a |
| pebble | steamline | discharge | jam | event | 22651 | 23856 | 4.37 | pass | n/a |
| pebble | turbine | turbine | pumpStopped | event | 19612 | 18543 | 3.78 | pass | n/a |
| pebble | turbine | turbine | hardhat | oddity | 12273 | 12289 | 2.37 | n/a | FAIL >2.0% |
| pebble | aux | corridor | puddle | event | 12142 | 10938 | 2.34 | pass | n/a |
| pebble | aux | corridor | doorAjar | event | 41602 | 13228 | 8.03 | pass | n/a |
| pebble | aux | corridor | flicker | oddity | 429689 | 429005 | 82.89 | n/a | FAIL >2.0% |
| pebble | aux | corridor | chair | oddity | 8580 | 2858 | 1.66 | n/a | pass |
| pebble | pool | pool | toolBag | event | 10361 | 6533 | 2.00 | pass | n/a |
| pebble | pool | pool | poolLow | event | 38361 | 28928 | 7.40 | pass | n/a |
| pebble | pool | pool | ripple | oddity | 2810 | 2814 | 0.54 | n/a | pass |
| pebble | yard | yard | arc | event | 160231 | 173035 | 30.91 | pass | n/a |
| pebble | yard | yard | fog | oddity | 129917 | 142108 | 25.06 | n/a | FAIL >2.0% |
| pebble | yard | yard | rover:0.5 | other | 3447 | 3857 | 0.66 | pass | n/a |
| pebble | yard | yard | van:0.5 | other | 20115 | 20102 | 3.88 | pass | n/a |
| pebble | intake | intake | debris | event | 64294 | 11653 | 12.40 | pass | n/a |
| pebble | intake | intake | gull | oddity | 3169 | 3168 | 0.61 | n/a | pass |
| msr | core | cell | heaterDark | event | 46887 | 312 | 9.04 | pass | n/a |
| msr | core | cell | shadow | oddity | 839 | 4233 | 0.16 | n/a | pass; plate < half of code |
| msr | pzr | freeze | frostGone | event | 46037 | 27320 | 8.88 | pass | n/a |
| msr | steamline | offgas | beacon | event | 16445 | 15486 | 3.17 | pass | n/a |
| msr | turbine | turbine | pumpStopped | event | 19612 | 18543 | 3.78 | pass | n/a |
| msr | turbine | turbine | hardhat | oddity | 12273 | 12289 | 2.37 | n/a | FAIL >2.0% |
| msr | aux | corridor | puddle | event | 12142 | 10938 | 2.34 | pass | n/a |
| msr | aux | corridor | doorAjar | event | 41602 | 13228 | 8.03 | pass | n/a |
| msr | aux | corridor | flicker | oddity | 429689 | 429005 | 82.89 | n/a | FAIL >2.0% |
| msr | aux | corridor | chair | oddity | 8580 | 2858 | 1.66 | n/a | pass |
| msr | pool | pool | toolBag | event | 10361 | 6533 | 2.00 | pass | n/a |
| msr | pool | pool | poolLow | event | 38361 | 28928 | 7.40 | pass | n/a |
| msr | pool | pool | ripple | oddity | 2810 | 2814 | 0.54 | n/a | pass |
| msr | yard | yard | arc | event | 160231 | 173035 | 30.91 | pass | n/a |
| msr | yard | yard | fog | oddity | 129917 | 142108 | 25.06 | n/a | FAIL >2.0% |
| msr | yard | yard | rover:0.5 | other | 3447 | 3857 | 0.66 | pass | n/a |
| msr | yard | yard | van:0.5 | other | 20115 | 20102 | 3.88 | pass | n/a |
| msr | intake | intake | debris | event | 64294 | 11653 | 12.40 | pass | n/a |
| msr | intake | intake | gull | oddity | 3169 | 3168 | 0.61 | n/a | pass |

Page errors: 0.
Every event clears 0.4%.
14 oddities outside 0.12%–2.0%.
