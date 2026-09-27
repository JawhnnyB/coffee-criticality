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

export function doorCardinal(roomId: RoomId, to: RoomId): Cardinal {
  const room = ROOMS[roomId];
  const d = room.doors.find((x) => x.to === to);
  if (!d) return "s";
  const cx = d.rect.x + d.rect.w / 2;
  const cy = d.rect.y + d.rect.h / 2;
  if (d.rect.w <= d.rect.h) return cx < room.w / 2 ? "w" : "e";
  return cy < room.h / 2 ? "n" : "s";
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
  control: "Board A and the Academy terminal. South to the hall.",
  engineering: "Priya's ΔT bench. North to the hall.",
  breakroom: "Kettle and a pause. West hall, east core-side.",
  reactor: "Operating floor. CRDMs on the head. Legs leave the vessel. South to maint.",
  maintenance: "Insulated run, flange, handwheel. Finish the sentence. North to the core hall.",
};

/** Neighbors for the pause map legend. */
export const ROOM_LINKS: Record<RoomId, string> = {
  cafe: "→ lot",
  parlor: "↑ cafe",
  gate: "← cafe  → hall",
  corridor: "↑ control  ↓ eng  → break",
  control: "↓ hall",
  engineering: "↑ hall",
  breakroom: "← hall  → core",
  reactor: "↓ maint",
  maintenance: "↑ core",
};

export function glimpseSrc(to: RoomId): string {
  return `/art/gen/stills/glimpse_${to}.png?v=eval1`;
}
