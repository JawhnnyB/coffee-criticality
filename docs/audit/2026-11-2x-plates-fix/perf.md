# Night Watch frame time

Harness: the 21 November review (`paintCamera` alone, 960×540, 40 frames, Chromium CPU throttle). Plates loaded.
Before numbers are that review. After is this branch: graded plate cached (infrared desaturation included), no per-frame `ctx.filter` or saturation fill, scanlines and vignette in one overlay.
The feed itself now paints at 15 fps in the shift. That does not change the per-frame number below.

| Scene | 1× before | 1× after | 4× before | 4× after |
| --- | ---: | ---: | ---: | ---: |
| turbine | 5.5 ms | 1.4 ms | 29 ms | 6.0 ms |
| corridor (door ajar) | 8.4 ms | 1.3 ms | 39 ms | 6.1 ms |
| tunnel (infrared) | 12.5 ms | 1.3 ms | 60 ms | 6.1 ms |
| pool | 8.5 ms | 1.5 ms | 28 ms | 6.7 ms |

Target was 8 ms per feed frame at 4×. Worst scene after the change: 6.7 ms.
The target was met.
