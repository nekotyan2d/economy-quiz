import type { CrosswordWord, GamePhase, ParticipantRow, Question } from "~/types/game";

type ParticipantBrief = { sessionId: string; name: string; onlineStatus: string };

interface SnapshotPayload {
    game?: {
        phase?: GamePhase;
        activeQuestion?: Question | null;
        questionDeadlineAt?: string | null;
        crosswordStartedAt?: string | null;
        currentQuestionIndex?: number | null;
        currentQuestionTotal?: number | null;
    };
    leaderboard?: ParticipantRow[];
    participants?: ParticipantBrief[];
}

export function useGame() {
    const phase = useState<GamePhase>("game-phase", () => "lobby");
    const currentQuestion = useState<Question | null>("game-question", () => null);
    const questionDeadlineAt = useState<string | null>("question-deadline", () => null);
    const crosswordStartedAt = useState<string | null>("crossword-started", () => null);
    const currentQuestionIndex = useState<number | null>("question-index", () => null);
    const currentQuestionTotal = useState<number | null>("question-total", () => null);
    const leaderboard = useState<ParticipantRow[]>("leaderboard", () => []);
    const participants = useState<ParticipantBrief[]>("participants", () => []);
    const crosswordWords = useState<CrosswordWord[]>("crossword-words", () => []);
    const answerProgress = useState<{ answeredCount: number; totalCount: number }>("answer-progress", () => ({
        answeredCount: 0,
        totalCount: 0,
    }));

    const session = useSession();
    const sse = useSSE();

    function applySnapshot(snapshot: SnapshotPayload) {
        if (snapshot?.game?.phase) phase.value = snapshot.game.phase;
        currentQuestion.value = snapshot?.game?.activeQuestion ?? null;
        questionDeadlineAt.value = snapshot?.game?.questionDeadlineAt ?? null;
        crosswordStartedAt.value = snapshot?.game?.crosswordStartedAt ?? null;
        currentQuestionIndex.value = snapshot?.game?.currentQuestionIndex ?? null;
        currentQuestionTotal.value = snapshot?.game?.currentQuestionTotal ?? null;
        leaderboard.value = snapshot?.leaderboard ?? leaderboard.value;
        participants.value = snapshot?.participants ?? participants.value;
    }

    async function init() {
        session.readFromStorage();

        if (session.sessionId.value) {
            try {
                const restored = await session.restore();
                if (restored) {
                    phase.value = restored.game.phase;
                    currentQuestion.value = restored.currentQuestion;
                    questionDeadlineAt.value = restored.game.questionDeadlineAt;
                    crosswordStartedAt.value = restored.game.crosswordStartedAt;
                    leaderboard.value = restored.leaderboard;
                    currentQuestionIndex.value = restored.game.currentQuestionIndex ?? null;
                    currentQuestionTotal.value = restored.game.currentQuestionTotal ?? null;
                }
            } catch {
                session.clearSession();
            }
        }

        const publicState = await $fetch<{
            game: {
                phase: GamePhase;
                questionDeadlineAt: string | null;
                crosswordStartedAt: string | null;
                activeQuestion: Question | null;
                currentQuestionIndex: number | null;
                currentQuestionTotal: number | null;
            };
            leaderboard: ParticipantRow[];
            participants: ParticipantBrief[];
            crosswordWords: CrosswordWord[];
        }>("/api/public-state");
        phase.value = publicState.game.phase;
        leaderboard.value = publicState.leaderboard;
        participants.value = publicState.participants;
        questionDeadlineAt.value = publicState.game.questionDeadlineAt;
        crosswordStartedAt.value = publicState.game.crosswordStartedAt;
        currentQuestion.value = publicState.game.activeQuestion;
        currentQuestionIndex.value = publicState.game.currentQuestionIndex;
        currentQuestionTotal.value = publicState.game.currentQuestionTotal;
        crosswordWords.value = publicState.crosswordWords;

        sse.connect({
            snapshot: (data) => applySnapshot(data as SnapshotPayload),
            "participant-joined": (data) => {
                const payload = data as { sessionId: string; name: string };
                participants.value = [
                    ...participants.value,
                    { sessionId: payload.sessionId, name: payload.name, onlineStatus: "online" },
                ];
            },
            "stage-started": (data) => {
                const payload = data as {
                    stage: 1 | 2 | 3;
                    question: Question;
                    deadlineAt: string | null;
                    questionIndex: number;
                    totalStageQuestions: number;
                };
                phase.value = `quiz-stage-${payload.stage}`;
                currentQuestion.value = payload.question;
                questionDeadlineAt.value = payload.deadlineAt;
                currentQuestionIndex.value = payload.questionIndex + 1;
                currentQuestionTotal.value = payload.totalStageQuestions;
                answerProgress.value = {
                    answeredCount: 0,
                    totalCount: participants.value.filter((participant) => participant.onlineStatus === "online")
                        .length,
                };
            },
            "next-question": (data) => {
                const payload = data as {
                    question: Question;
                    deadlineAt: string | null;
                    questionIndex?: number;
                    totalStageQuestions?: number;
                };
                currentQuestion.value = payload.question;
                questionDeadlineAt.value = payload.deadlineAt;
                if (typeof payload.questionIndex === "number") {
                    currentQuestionIndex.value = payload.questionIndex + 1;
                }
                if (typeof payload.totalStageQuestions === "number") {
                    currentQuestionTotal.value = payload.totalStageQuestions;
                }
                answerProgress.value = {
                    answeredCount: 0,
                    totalCount: participants.value.filter((participant) => participant.onlineStatus === "online")
                        .length,
                };
            },
            "question-closed": () => {},
            "stage-ended": (data) => {
                const payload = data as { stage: 1 | 2 | 3 };
                phase.value = `stage-break-${payload.stage}`;
                currentQuestion.value = null;
                questionDeadlineAt.value = null;
                currentQuestionIndex.value = null;
                currentQuestionTotal.value = null;
                answerProgress.value = {
                    answeredCount: 0,
                    totalCount: 0,
                };
            },
            "crossword-started": (data) => {
                const payload = data as { startedAt: string };
                phase.value = "crossword";
                crosswordStartedAt.value = payload.startedAt;
            },
            "scores-updated": (data) => {
                const payload = data as { leaderboard: ParticipantRow[] };
                leaderboard.value = payload.leaderboard;
            },
            "answer-progress": (data) => {
                const payload = data as { answeredCount: number; totalCount: number };
                answerProgress.value = {
                    answeredCount: payload.answeredCount,
                    totalCount: payload.totalCount,
                };
            },
            "participant-status": (data) => {
                const payload = data as { sessionId: string; status: string };
                participants.value = participants.value.map((participant) =>
                    participant.sessionId === payload.sessionId
                        ? { ...participant, onlineStatus: payload.status }
                        : participant,
                );
            },
            "participant-kicked": (data) => {
                const payload = data as { sessionId: string };
                participants.value = participants.value.filter(
                    (participant) => participant.sessionId !== payload.sessionId,
                );

                if (session.sessionId.value === payload.sessionId) {
                    session.clearSession();
                }
            },
            "game-finished": () => {
                phase.value = "finished";
            },
            ping: async () => {
                await session.pong();
            },
        });
    }

    function goToPhaseRoute() {
        const router = useRouter();

        if (phase.value === "lobby") router.push("/");
        if (phase.value.startsWith("quiz-stage")) router.push("/quiz");
        if (phase.value.startsWith("stage-break")) router.push("/quiz");
        if (phase.value === "crossword") router.push("/crossword");
        if (phase.value === "finished") router.push("/stats");
    }

    return {
        phase,
        currentQuestion,
        questionDeadlineAt,
        crosswordStartedAt,
        currentQuestionIndex,
        currentQuestionTotal,
        leaderboard,
        participants,
        answerProgress,
        crosswordWords,
        init,
        applySnapshot,
        goToPhaseRoute,
    };
}
