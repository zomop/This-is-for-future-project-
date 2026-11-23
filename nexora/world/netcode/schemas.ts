import { z } from "zod";
import { ZONES } from "../constants";

/**
 * Multiplayer payload schemas (spec §8) — shared by client and tests.
 * Every inbound packet is validated before use. Slice 3b wires these up.
 */

export const worldPresenceState = z.object({
  name: z.string().min(1).max(40),
  avatarUrl: z.string().max(500).nullable(),
  frameSlug: z.string().max(40),
  accent: z.string().max(20),
  zone: z.enum(ZONES),
});

export const worldMovePayload = z.object({
  seq: z.number().int().nonnegative(),
  x: z.number().finite().min(0).max(10_000),
  y: z.number().finite().min(0).max(10_000),
  facing: z.enum(["up", "down", "left", "right"]),
  moving: z.boolean(),
});

export const worldChatPayload = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(140),
});

export const worldActionPayload = z.object({
  kind: z.enum(["wave", "sit", "cheer"]),
});

export type WorldPresenceState = z.infer<typeof worldPresenceState>;
export type WorldMovePayload = z.infer<typeof worldMovePayload>;
export type WorldChatPayload = z.infer<typeof worldChatPayload>;
export type WorldActionPayload = z.infer<typeof worldActionPayload>;
