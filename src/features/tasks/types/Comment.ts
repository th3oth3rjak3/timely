import { z } from "zod";

export const Comment = z.object({
  id: z.number(),
  taskId: z.number(),
  message: z.string(),
  created: z.string().transform((isoStr) => new Date(isoStr)),
  modified: z
    .string()
    .nullable()
    .transform((isoStr) => (isoStr === null ? null : new Date(isoStr))),
});

export type Comment = z.infer<typeof Comment>;
