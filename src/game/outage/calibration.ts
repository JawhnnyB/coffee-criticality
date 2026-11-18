/**
 * Written by scripts/outage-calibrate.mjs. Do not edit by hand: rerun the script.
 * Core constants fitted to the measured BEAVRS Cycle 1 zero-power map and 975 ppm critical boron.
 * Preset burnup parameters fitted to the measured BEAVRS boron letdown, Cycles 1 and 2.
 */
export const CORE = { feedback: 0.04, m2: 47.9081, reflectorAbs: 4.54702, axialShift: 0.0016921 };

export const PRESET_FIT = {
  slope: 0.0113431,
  baBurnout: 6.05945,
  baResidual: 0.00000594349,
  hfpShift: -0.0492402,
  boronWorth: -0.00014175,
};

export const FIT_REPORT = "HZP detector map 9.9% RMS (assemblies without absorbers, fitted); letdown RMS 10 ppm cycle 1, 13 ppm cycle 2 (fitted); cycle 1 detector map at 1.0233 GWd/t 17.7% RMS (feedback fit); cycle 1 detector map at 4.6135 GWd/t 18.0% RMS (not fitted); cycle 1 detector map at 9.8029 GWd/t 12.2% RMS (not fitted); cycle 1 detector map at 12.9152 GWd/t 10.2% RMS (not fitted); cycle 2 detector map at 0.013 GWd/t 10.7% RMS (feedback fit); cycle 2 detector map at 5.2258 GWd/t 8.3% RMS (not fitted); cycle 2 detector map at 9.3567 GWd/t 8.4% RMS (not fitted); cycle length to 0 ppm 315 vs 327.2 EFPD, 290 vs 272.7 EFPD";
