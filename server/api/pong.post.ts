import { z } from "zod";
import { submitPong } from "../store";

const schema = z.object({
    sessionId: z.string().uuid(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: "Некорректный sessionId" });
    }

    submitPong(parsed.data.sessionId);
    return { ok: true };
});
