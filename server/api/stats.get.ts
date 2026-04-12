import { getLeaderboard, getStoreSnapshot } from "../store";

export default defineEventHandler(() => {
    const snapshot = getStoreSnapshot();
    return {
        phase: snapshot.game.phase,
        crosswordStartedAt: snapshot.game.crosswordStartedAt,
        questionDeadlineAt: snapshot.game.questionDeadlineAt,
        leaderboard: getLeaderboard(),
    };
});
