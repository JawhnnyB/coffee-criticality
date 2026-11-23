# Step 1d

The owner allowed two edits in the frozen delay cabinet. Nothing else in that file moved. W and S still insert and withdraw. The hint line still says A/D.

The loop returns before it steps time while the pause card is up. Left and right read the binds. Arrows still slide the rod.

Left was saved as F. F walked the rod from 612 to 540. A, which is no longer left, left it on 540. Escape kept the mode on delay. The picture did not change for 450 ms. Resume did.

```diff
import { hostOwnsKey, readHeld } from "./keyGate";
+import { actHeld } from "./binds";
+import { shiftHeld } from "./hold";

     const loop = (now: number) => {
       if (endRef.current) return;
+      if (shiftHeld()) {
+        last = now;
+        raf = requestAnimationFrame(loop);
+        return;
+      }
       const dt = Math.min(0.04, (now - last) / 1000);

-      if (readHeld("mini", keys, "KeyA") || readHeld("mini", keys, "ArrowLeft")) rodX -= 90 * dt;
-      if (readHeld("mini", keys, "KeyD") || readHeld("mini", keys, "ArrowRight")) rodX += 90 * dt;
+      if (actHeld((c) => readHeld("mini", keys, c), "left", "ArrowLeft")) rodX -= 90 * dt;
+      if (actHeld((c) => readHeld("mini", keys, c), "right", "ArrowRight")) rodX += 90 * dt;
```
