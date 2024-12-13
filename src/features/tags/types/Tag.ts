import { z } from "zod";

export interface NewTag {
  value: string;
}

export type Tag = z.infer<typeof Tag>;

export const Tag = z.object({
  id: z.number(),
  value: z.string(),
});
