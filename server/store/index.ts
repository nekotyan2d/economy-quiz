import { v4 as uuidv4 } from "uuid";
import { CROSSWORD_DURATION_SECONDS, crosswordWords } from "./data/crossword";
import { questions } from "./data/questions";
import type { GamePhase, Participant, Question, ServerEvent } from "./types";

type EventHandler = (event: ServerEvent) => void;

interface InMemoryStore {
    participants: Map<string, Participant>;
    game: {
        phase: GamePhase;
        currentQuestionIndex: number;
        stageStartedAt: Date | null;
        crosswordStartedAt: Date | null;
        questionStartedAt: Date | null;
        questionDeadlineAt: Date | null;
        answeredSessionIds: Set<string>;
    };
    handlers: Set<EventHandler>;
    stageQuestionCursor: Record<1 | 2 | 3, number>;
    questionTimer: NodeJS.Timeout | null;
    advanceTimer: NodeJS.Timeout | null;
    crosswordTimer: NodeJS.Timeout | null;
}

const initialState = (): InMemoryStore => ({
    participants: new Map(),
    game: {
        phase: "lobby",
        currentQuestionIndex: -1,
        stageStartedAt: null,
        crosswordStartedAt: null,
        questionStartedAt: null,
        questionDeadlineAt: null,
        answeredSessionIds: new Set(),
    },
    handlers: new Set(),
    stageQuestionCursor: {
        1: 0,
        2: 0,
        3: 0,
    },
    questionTimer: null,
    advanceTimer: null,
    crosswordTimer: null,
});

const store = (globalThis as { __quizStore?: InMemoryStore }).__quizStore ?? initialState();
(globalThis as { __quizStore?: InMemoryStore }).__quizStore = store;

const questionsByStage = {
    1: questions.filter((q) => q.stage === 1),
    2: questions.filter((q) => q.stage === 2),
    3: questions.filter((q) => q.stage === 3),
};

function stageFromPhase(phase: GamePhase): 1 | 2 | 3 | null {
    if (phase === "quiz-stage-1") return 1;
    if (phase === "quiz-stage-2") return 2;
    if (phase === "quiz-stage-3") return 3;
    return null;
}

function emit(event: string, data: Record<string, unknown>) {
    const payload: ServerEvent = { event, data };
    for (const handler of store.handlers) {
        handler(payload);
    }
}

function getParticipant(sessionId: string): Participant {
    const participant = store.participants.get(sessionId);
    if (!participant) {
        throw createError({ statusCode: 404, statusMessage: "Участник не найден" });
    }
    return participant;
}

function getCurrentQuestion(): Question | null {
    const index = store.game.currentQuestionIndex;
    if (index < 0) return null;
    return questions[index] ?? null;
}

function setQuestionTimeout(question: Question) {
    if (store.questionTimer) clearTimeout(store.questionTimer);

    const ms = question.timeLimitSeconds * 1000;
    store.game.questionStartedAt = new Date();
    store.game.questionDeadlineAt = new Date(Date.now() + ms);
    store.questionTimer = setTimeout(() => {
        closeCurrentQuestion("timeout");
    }, ms);
}

function activeParticipantsCount() {
    let count = 0;
    for (const participant of store.participants.values()) {
        if (participant.onlineStatus === "online") count += 1;
    }
    return count;
}

