import type { ParticipantSnapshot, ParticipantRow, Question, GamePhase } from "~/types/game";

interface SessionPayload {
    participant: ParticipantSnapshot;
    game: {
        phase: GamePhase;
        currentQuestionIndex: number;
        currentQuestionTotal: number;
        questionDeadlineAt: string | null;
        crosswordStartedAt: string | null;
        activeQuestion: Question | null;
    };
    currentQuestion: Question | null;
    leaderboard: ParticipantRow[];
}

export function useSession() {
    const sessionId = useState<string | null>("session-id", () => null);
    const me = useState<ParticipantSnapshot | null>("me", () => null);

    function readFromStorage() {
        if (!import.meta.client) return;
        const value = localStorage.getItem("quiz-session-id");
        if (value) sessionId.value = value;
    }

    function persist() {
        if (!import.meta.client || !sessionId.value) return;
        localStorage.setItem("quiz-session-id", sessionId.value);
    }

    async function register(name: string) {
        const response = await $fetch<{ sessionId: string; name: string }>("/api/register", {
            method: "POST",
            body: { name },
        });

        sessionId.value = response.sessionId;
        persist();
        await restore();
    }

    async function restore() {
        if (!sessionId.value) return null;

        const payload = await $fetch<SessionPayload>("/api/session", {
            query: { sessionId: sessionId.value },
        });

        me.value = payload.participant;
        return payload;
    }

    async function pong() {
        if (!sessionId.value) return;
        await $fetch("/api/pong", {
            method: "POST",
            body: { sessionId: sessionId.value },
        });
    }

    function clearSession() {
        sessionId.value = null;
        me.value = null;
        if (import.meta.client) {
            localStorage.removeItem("quiz-session-id");
        }
    }

    return {
        sessionId,
        me,
        readFromStorage,
        register,
        restore,
        pong,
        clearSession,
    };
}
