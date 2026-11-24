/**
 * "How real is this?" Draft notes for the owner. Not regulations, and not a procedure.
 * Step 63 decides which ones a play has opened. This file only holds the words.
 */
export interface CodexEntry {
  id: string;
  title: string;
  /** One short note. Draft. */
  body: string;
  /** What opens it, in plain words, for the owner. */
  opens: string;
}

export const CODEX: CodexEntry[] = [
  { id: "teaching-model", title: "Teaching model", opens: "Open from the start.", body: "The plant is a classroom. Numbers are rounded so a shift can be played. Nothing here is a license, a procedure, or a setpoint to take to work." },
  { id: "cherenkov", title: "Cherenkov light", opens: "Look at the fuel pool camera.", body: "The blue in a pool is light from charged particles moving faster than light does in water. DOE describes it that way. The picture in the game is a drawing." },
  { id: "freeze-valve", title: "Freeze valves", opens: "Look at the freeze-valve camera, or catch that event.", body: "MSRE held a plug of salt frozen with cooling air. Stop the air and add heat, and the plug thaws. The fan, the timer, and the trip in the game are not that plant." },
  { id: "beavrs", title: "BEAVRS", opens: "Open the refuelling outage.", body: "BEAVRS is a public benchmark of a 4-loop Westinghouse core, with two cycles of measured data from MIT. The outage uses that map. The cycle runner is this game's own model." },
  { id: "rounds", title: "Rounds", opens: "Take a night watch.", body: "Real plants are walked. People look, and they write down what they saw. The cameras, the tablet, and the timer are the game's way of playing that idea." },
  { id: "turnover", title: "Turnover", opens: "Finish a night and read the sheet.", body: "A real watch ends with a turnover: what happened, what is still open, what the next person needs. Elena's sheet is a story version of that, not a form from a plant." },
  { id: "relief-valve", title: "Relief valve", opens: "Catch the steam leak, on the day or on the night board.", body: "A relief valve that weeps can drop pressure. The day hiss and the night pressurizer event are that kind of story. The words to say, and the valve to touch, are not in this game." },
  { id: "primary-pressure", title: "Primary pressure", opens: "Design a plant.", body: "The PWR board sits near 15.5 MPa, about 2250 psia, so the water stays liquid. That matches the public band. It is not one unit's setpoint." },
  { id: "steam-pressure", title: "Steam pressure", opens: "Design a plant.", body: "The steam-generator gauge sits near 6.9 MPa, about 1000 psi. A public 4-loop example uses that steam pressure. The alarm band around it is the game's." },
  { id: "bwr-pressure", title: "A boiling core", opens: "Design a plant, or stand a BWR night.", body: "A BWR boils in the vessel, near 7 MPa on this board and 7.2 MPa in the builder. Those two numbers are not the same. Both are classroom rounding, not a dome pressure to use." },
  { id: "pebble-helium", title: "Helium and pebbles", opens: "Design a pebble plant, or stand that night.", body: "Published HTR-PM tables use about 7 MPa helium and an outlet near 750 °C. The night board follows that. The builder still says 6.0 MPa. Neither is an NRC plant." },
  { id: "cover-gas", title: "Cover gas", opens: "Design a salt plant, or stand that night.", body: "An ORNL drain note uses 5 psig of helium to move salt. The night gauge says 5 psig. The freeze-plug temperature on that board was not found in the notes that were opened." },
  { id: "pool-depth", title: "Pool depth", opens: "Look at the fuel pool camera.", body: "DOE describes a typical spent-fuel pool as at least 40 feet deep. The night gauge reads 7 metres. That gauge is not a pool depth." },
  { id: "pressurizer", title: "Pressurizer", opens: "Catch the day leak, or look at the pressurizer camera.", body: "A PWR pressurizer is the surge tank that keeps primary pressure. The level on the board starts at 55 percent because the game needed a middle. That is not a program band." },
  { id: "sump", title: "Sump", opens: "File a leak on a night.", body: "Water that does not belong on a floor shows up in a sump. The centimetres on the board are a teaching scale, not an instrument reading." },
  { id: "false-report", title: "A wrong report", opens: "Take a night watch.", body: "Calling a flicker a leak is how the night fails you. Three wrong reports and Elena takes the chair. That count is a rule of the game." },
  { id: "coffee", title: "Coffee", opens: "Take a night watch.", body: "The pot is the game's stand-in for attention. A real watch does not run on six cups and a tablet. Brewing here only keeps the cameras up." },
  { id: "peaking", title: "The peak", opens: "Finish a fuel shuffle or a loading puzzle.", body: "Fq is the hottest assembly divided by the average. The puzzle line is chosen so the search has a shape. It is not a technical specification." },
  { id: "rim", title: "Rim share", opens: "Finish a fuel shuffle or a loading puzzle.", body: "The rim share is how much of the power sits on the outside of this 36-cell map. Holding it under a half is a rule of the puzzle, not of a core." },
  { id: "boron", title: "Boron letdown", opens: "Run a cycle in the outage.", body: "A real PWR lets boron fall as the fuel burns, so the core stays critical. The curve in the outage is this simulator beside the plant's measured points. It is not a prediction to operate on." },
  { id: "discharge", title: "What leaves the core", opens: "Choose a discharge in the outage.", body: "BEAVRS cycle 1 loaded 1.6 percent fuel with no absorbers in a known pattern. The game asks you to pick the once-burned assemblies of that batch. The score is overlap with that pattern." },
  { id: "rods", title: "Control rods", opens: "Play a rod cabinet.", body: "A rod is absorber you can move. In goes down, out goes up, for a thermal water core. Banks, steps, and cooldowns in the cabinet are a toy of that idea." },
  { id: "delayed", title: "Delayed neutrons", opens: "Play the delay cabinet.", body: "A few neutrons arrive late, from fission products. That delay is why a core has a slope instead of a step. The cabinet speeds the groups so you can feel them." },
  { id: "xenon", title: "Xenon", opens: "Play the load cabinet.", body: "Xenon-135 eats neutrons and follows power with a lag. The load cabinet's pulses are a sketch of that lag. They are not a xenon-worth calculation." },
  { id: "alara", title: "Time, distance, shielding", opens: "Catch the dose story, or open Radiation.", body: "Those three words are the public idea of keeping dose low. The game does not show dose numbers. Standing closer is not a method." },
  { id: "lockout", title: "A tag on a pump", opens: "Catch the tag on day 2.", body: "A tag that says a machine is in service, hung on a machine that is not, is a story about reading the field. The cabinet is a hunt, not a lockout course." },
  { id: "culture", title: "Catch it cheap", opens: "Report something, or hide something.", body: "The week cares whether you say what you saw. That is the game's culture meter. It is not a plant program and it does not score a real crew." },
  { id: "hours", title: "Days off", opens: "Reach the night rotation.", body: "The three days off are a beat in the story. They are not a work-hour limit, and the game does not tell you how long a real watch may be." },
  { id: "grades", title: "The letter", opens: "Finish a night.", body: "A, B, C, D, and F are how this game talks about a watch. A plant does not grade a night that way. A trip or a relief is an F here because the story ends." },
  { id: "four-plants", title: "Four plants", opens: "Design a plant.", body: "PWR, BWR, pebble, and salt are four pictures of heat leaving. The same desk and the same night fit all four, which a real site would not. Comparison only." },
];