function closeCurrentQuestion(reason: "all-answered" | "timeout") {
    const question = getCurrentQuestion();
    if (!question) return;

    if (store.questionTimer) {
        clearTimeout(store.questionTimer);
        store.questionTimer = null;
    }

    const answeredCount = store.game.answeredSessionIds.size;
    const totalCount = activeParticipantsCount();

    emit("question-closed", {
        questionId: question.id,
        reason,
        answeredCount,
        totalCount,
        correctIndex: question.correctIndex,
    });

    const stage = stageFromPhase(store.game.phase);
    if (!stage) return;

    store.game.questionStartedAt = null;
    store.game.questionDeadlineAt = null;

    const stageQuestions = questionsByStage[stage];
    const stageCursor = store.stageQuestionCursor[stage];
    const isLastStageQuestion = stageCursor >= stageQuestions.length - 1;

    if (isLastStageQuestion) {
        store.game.phase = `stage-break-${stage}`;
        store.game.currentQuestionIndex = -1;
        store.game.answeredSessionIds = new Set();
        emit("stage-ended", { stage });
        return;
    }

    if (store.advanceTimer) clearTimeout(store.advanceTimer);
    store.advanceTimer = setTimeout(() => {
        store.stageQuestionCursor[stage] += 1;
        openQuestionForCurrentStage();
    }, 2500);
}

function maybeAutoCloseQuestion() {
    const question = getCurrentQuestion();
    if (!question) return;

    const total = activeParticipantsCount();
    if (total === 0) return;
    if (store.game.answeredSessionIds.size >= total) {
        closeCurrentQuestion("all-answered");
    }
}

function openQuestionForCurrentStage() {
    const stage = stageFromPhase(store.game.phase);
    if (!stage) {
        throw createError({ statusCode: 400, statusMessage: "Сейчас не запущен этап викторины" });
    }

    const stageQuestions = questionsByStage[stage];
    const stageCursor = store.stageQuestionCursor[stage];
    const question = stageQuestions[stageCursor];

    if (!question) {
        throw createError({ statusCode: 400, statusMessage: "Вопросы этапа закончились" });
    }

    const globalQuestionIndex = questions.findIndex((q) => q.id === question.id);
    store.game.currentQuestionIndex = globalQuestionIndex;
    store.game.answeredSessionIds = new Set();
    setQuestionTimeout(question);

    emit(stageCursor === 0 ? "stage-started" : "next-question", {
        stage,
        questionIndex: stageCursor,
        question,
        totalStageQuestions: stageQuestions.length,
        deadlineAt: store.game.questionDeadlineAt?.toISOString(),
    });

    // Reset per-question progress so clients don't keep stale counters from previous question.
    emit("answer-progress", {
        questionId: question.id,
        answeredCount: 0,
        totalCount: activeParticipantsCount(),
    });
}

function normalizeWord(value: string) {
    return value.trim().toUpperCase();
}

function heartbeatSweep() {
    const now = Date.now();
    for (const participant of store.participants.values()) {
        const elapsed = now - participant.lastPongAt.getTime();
        const newStatus = elapsed > 20000 ? "offline" : "online";
        if (participant.onlineStatus !== newStatus) {
            participant.onlineStatus = newStatus;
            emit("participant-status", { sessionId: participant.sessionId, status: newStatus });
        }
    }

    maybeAutoCloseQuestion();
    emit("ping", { ts: Date.now() });
}

setInterval(heartbeatSweep, 10000);

export function addEventHandler(handler: EventHandler) {
    store.handlers.add(handler);
    return () => store.handlers.delete(handler);
}

export function registerParticipant(name: string) {
    const participant: Participant = {
        sessionId: uuidv4(),
        name,
        registeredAt: new Date(),
        quizScores: {
            stage1: 0,
            stage2: 0,
            stage3: 0,
        },
        onlineStatus: "online",
        lastPongAt: new Date(),
        answers: {},
        crosswordProgress: {
            solvedWords: [],
            wordTimes: {},
            totalTime: 0,
        },
    };

    store.participants.set(participant.sessionId, participant);
    emit("participant-joined", {
        sessionId: participant.sessionId,
        name: participant.name,
        totalCount: store.participants.size,
    });

    return participant;
}

export function restoreSession(sessionId: string) {
    const participant = getParticipant(sessionId);
    participant.onlineStatus = "online";
    participant.lastPongAt = new Date();
    return participant;
}

