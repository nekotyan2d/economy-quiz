import { z } from "zod";
import { assertRegisterRateLimit } from "../utils/rate-limit";
import { registerParticipant } from "../store";

const schema = z.object({
    name: z
        .string()
        .min(2, "Имя должно содержать минимум 2 символа")
        .max(30, "Имя должно содержать максимум 30 символов")
        .regex(/^[A-Za-zА-Яа-яЁё0-9 _-]+$/, "Недопустимые символы"),
});

export default defineEventHandler(async (event) => {
    assertRegisterRateLimit(event);
    const body = await readBody(event);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? "Неверные данные" });
    }

    const participant = registerParticipant(parsed.data.name.trim());
    return {
        sessionId: participant.sessionId,
        name: participant.name,
    };
});
