import { z } from "zod";
import { submitCrosswordWord } from "../store";

const schema = z.object({
    sessionId: z.string().uuid(),
    wordId: z.string().min(1),
    answer: z.string().min(1),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: "Неверные данные кроссворда" });
    }

    return submitCrosswordWord(parsed.data.sessionId, parsed.data.wordId, parsed.data.answer);
});