export function submitPong(sessionId: string) {
    const participant = getParticipant(sessionId);
    participant.onlineStatus = "online";
    participant.lastPongAt = new Date();
    emit("participant-status", { sessionId: participant.sessionId, status: "online" });
}

export function startStage(stage: 1 | 2 | 3) {
    store.game.phase = `quiz-stage-${stage}`;
    store.game.stageStartedAt = new Date();
    store.stageQuestionCursor[stage] = 0;
    openQuestionForCurrentStage();
}

export function nextQuestion() {
    const stage = stageFromPhase(store.game.phase);
    if (!stage) {
        throw createError({ statusCode: 400, statusMessage: "Сейчас не запущен этап викторины" });
    }

    if (store.advanceTimer) {
        clearTimeout(store.advanceTimer);
        store.advanceTimer = null;
    }

    store.stageQuestionCursor[stage] += 1;
    openQuestionForCurrentStage();
}

export function submitAnswer(sessionId: string, optionIndex: 0 | 1 | 2 | 3) {
    const participant = getParticipant(sessionId);
    const question = getCurrentQuestion();
    const phaseStage = stageFromPhase(store.game.phase);

    if (!phaseStage || !question) {
        throw createError({ statusCode: 400, statusMessage: "Сейчас нет активного вопроса" });
    }

    if (question.stage !== phaseStage) {
        throw createError({ statusCode: 400, statusMessage: "Вопрос не относится к текущему этапу" });
    }

    if (store.game.answeredSessionIds.has(sessionId)) {
        throw createError({ statusCode: 409, statusMessage: "Ответ на этот вопрос уже отправлен" });
    }

    const deadline = store.game.questionDeadlineAt?.getTime() ?? Date.now();
    const started = store.game.questionStartedAt?.getTime() ?? Date.now();
    const full = deadline - started;
    const left = Math.max(0, deadline - Date.now());

    const base = phaseStage;
    const isCorrect = question.correctIndex === optionIndex;
    const speedBonus = isCorrect ? Math.round((left / Math.max(1, full)) * base * 0.5) : 0;
    const gained = isCorrect ? base + speedBonus : 0;

    if (phaseStage === 1) participant.quizScores.stage1 += gained;
    if (phaseStage === 2) participant.quizScores.stage2 += gained;
    if (phaseStage === 3) participant.quizScores.stage3 += gained;

    participant.answers[question.id] = String(optionIndex);
    store.game.answeredSessionIds.add(sessionId);

    emit("answer-progress", {
        questionId: question.id,
        answeredCount: store.game.answeredSessionIds.size,
        totalCount: activeParticipantsCount(),
    });

    maybeAutoCloseQuestion();

    return {
        isCorrect,
        gained,
        correctIndex: question.correctIndex,
        answeredCount: store.game.answeredSessionIds.size,
        totalCount: activeParticipantsCount(),
    };
}

export function startCrossword() {
    if (store.questionTimer) {
        clearTimeout(store.questionTimer);
        store.questionTimer = null;
    }

    store.game.phase = "crossword";
    store.game.crosswordStartedAt = new Date();

    emit("crossword-started", {
        durationSeconds: CROSSWORD_DURATION_SECONDS,
        startedAt: store.game.crosswordStartedAt.toISOString(),
    });

    if (store.crosswordTimer) clearTimeout(store.crosswordTimer);
    store.crosswordTimer = setTimeout(() => {
        finishGame();
    }, CROSSWORD_DURATION_SECONDS * 1000);
}

