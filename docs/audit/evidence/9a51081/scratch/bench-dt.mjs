// Independent ΔT. Sign: ΔT is hot leg minus cold leg, °C. Positive means the courier left hotter.
// dT = (powerPct / max(40, flowPct)) * unitDt
function dT(powerPct, flowPct, unit) {
  return (powerPct / Math.max(40, flowPct)) * unit;
}
const seed = { powerPct: 62, flowPct: 100 };
const pwrUnit = 32;
const customUnit = 48;
const base = dT(seed.powerPct, seed.flowPct, pwrUnit);
const custom = dT(seed.powerPct, seed.flowPct, customUnit);
const tCold = 292 - (100 - 100) * 0.05;
const tHot = tCold + base;
console.log(JSON.stringify({
  base_dT_C: base,
  base_dT_1dp: base.toFixed(1),
  tCold_C: tCold,
  tHot_C: tHot,
  tHot_1dp: tHot.toFixed(1),
  custom_dT_C: custom,
}));
