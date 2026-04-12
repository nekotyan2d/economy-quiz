import { z } from "zod";
import { startStage } from "../../store";
import { assertAdmin } from "../../utils/admin";

const schema = z.object({
    stage: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export default defineEventHandler(async (event) => {
    assertAdmin(event);
    const body = await readBody(event);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: "stage должен быть 1, 2 или 3" });
    }

    startStage(parsed.data.stage);
    return { ok: true };
});