export function submitCrosswordWord(sessionId: string, wordId: string, answer: string) {
    if (store.game.phase !== "crossword") {
        throw createError({ statusCode: 400, statusMessage: "Кроссворд еще не начался" });
    }

    const participant = getParticipant(sessionId);
    const word = crosswordWords.find((item) => item.id === wordId);
    if (!word) {
        throw createError({ statusCode: 404, statusMessage: "Слово не найдено" });
    }

    const normalized = normalizeWord(answer);
    const isCorrect = normalized === word.answer;
    if (!isCorrect) {
        return { isCorrect: false, solvedCount: participant.crosswordProgress.solvedWords.length };
    }

    if (!participant.crosswordProgress.solvedWords.includes(wordId)) {
        participant.crosswordProgress.solvedWords.push(wordId);
        const started = store.game.crosswordStartedAt?.getTime() ?? Date.now();
        const elapsed = Date.now() - started;
        participant.crosswordProgress.wordTimes[wordId] = elapsed;
        participant.crosswordProgress.totalTime = Math.max(participant.crosswordProgress.totalTime, elapsed);

        emit("crossword-progress", {
            sessionId,
            solvedCount: participant.crosswordProgress.solvedWords.length,
            totalTime: participant.crosswordProgress.totalTime,
        });
    }

    return {
        isCorrect: true,
        solvedCount: participant.crosswordProgress.solvedWords.length,
        crosswordScore: participant.crosswordProgress.solvedWords.length * 5,
    };
}

export function finishGame() {
    store.game.phase = "finished";
    emit("game-finished", {});
}

export function resetGame() {
    if (store.questionTimer) clearTimeout(store.questionTimer);
    if (store.advanceTimer) clearTimeout(store.advanceTimer);
    if (store.crosswordTimer) clearTimeout(store.crosswordTimer);

    const fresh = initialState();
    store.participants = fresh.participants;
    store.game = fresh.game;
    store.stageQuestionCursor = fresh.stageQuestionCursor;
    store.questionTimer = null;
    store.advanceTimer = null;
    store.crosswordTimer = null;

    emit("game-reset", {});
}

export function getStoreSnapshot() {
    const stage = stageFromPhase(store.game.phase);
    const currentQuestionIndex = stage ? store.stageQuestionCursor[stage] + 1 : null;
    const currentQuestionTotal = stage ? questionsByStage[stage].length : null;
    const participants = [...store.participants.values()].map((participant) => ({
        ...participant,
        registeredAt: participant.registeredAt.toISOString(),
        lastPongAt: participant.lastPongAt.toISOString(),
    }));

    return {
        game: {
            ...store.game,
            stageStartedAt: store.game.stageStartedAt?.toISOString() ?? null,
            crosswordStartedAt: store.game.crosswordStartedAt?.toISOString() ?? null,
            questionStartedAt: store.game.questionStartedAt?.toISOString() ?? null,
            questionDeadlineAt: store.game.questionDeadlineAt?.toISOString() ?? null,
            activeQuestion: getCurrentQuestion(),
            currentQuestionIndex,
            currentQuestionTotal,
        },
        participants,
        crosswordWords,
    };
}

export function getParticipants() {
    return [...store.participants.values()];
}

export function getLeaderboard() {
    const phase = store.game.phase;
    const rows = [...store.participants.values()].map((participant) => {
        const quizTotal = participant.quizScores.stage1 + participant.quizScores.stage2 + participant.quizScores.stage3;
        const solved = participant.crosswordProgress.solvedWords.length;
        const crosswordScore = solved * 5;

        return {
            sessionId: participant.sessionId,
            name: participant.name,
            stage1: participant.quizScores.stage1,
            stage2: participant.quizScores.stage2,
            stage3: participant.quizScores.stage3,
            quizTotal,
            solvedWords: solved,
            crosswordTimeMs: participant.crosswordProgress.totalTime,
            crosswordScore,
            total: quizTotal + crosswordScore,
            onlineStatus: participant.onlineStatus,
        };
    });

    const sorted = rows.sort((a, b) => {
        if (phase === "crossword") {
            if (b.solvedWords !== a.solvedWords) return b.solvedWords - a.solvedWords;
            return a.crosswordTimeMs - b.crosswordTimeMs;
        }

        return b.total - a.total;
    });

    return sorted.map((item, index) => ({ ...item, place: index + 1 }));
}

export function getCurrentQuestionPublic() {
    return getCurrentQuestion();
}
