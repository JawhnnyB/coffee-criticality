# Step 10c

Auto stays on the display clock. It steps down to 30 only when a 2 second run of pictures is later than 18 ms, or the thread hold averages over 14 ms, and it comes back after 2 seconds under 10 ms.

Settings, on the desktop, has Frame rate: Auto, 60, or 30. The choice is saved with the shift. A reload kept 30.

| Run | Picture | Busy |
| --- | --- | --- |
| 1× Auto | 16.67 ms, every frame | 15.2% |
| 4× Auto | 16.67 ms, every frame | 57.0% |
| 6× Auto | 33.33 ms, steady | 45.6% |
| 60, at 6× | stayed on 60, mean 16.84 ms | 85.6% |
| 30, at 1× | 33.33 ms, steady | 7.6% |
| Auto again, at 1× | 16.67 ms, every frame | 13.9% |

The 4× CPU is on time, so it stays at 60 even though it is busier. Forcing 60 on a 6× CPU kept the rate at full. Five frames in that run were late, one of them 33.4 ms, because the CPU missed the screen, not because the setting stepped down.
