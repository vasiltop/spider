import { z } from "zod";

const ErrorSchema = z.object({
  error: z.string(),
})

export const json_content = <T extends z.ZodTypeAny>(schema: T, description: string) => ({
  content: {
    'application/json': {
      schema,
    },
  },
  description,
})

export const json_error = (description: string) => ({
  content: {
    'application/json': {
      schema: ErrorSchema,
    },
  },
  description,
})
