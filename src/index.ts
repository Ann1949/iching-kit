export * from "./types.js";
export * from "./data.js";
export * from "./cast.js";
export * from "./reading.js";
export * from "./relations.js";

import { castCoins } from "./cast.js";
import { read } from "./reading.js";
import type { Cast, Reading } from "./types.js";

/** A cast together with the reading it produces. */
export interface Divination extends Cast {
  reading: Reading;
}

/**
 * Cast by coins and apply Zhu Xi's reading rules in one call.
 *
 * Pass your own `random` for a reproducible result.
 */
export function divine(random?: () => number): Divination {
  const cast = castCoins(random);
  return { ...cast, reading: read(cast) };
}
