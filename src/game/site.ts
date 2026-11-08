/**
 * Unit 1 site — rooms are not floating cards. Doors have a side.
 * Leave east, enter west. Teaching plant, not a licensed layout.
 */
import { TILE, WALL } from "./const";
import { ROOMS, type RoomId, type Rect } from "./content";

export type Cardinal = "n" | "s" | "e" | "w";

export type Footprint = { x: number; y: number; w: number; h: number; indoor: boolean };

const ROOF_LABEL: Record<Exclude<RoomId, "gate">, string> = {
  cafe: "Cafe",
  parlor: "Arcade",
  corridor: "Hall",
  security: "Hall",
  control: "Control",
  engineering: "Eng",
  breakroom: "Break",
  reactor: "Core",
  maintenance: "Maint",
};

function gateProp(kind: string, label?: string): Rect {
  const hit = ROOMS.gate.props.find((p) => p.kind === kind && (label == null || p.label === label));
  if (!hit) throw new Error(`campus prop missing: ${kind} ${label ?? ""}`);
  return hit.rect;
}

function asTiles(rect: Rect, indoor: boolean): Footprint {
  return {
    x: rect.x / TILE,
    y: rect.y / TILE,
    w: rect.w / TILE,
    h: rect.h / TILE,
    indoor,
  };
}

/** Roof shells on the campus, in tiles. The lot mark is the van, not a building. */
export const FOOTPRINT: Record<RoomId, Footprint> = {
  cafe: asTiles(gateProp("roof", ROOF_LABEL.cafe), true),
  parlor: asTiles(gateProp("roof", ROOF_LABEL.parlor), true),
  gate: asTiles(gateProp("van"), false),
  corridor: asTiles(gateProp("roof", ROOF_LABEL.corridor), true),
  /** Site Access is the front of the Hall building, not a roof of its own. */
  security: asTiles(gateProp("roof", ROOF_LABEL.security), true),
  control: asTiles(gateProp("roof", ROOF_LABEL.control), true),
  engineering: asTiles(gateProp("roof", ROOF_LABEL.engineering), true),
  breakroom: asTiles(gateProp("roof", ROOF_LABEL.breakroom), true),
  reactor: asTiles(gateProp("roof", ROOF_LABEL.reactor), true),
  maintenance: asTiles(gateProp("roof", ROOF_LABEL.maintenance), true),
};

function centerPct(foot: Footprint): { x: number; y: number } {
  const room = ROOMS.gate;
  const x = ((foot.x + foot.w / 2) * TILE) / room.w;
  const y = ((foot.y + foot.h / 2) * TILE) / room.h;
  return { x: Math.round(x * 1000) / 10, y: Math.round(y * 1000) / 10 };
}

/** Label anchors, percent of the campus plan. Centers of the footprints above. */
export const MAP_HUD: Record<RoomId, { x: number; y: number; label: string }> = {
  cafe: { ...centerPct(FOOTPRINT.cafe), label: "Cafe" },
  parlor: { ...centerPct(FOOTPRINT.parlor), label: "Arcade" },
  gate: { ...centerPct(FOOTPRINT.gate), label: "Lot" },
  corridor: { ...centerPct(FOOTPRINT.corridor), label: "Hall" },
  /** Just south of the Hall roof so the two labels do not sit on each other. */
  security: (() => {
    const c = centerPct(FOOTPRINT.security);
    return { x: c.x, y: Math.round((c.y + 16.5) * 10) / 10, label: "Gate" };
  })(),
  control: { ...centerPct(FOOTPRINT.control), label: "Control" },
  engineering: { ...centerPct(FOOTPRINT.engineering), label: "Eng" },
  breakroom: { ...centerPct(FOOTPRINT.breakroom), label: "Break" },
  reactor: { ...centerPct(FOOTPRINT.reactor), label: "Core" },
  maintenance: { ...centerPct(FOOTPRINT.maintenance), label: "Maint" },
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
  gate: "The campus lot. Lake to the north. West into the cafe, east into Site Access.",
  security: "Site Access. Badge kiosk, dosimeter rack, then the portal. West to the lot, east to the hall.",
  corridor: "The spine. Site Access west, control north, engineering south, break east.",
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
