<script setup lang="ts">
const game = useGame();
const session = useSession();

const solvedWordIds = ref<string[]>([]);
const message = ref("");

const sessionId = session.sessionId;
const phase = game.phase;
const crosswordStartedAt = game.crosswordStartedAt;
const crosswordWords = game.crosswordWords;
const leaderboard = game.leaderboard;

const crosswordDeadlineAt = computed(() => {
    if (!crosswordStartedAt.value) return null;
    const started = new Date(crosswordStartedAt.value).getTime();
    return new Date(started + 10 * 60 * 1000).toISOString();
});

function getErrorMessage(err: unknown, fallback: string) {
    if (err && typeof err === "object" && "data" in err) {
        const data = (err as { data?: { statusMessage?: string } }).data;
        if (data?.statusMessage) return data.statusMessage;
    }

    return fallback;
}

const me = computed(() => leaderboard.value.find((row) => row.sessionId === sessionId.value));

onMounted(async () => {
    await game.init();
    if (!sessionId.value) {
        navigateTo("/");
        return;
    }
    if (phase.value !== "crossword") {
        game.goToPhaseRoute();
    }
});

watch(
    () => phase.value,
    () => {
        if (phase.value !== "crossword") game.goToPhaseRoute();
    },
);

async function solve(wordId: string, answer: string) {
    message.value = "";
    if (!sessionId.value) return;

    try {
        const result = await $fetch<{ isCorrect: boolean }>("/api/crossword-answer", {
            method: "POST",
            body: {
                sessionId: sessionId.value,
                wordId,
                answer,
            },
        });

        if (result.isCorrect && !solvedWordIds.value.includes(wordId)) {
            solvedWordIds.value.push(wordId);
            message.value = "Слово засчитано";
        } else if (!result.isCorrect) {
            message.value = "Пока неверно";
        }
    } catch (err: unknown) {
        message.value = getErrorMessage(err, "Ошибка проверки");
    }
}

useHead({
    title: "Кроссворд",
});
</script>

<template>
    <main class="crossword-page">
        <header>
            <h1>Кроссворд</h1>
            <Timer
                v-if="crosswordDeadlineAt"
                :deadline-at="crosswordDeadlineAt" />
            <p>Угадано: {{ me?.solvedWords ?? 0 }} / 15</p>
            <p v-if="message">{{ message }}</p>
        </header>

        <CrosswordGrid
            :words="crosswordWords"
            :solved-word-ids="solvedWordIds"
            @solve="solve" />
    </main>
</template>

<style scoped>
.crossword-page {
    min-height: 100svh;
    padding: 16px;
    width: min(1200px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 16px;
}
header {
    display: grid;
    gap: 8px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.06);
}
</style>
