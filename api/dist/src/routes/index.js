import { z } from "zod";
const ErrorSchema = z.object({
    error: z.string(),
});
export const json_content = (schema, description) => ({
    content: {
        'application/json': {
            schema,
        },
    },
    description,
});
export const json_error = (description) => ({
    content: {
        'application/json': {
            schema: ErrorSchema,
        },
    },
    description,
});
