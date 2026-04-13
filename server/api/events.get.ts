import { addEventHandler, getLeaderboard, getStoreSnapshot } from "../store";

export default defineEventHandler((event) => {
    setHeader(event, "Content-Type", "text/event-stream");
    setHeader(event, "Cache-Control", "no-cache");
    setHeader(event, "Connection", "keep-alive");

    const stream = createEventStream(event);

    const send = async (name: string, data: Record<string, unknown>) => {
        await stream.push({
            event: name,
            data: JSON.stringify(data),
        });
    };

    const snapshot = getStoreSnapshot();
    send("snapshot", {
        game: snapshot.game,
        leaderboard: getLeaderboard(),
        participants: snapshot.participants,
    });

    const unsubscribe = addEventHandler((payload) => {
        send(payload.event, payload.data);

        if (
            [
                "answer-progress",
                "question-closed",
                "crossword-progress",
                "stage-started",
                "next-question",
                "stage-ended",
                "game-finished",
                "participant-status",
                "participant-kicked",
            ].includes(payload.event)
        ) {
            send("scores-updated", { leaderboard: getLeaderboard() });
        }
    });

    event.node.req.on("close", () => {
        unsubscribe();
        stream.close();
    });

    return stream.send();
});
