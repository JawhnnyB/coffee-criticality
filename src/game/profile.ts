/**
 * One profile for this machine: crew, the dawn paper, endless, the daily board, and the crew carried between weeks.
 * A new week wipes cc.save.v2. This key stays.
 */
export const PROFILE_KEY = "cc.profile";

export type ProfileSection = "crew" | "paper" | "endless" | "daily" | "carry" | "tokens" | "campaign" | "carryColt";

const OLD: Record<ProfileSection, string> = {
  crew: "cc.crew",
  paper: "cc.paper",
  endless: "cc.endless",
  daily: "cc.daily",
  carry: "cc.carry",
  tokens: "cc.tokens",
  campaign: "cc.campaign",
  carryColt: "cc.carryColt",
};

type Bag = Partial<Record<ProfileSection, unknown>>;

function dropOld() {
  for (const key of Object.values(OLD)) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* private mode */
    }
  }
}

function put(next: Bag) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    dropOld();
  } catch {
    /* private mode */
  }
}

function bag(): Bag {
  if (typeof localStorage === "undefined") return {};
  let cur: Bag = {};
  let have = false;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const o = JSON.parse(raw) as Bag;
      if (o && typeof o === "object") {
        cur = o;
        have = true;
      }
    }
  } catch {
    cur = {};
  }
  let moved = false;
  for (const section of Object.keys(OLD) as ProfileSection[]) {
    if (cur[section] != null) continue;
    try {
      const raw = localStorage.getItem(OLD[section]);
      if (raw == null) continue;
      cur[section] = JSON.parse(raw);
      moved = true;
    } catch {
      /* leave a broken old key alone */
    }
  }
  if (moved) put(cur);
  else if (have) dropOld();
  return cur;
}

export function profileGet(section: ProfileSection): unknown {
  return bag()[section];
}

export function profileSet(section: ProfileSection, value: unknown): void {
  const next = bag();
  next[section] = value;
  put(next);
}
