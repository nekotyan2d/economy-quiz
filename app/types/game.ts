export type GamePhase =
    | "lobby"
    | "quiz-stage-1"
    | "quiz-stage-2"
    | "quiz-stage-3"
    | "stage-break-1"
    | "stage-break-2"
    | "stage-break-3"
    | "crossword"
    | "finished";

export interface Question {
    id: string;
    stage: 1 | 2 | 3;
    text: string;
    options: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    timeLimitSeconds: number;
}

export interface ParticipantRow {
    sessionId: string;
    name: string;
    stage1: number;
    stage2: number;
    stage3: number;
    quizTotal: number;
    solvedWords: number;
    crosswordTimeMs: number;
    crosswordScore: number;
    total: number;
    onlineStatus: "online" | "offline";
    place: number;
}

export interface ParticipantSnapshot {
    sessionId: string;
    name: string;
    onlineStatus: "online" | "offline";
    quizScores: {
        stage1: number;
        stage2: number;
        stage3: number;
    };
    crosswordProgress: {
        solvedWords: string[];
        wordTimes: Record<string, number>;
        totalTime: number;
    };
}

export interface CrosswordWord {
    id: string;
    answer: string;
    hint: string;
    row: number;
    col: number;
    direction: "across" | "down";
}
