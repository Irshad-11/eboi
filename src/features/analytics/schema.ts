import { z } from "zod";
import { EVENT_TYPES } from "@/config/analytics";

/** Shape of a beacon sent by the browser. Everything is bounded and optional where possible. */
export const trackPayloadSchema = z.object({
  type: z.enum(EVENT_TYPES),
  bookId: z.uuid().nullable().optional(),
  section: z.string().trim().max(60).nullable().optional(),
  term: z.string().trim().max(80).nullable().optional(),
  resultCount: z.number().int().min(0).max(100000).nullable().optional(),
  page: z.number().int().min(1).max(1000).nullable().optional(),
  path: z.string().max(300).nullable().optional(),
  referrer: z.string().max(120).nullable().optional(),
  anonId: z.string().regex(/^[a-z0-9]{8,64}$/i),
  sessionId: z.string().regex(/^[a-z0-9]{8,64}$/i),
  dedupeKey: z.string().min(1).max(200),
});

export type TrackPayload = z.infer<typeof trackPayloadSchema>;
