import { z } from "zod";
import { submitAnswer } from "../store";

const schema = z.object({
    sessionId: z.string().uuid(),
    optionIndex: z.number().int().min(0).max(3),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: "Неверный формат ответа" });
    }

    return submitAnswer(parsed.data.sessionId, parsed.data.optionIndex as 0 | 1 | 2 | 3);
});
