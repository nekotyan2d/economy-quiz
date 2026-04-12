import { getLeaderboard, getStoreSnapshot } from "../store";

export default defineEventHandler(() => {
    const snapshot = getStoreSnapshot();

    return {
        game: snapshot.game,
        participants: snapshot.participants.map((item) => ({
            sessionId: item.sessionId,
            name: item.name,
            onlineStatus: item.onlineStatus,
        })),
        leaderboard: getLeaderboard(),
        crosswordWords: snapshot.crosswordWords,
    };
});
