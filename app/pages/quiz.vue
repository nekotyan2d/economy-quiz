<script setup lang="ts">
const game = useGame();
const session = useSession();

const answered = ref(false);
const answerResult = ref<{ isCorrect: boolean; gained: number; correctIndex: number } | null>(null);
const answerError = ref("");

const sessionId = session.sessionId;
const phase = game.phase;
const currentQuestion = game.currentQuestion;
const questionDeadlineAt = game.questionDeadlineAt;
const currentQuestionIndex = game.currentQuestionIndex;
const currentQuestionTotal = game.currentQuestionTotal;
const answerProgress = game.answerProgress;
const isStageBreak = computed(() => phase.value.startsWith("stage-break-"));
const completedStage = computed<1 | 2 | 3 | null>(() => {
    if (!isStageBreak.value) return null;

    const match = phase.value.match(/stage-break-(\d)/);
    if (!match) return null;
    const parsed = Number(match[1]);
    if (parsed === 1 || parsed === 2 || parsed === 3) return parsed;
    return null;
});

function getErrorMessage(err: unknown, fallback: string) {
    if (err && typeof err === "object" && "data" in err) {
        const data = (err as { data?: { statusMessage?: string } }).data;
        if (data?.statusMessage) return data.statusMessage;
    }

    return fallback;
}

onMounted(async () => {
    await game.init();
    if (!sessionId.value) {
        navigateTo("/");
        return;
    }
    if (!phase.value.startsWith("quiz-stage") && !phase.value.startsWith("stage-break")) {
        game.goToPhaseRoute();
    }
});

watch(
    () => currentQuestion.value?.id,
    () => {
        answered.value = false;
        answerResult.value = null;
        answerError.value = "";
    },
);

watch(
    () => phase.value,
    () => {
        if (!phase.value.startsWith("quiz-stage") && !phase.value.startsWith("stage-break")) {
            game.goToPhaseRoute();
        }
    },
);

async function submit(optionIndex: number) {
    if (!sessionId.value || !currentQuestion.value) return;

    answerError.value = "";
    try {
        const result = await $fetch<{ isCorrect: boolean; gained: number; correctIndex: number }>("/api/answer", {
            method: "POST",
            body: {
                sessionId: sessionId.value,
                optionIndex,
            },
        });
        answered.value = true;
        answerResult.value = result;
    } catch (err: unknown) {
        answerError.value = getErrorMessage(err, "Не удалось отправить ответ");
    }
}
useHead({
    title: "Викторина",
});
</script>

<template>
    <main class="quiz-page">
        <header>
            <h1>Викторина</h1>
            <p>Фаза: {{ phase }}</p>
            <p v-if="currentQuestionIndex && currentQuestionTotal">
                Вопрос {{ currentQuestionIndex }} из {{ currentQuestionTotal }}
            </p>
        </header>

        <QuizQuestion
            v-if="currentQuestion"
            :key="currentQuestion?.id"
            :question="currentQuestion"
            :deadline-at="questionDeadlineAt"
            :disabled="answered"
            :reveal-correct-index="answered && answerResult ? answerResult.correctIndex : null"
            @answered="submit" />

        <StageCompletedScreen
            v-else-if="isStageBreak && completedStage"
            :stage="completedStage" />

        <section class="status">
            <p v-if="isStageBreak">Этап завершен. Ожидаем запуск следующего этапа.</p>
            <p v-else-if="answered && answerResult">
                {{ answerResult.isCorrect ? "Верно" : "Неверно" }}. Очков: {{ answerResult.gained }}
            </p>
            <p v-else>Ждём ответа. Ответили: {{ answerProgress.answeredCount }} из {{ answerProgress.totalCount }}</p>
            <p
                v-if="answerError"
                class="error">
                {{ answerError }}
            </p>
        </section>
    </main>
</template>

<style scoped>
.quiz-page {
    min-height: 100svh;
    display: grid;
    gap: 16px;
    padding: 16px;
    width: min(900px, 100%);
    margin: 0 auto;
}
header h1 {
    margin: 0;
}
.status {
    padding: 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.06);
}
.error {
    color: #ffd166;
}
</style>
