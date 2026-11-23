# Night Watch, human check

Plain and changed, side by side, at 480×270. One moment, t = 1.25 s. Plates on.
A pixel counts when any channel moves by 24 or more. Regions are 4-connected.
An event passes when the largest region is at least 388.8 pixels (0.3% of the frame) and that region is at least 60% of the changed pixels, so the change is in one place.
An oddity passes when the changed pixels are between 155.5 and 2592.0 (0.12% to 2%).
The same scene and visual is one picture. Shared events are listed once per site and drawn once on the sheet.

| Site | Camera | Scene | Visual | Kind | Changed px | Changed % | Largest px | Largest % | Share | Rule |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| pwr | core | containment | puddle | event | 862 | 0.67 | 720 | 0.56 | 84% | pass |
| pwr | pzr | pressurizer | steamWisp | event | 1181 | 0.91 | 1181 | 0.91 | 100% | pass |
| pwr | pzr | pressurizer | flicker | oddity | 534 | 0.41 | 534 | 0.41 | 100% | pass |
| pwr | steamline | msiv | beacon | event | 3728 | 2.88 | 3428 | 2.65 | 92% | pass |
| pwr | turbine | turbine | pumpStopped | event | 4907 | 3.79 | 4877 | 3.76 | 99% | pass |
| pwr | aux | corridor | puddle | event | 788 | 0.61 | 682 | 0.53 | 87% | pass |
| pwr | aux | corridor | doorAjar | event | 10252 | 7.91 | 9617 | 7.42 | 94% | pass |
| pwr | aux | corridor | flicker | oddity | 568 | 0.44 | 568 | 0.44 | 100% | pass |
| pwr | aux | corridor | chair | oddity | 2149 | 1.66 | 2149 | 1.66 | 100% | pass |
| pwr | aux | corridor | hardhat | oddity | 1446 | 1.12 | 763 | 0.59 | 53% | pass |
| pwr | pool | pool | toolBag | event | 2115 | 1.63 | 1628 | 1.26 | 77% | pass |
| pwr | pool | pool | poolLow | event | 880 | 0.68 | 224 | 0.17 | 25% | FAIL <0.3% and not one place |
| pwr | pool | pool | ripple | oddity | 244 | 0.19 | 55 | 0.04 | 23% | pass |
| pwr | yard | yard | arc | event | 926 | 0.71 | 431 | 0.33 | 47% | FAIL not one place |
| pwr | yard | yard | fog | oddity | 583 | 0.45 | 298 | 0.23 | 51% | pass |
| pwr | intake | intake | debris | event | 4992 | 3.85 | 2434 | 1.88 | 49% | FAIL not one place |
| pwr | intake | intake | gull | oddity | 453 | 0.35 | 453 | 0.35 | 100% | pass |
| bwr | core | drywell | puddle | event | 708 | 0.55 | 586 | 0.45 | 83% | pass |
| bwr | pzr | torus | steamWisp | event | 2564 | 1.98 | 1357 | 1.05 | 53% | FAIL not one place |
| bwr | steamline | tunnel | beacon | event | 5181 | 4.00 | 5015 | 3.87 | 97% | pass |
| bwr | steamline | tunnel | condensate | oddity | 17 | 0.01 | 4 | 0.00 | 24% | FAIL <0.12% |
| bwr | turbine | turbine | pumpStopped | event | 4907 | 3.79 | 4877 | 3.76 | 99% | pass |
| bwr | aux | corridor | puddle | event | 788 | 0.61 | 682 | 0.53 | 87% | pass |
| bwr | aux | corridor | doorAjar | event | 10252 | 7.91 | 9617 | 7.42 | 94% | pass |
| bwr | aux | corridor | flicker | oddity | 568 | 0.44 | 568 | 0.44 | 100% | pass |
| bwr | aux | corridor | chair | oddity | 2149 | 1.66 | 2149 | 1.66 | 100% | pass |
| bwr | aux | corridor | hardhat | oddity | 1446 | 1.12 | 763 | 0.59 | 53% | pass |
| bwr | pool | pool | toolBag | event | 2115 | 1.63 | 1628 | 1.26 | 77% | pass |
| bwr | pool | pool | poolLow | event | 880 | 0.68 | 224 | 0.17 | 25% | FAIL <0.3% and not one place |
| bwr | pool | pool | ripple | oddity | 244 | 0.19 | 55 | 0.04 | 23% | pass |
| bwr | yard | yard | arc | event | 926 | 0.71 | 431 | 0.33 | 47% | FAIL not one place |
| bwr | yard | yard | fog | oddity | 583 | 0.45 | 298 | 0.23 | 51% | pass |
| bwr | intake | intake | debris | event | 4992 | 3.85 | 2434 | 1.88 | 49% | FAIL not one place |
| bwr | intake | intake | gull | oddity | 453 | 0.35 | 453 | 0.35 | 100% | pass |
| pebble | core | cavity | warmGlow | oddity | 801 | 0.62 | 800 | 0.62 | 100% | pass |
| pebble | pzr | blower | shake | event | 6980 | 5.39 | 6096 | 4.70 | 87% | pass |
| pebble | pzr | blower | steamWisp | event | 1120 | 0.86 | 1116 | 0.86 | 100% | pass |
| pebble | steamline | discharge | jam | event | 4981 | 3.84 | 4943 | 3.81 | 99% | pass |
| pebble | turbine | turbine | pumpStopped | event | 4907 | 3.79 | 4877 | 3.76 | 99% | pass |
| pebble | aux | corridor | puddle | event | 788 | 0.61 | 682 | 0.53 | 87% | pass |
| pebble | aux | corridor | doorAjar | event | 10252 | 7.91 | 9617 | 7.42 | 94% | pass |
| pebble | aux | corridor | flicker | oddity | 568 | 0.44 | 568 | 0.44 | 100% | pass |
| pebble | aux | corridor | chair | oddity | 2149 | 1.66 | 2149 | 1.66 | 100% | pass |
| pebble | aux | corridor | hardhat | oddity | 1446 | 1.12 | 763 | 0.59 | 53% | pass |
| pebble | pool | pool | toolBag | event | 2115 | 1.63 | 1628 | 1.26 | 77% | pass |
| pebble | pool | pool | poolLow | event | 880 | 0.68 | 224 | 0.17 | 25% | FAIL <0.3% and not one place |
| pebble | pool | pool | ripple | oddity | 244 | 0.19 | 55 | 0.04 | 23% | pass |
| pebble | yard | yard | arc | event | 926 | 0.71 | 431 | 0.33 | 47% | FAIL not one place |
| pebble | yard | yard | fog | oddity | 583 | 0.45 | 298 | 0.23 | 51% | pass |
| pebble | intake | intake | debris | event | 4992 | 3.85 | 2434 | 1.88 | 49% | FAIL not one place |
| pebble | intake | intake | gull | oddity | 453 | 0.35 | 453 | 0.35 | 100% | pass |
| msr | core | cell | heaterDark | event | 11617 | 8.96 | 5612 | 4.33 | 48% | FAIL not one place |
| msr | core | cell | shadow | oddity | 168 | 0.13 | 87 | 0.07 | 52% | pass |
| msr | pzr | freeze | frostGone | event | 11705 | 9.03 | 11076 | 8.55 | 95% | pass |
| msr | steamline | offgas | beacon | event | 4145 | 3.20 | 4126 | 3.18 | 100% | pass |
| msr | turbine | turbine | pumpStopped | event | 4907 | 3.79 | 4877 | 3.76 | 99% | pass |
| msr | aux | corridor | puddle | event | 788 | 0.61 | 682 | 0.53 | 87% | pass |
| msr | aux | corridor | doorAjar | event | 10252 | 7.91 | 9617 | 7.42 | 94% | pass |
| msr | aux | corridor | flicker | oddity | 568 | 0.44 | 568 | 0.44 | 100% | pass |
| msr | aux | corridor | chair | oddity | 2149 | 1.66 | 2149 | 1.66 | 100% | pass |
| msr | aux | corridor | hardhat | oddity | 1446 | 1.12 | 763 | 0.59 | 53% | pass |
| msr | pool | pool | toolBag | event | 2115 | 1.63 | 1628 | 1.26 | 77% | pass |
| msr | pool | pool | poolLow | event | 880 | 0.68 | 224 | 0.17 | 25% | FAIL <0.3% and not one place |
| msr | pool | pool | ripple | oddity | 244 | 0.19 | 55 | 0.04 | 23% | pass |
| msr | yard | yard | arc | event | 926 | 0.71 | 431 | 0.33 | 47% | FAIL not one place |
| msr | yard | yard | fog | oddity | 583 | 0.45 | 298 | 0.23 | 51% | pass |
| msr | intake | intake | debris | event | 4992 | 3.85 | 2434 | 1.88 | 49% | FAIL not one place |
| msr | intake | intake | gull | oddity | 453 | 0.35 | 453 | 0.35 | 100% | pass |

Page errors: 0.
14 event rows fail.
1 oddity row fails.
Contact sheet: events.png. Each row is plain on the left, changed on the right.
