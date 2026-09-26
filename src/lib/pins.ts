import L from "leaflet";
import { metaFor } from "./categories";

/**
 * Map pins. Pure CSS/emoji divIcons — no image files, so nothing can ever
 * render as a broken/placeholder image.
 */

const pinCache = new Map<string, L.DivIcon>();

const TEARDROP =
  "width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);" +
  "display:flex;align-items:center;justify-content:center;" +
  "box-shadow:0 1px 5px rgba(0,0,0,.45);border:1.5px solid rgba(255,255,255,.75)";

/**
 * Category pin. Normal places: category colour + category emoji.
 * Manual places (isManual): same category colour (so Shopping = pink either
 * way) but a ⭐ star instead of the emoji — ownership marker, consistent
 * colour language.
 */
export function pinIcon(category: string, isManual = false): L.DivIcon {
  const key = `${category}:${isManual}`;
  let icon = pinCache.get(key);
  if (!icon) {
    const { emoji, color } = metaFor(category);
    icon = L.divIcon({
      className: "",
      html:
        `<div title="${isManual ? `Added by you — ${category}` : category}" style="background:${color};${TEARDROP}">` +
        `<span style="transform:rotate(45deg);font-size:${isManual ? 14 : 13}px;line-height:1">${
          isManual ? "⭐" : emoji
        }</span></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -22],
    });
    pinCache.set(key, icon);
  }
  return icon;
}
