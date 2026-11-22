# Step 10b

The day picture runs at the display rate. On this machine that is 60 a second, one interval of 16.67 ms after another for 10 seconds.

A 4× CPU does not make those intervals late. The frame lets go of the thread in 13 ms, then waits for the screen. A rule that only watches for a 20 ms gap would have stayed at 60 and left the shift at about 60 percent busy. The loop also watches that hold. Over 6 ms for two seconds, it steps down to 30. Under 4 ms for two seconds, it steps back up. The 30 is not a mix of 33 and 50: the slow run sat at 33.33 ms (33.20 to 33.50) for 10 seconds.

The update step stays 1/60 of a second, two of them on a 30 picture. One second of walking covered 70 px at full rate and 70 px at 4×.

Standing at 4× after the step-down: 33.6 percent busy. Target was under 40.

`node scripts/frame-pace.mjs http://127.0.0.1:8097/`
