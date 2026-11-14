import type { ResidueHow } from "./content";

/**
 * What Board A and the paper log say for one day and one residue mark.
 * Day 5 does not change with the mark. Leaf is a catch only.
 * Gold or the warning red is a lie. The draw code paints those colours.
 */
export interface BoardFace {
  /** Board A headline. */
  line: string;
  paperMid: string;
  paperFoot: string;
  /** True only when this mark is a catch and the day is not shuffle day. */
  leaf: boolean;
}

export function boardFace(day: number, mark: ResidueHow): BoardFace {
  if (day >= 5 || day < 1) {
    return { line: "SHUFFLE DAY", paperMid: "SHUFFLE", paperFoot: "DAY", leaf: false };
  }
  const caught = mark === "caught";
  if (day === 1) {
    return {
      line: caught ? "14-R CLOSED" : "14-B OPEN",
      paperMid: "14-R CLOSED",
      paperFoot: caught ? "CAUGHT" : mark === "hid" ? "HID" : "!= 14-B",
      leaf: caught,
    };
  }
  if (day === 2) {
    return {
      line: caught ? "2A LOCKED" : "2A IN SVC",
      paperMid: caught ? "2A LOCKED" : "2A IN SVC",
      paperFoot: caught ? "CAUGHT" : mark === "hid" ? "HID" : "CHECK",
      leaf: caught,
    };
  }
  if (day === 3) {
    return {
      line: caught ? "0.04 mSv/h" : "40 mSv/h",
      paperMid: caught ? "0.04" : "40",
      paperFoot: caught ? "CAUGHT" : mark === "hid" ? "HID" : "CHECK",
      leaf: caught,
    };
  }
  return {
    line: caught ? "LOG SIGNED" : mark === "hid" ? "YOUR NAME" : "NO INITIALS",
    paperMid: caught ? "SIGNED" : mark === "hid" ? "YOUR NAME" : "- 07:12",
    paperFoot: caught ? "CAUGHT" : mark === "hid" ? "HID" : "BLANK",
    leaf: caught,
  };
}
