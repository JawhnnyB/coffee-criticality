// Independent recomputation. Inputs are the raw toppled counts from a seeded roll
// (aim -0.24 rad, power 1, dt = 1/60 s). This file does not import the game.
const falls = [6, 1];
const k = falls[0] > 0 ? falls[1] / falls[0] : null;
console.log(JSON.stringify({ falls, k }));
