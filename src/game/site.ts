/**
 * Unit 1 site — rooms are not floating cards. Doors have a side.
 * Leave east, enter west. Teaching plant, not a licensed layout.
 */
import { WALL } from "./const";
import { ROOMS, type RoomId } from "./content";

export type Cardinal = "n" | "s" | "e" | "w";

/** Footprints on the campus grid (tiles). Minimap + future outdoor merge. */
export const FOOTPRINT: Record<RoomId, { x: number; y: number; indoor: boolean }> = {
  cafe: { x: 2, y: 10, indoor: true },
  parlor: { x: 2, y: 24, indoor: true },
  gate: { x: 23, y: 10, indoor: false },
  corridor: { x: 42, y: 12, indoor: true },
  control: { x: 46, y: 0, indoor: true },
  engineering: { x: 46, y: 25, indoor: true },
  breakroom: { x: 67, y: 12, indoor: true },
  reactor: { x: 69, y: 0, indoor: true },
  maintenance: { x: 70, y: 25, indoor: true },
};

/** Pixel centers on the 320×180 campus plan, as percent. Pause map pip + labels. */
export const MAP_HUD: Record<RoomId, { x: number; y: number; label: string }> = {
  cafe: { x: 15.9, y: 52.2, label: "Cafe" },
  parlor: { x: 15.9, y: 80.0, label: "Arcade" },
  gate: { x: 36.9, y: 54.4, label: "Lot" },
  corridor: { x: 54.7, y: 52.2, label: "Hall" },
  control: { x: 56.6, y: 20.6, label: "Control" },
  engineering: { x: 56.6, y: 81.1, label: "Eng" },
  breakroom: { x: 70.0, y: 52.2, label: "Break" },
  reactor: { x: 87.8, y: 21.1, label: "Core" },
  maintenance: { x: 87.8, y: 81.1, label: "Maint" },
};

export function sideOf(roomId: RoomId, rect: { x: number; y: number; w: number; h: number }): Cardinal {
  const room = ROOMS[roomId];
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  if (rect.w <= rect.h) return cx < room.w / 2 ? "w" : "e";
  return cy < room.h / 2 ? "n" : "s";
}

export function doorCardinal(roomId: RoomId, to: RoomId): Cardinal {
  const room = ROOMS[roomId];
  const d = room.doors.find((x) => x.to === to);
  if (!d) return "s";
  return sideOf(roomId, d.rect);
}

/** Stand just inside the destination door that leads back to `from`. */
export function spawnInside(to: RoomId, from: RoomId): { x: number; y: number } {
  const dest = ROOMS[to];
  const d = dest.doors.find((x) => x.to === from);
  if (!d) return { x: dest.w / 2, y: Math.max(WALL + 28, dest.h / 2) };
  const pad = 22;
  const cx = d.rect.x + d.rect.w / 2;
  const cy = d.rect.y + d.rect.h / 2;
  const side = doorCardinal(to, from);
  if (side === "n") return { x: cx, y: d.rect.y + d.rect.h + pad };
  if (side === "s") return { x: cx, y: Math.max(WALL + 20, d.rect.y - pad) };
  if (side === "w") return { x: d.rect.x + d.rect.w + pad, y: cy };
  return { x: d.rect.x - pad, y: cy };
}

export const ROOM_BLURB: Record<RoomId, string> = {
  cafe: "Mabel's counter. Sit first. East door to the lot.",
  parlor: "North wall is Unit 1. South is after-shift. Same bezel. Cafe is north.",
  gate: "Asphalt and the van. West cafe, east hall.",
  corridor: "The spine. Control north, engineering south, break east.",
  control: "Board A and the Academy terminal. South to the hall, east to the core.",
  engineering: "Priya's ΔT bench. North to the hall, east to maint.",
  breakroom: "Kettle and a pause. West to the hall, north to the core.",
  reactor: "Operating floor. CRDMs on the head. Legs leave the vessel. West to control, south to break and maint.",
  maintenance: "Insulated run, flange, handwheel. Finish the sentence. North to the core, west to engineering.",
};

const LINK_ARROW: Record<Cardinal, string> = { n: "↑", e: "→", s: "↓", w: "←" };
const LINK_ORDER: Record<Cardinal, number> = { n: 0, e: 1, s: 2, w: 3 };

/** Pause-map neighbors, from the door rects. Do not hand-type this. */
export function roomLinks(id: RoomId): string {
  return [...ROOMS[id].doors]
    .map((d) => ({ side: sideOf(id, d.rect), label: MAP_HUD[d.to].label.toLowerCase() }))
    .sort((a, b) => LINK_ORDER[a.side] - LINK_ORDER[b.side] || a.label.localeCompare(b.label))
    .map((d) => `${LINK_ARROW[d.side]} ${d.label}`)
    .join("  ");
}

export function glimpseSrc(to: RoomId): string {
  return `/art/gen/stills/glimpse_${to}.png?v=eval1`;
}
