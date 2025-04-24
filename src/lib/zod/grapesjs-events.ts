import { z } from "zod";

export const CollabUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const PresenceEventSchema = z.array(CollabUserSchema);

export const LockEventSchema = z.object({
  elementId: z.string(),
  user: CollabUserSchema,
});

export const GrapesJSEventSchema = z.object({
  type: z.string(),
  id: z.string(),
  payload: z.any(),
});
