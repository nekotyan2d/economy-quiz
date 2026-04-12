import { z } from "zod";
import { getCurrentQuestionPublic, getLeaderboard, getStoreSnapshot, restoreSession } from "../store";

const schema = z.object({
    sessionId: z.string().uuid(),
});

export default defineEventHandler((event) => {
    const parsed = schema.safeParse(getQuery(event));
    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: "Передайте корректный sessionId" });
    }

    const participant = restoreSession(parsed.data.sessionId);
    return {
        participant,
        game: getStoreSnapshot().game,
        currentQuestion: getCurrentQuestionPublic(),
        leaderboard: getLeaderboard(),
    };
});
