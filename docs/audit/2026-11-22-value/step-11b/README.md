# Step 11b

Same desk week as step 11. Heap is `JSHeapUsedSize` after a forced collection. Beside it, the renderer process RSS: the Chrome process whose command line contains `--type=renderer`, summed for children of this run's browser.

The first measure kept the night photos and the camera canvases after each shift. Day 1 morning was 154.4 MB. Dawn was 252.5 MB. That is +98.1 MB, over the 50 MB line.

A finished shift now drops those. The plate pixels are image bitmaps, closed when the shift ends. The cached camera canvases are sized back to zero. The night hum stops and drops its noise buffer.

The second measure, same week, seed 1:

| When | JS heap | Renderer |
|---|---|---|
| Day 1 morning | 6.0 MB | 155.0 MB |
| Dusk | 6.3 MB | 165.7 MB |
| After night 1 | 7.5 MB | 175.7 MB |
| After night 2 | 7.6 MB | 177.6 MB |
| After night 3 | 7.5 MB | 178.9 MB |
| After night 4 | 7.5 MB | 181.5 MB |
| Dawn | 7.5 MB | 180.0 MB |

Renderer growth from day 1 morning to dawn is 25.0 MB. The limit is 50. The JS heap grew 1.5 MB. Nights were A, A, A, A. The lot at dawn came up. One renderer process the whole way.

`VALUE_STEP=11b HEAP=1 node scripts/value-week.mjs http://127.0.0.1:8099/ desk`
