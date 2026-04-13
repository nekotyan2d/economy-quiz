import { z } from "zod";
import { kickParticipant } from "../../store";
import { assertAdmin } from "../../utils/admin";

const schema = z.object({
    sessionId: z.string().uuid("Некорректный sessionId"),
});

export default defineEventHandler(async (event) => {
    assertAdmin(event);

    const body = await readBody(event);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? "Неверные данные" });
    }

    kickParticipant(parsed.data.sessionId);

    return { ok: true };
});
