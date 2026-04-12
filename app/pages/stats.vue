<script setup lang="ts">
const game = useGame();
const phase = game.phase;
const leaderboard = game.leaderboard;

onMounted(async () => {
    await game.init();
});

const mode = computed(() => {
    if (phase.value === "crossword") return "crossword" as const;
    if (phase.value === "finished") return "final" as const;
    return "quiz" as const;
});

const phaseLabel = computed(() => {
    const map: Record<string, string> = {
        lobby: "Лобби",
        "quiz-stage-1": "Этап 1",
        "quiz-stage-2": "Этап 2",
        "quiz-stage-3": "Этап 3",
        crossword: "Кроссворд",
        finished: "Завершено",
    };

    return map[phase.value] ?? phase.value;
});

useHead({
    title: "Результаты",
});
</script>

<template>
    <main class="stats-page">
        <header>
            <h1>Статистика</h1>
            <p>Статус: {{ phaseLabel }}</p>
        </header>

        <Leaderboard
            :rows="leaderboard"
            :mode="mode" />
    </main>
</template>

<style scoped>
.stats-page {
    min-height: 100svh;
    padding: 18px;
    color: #f9f9f9;
    background: radial-gradient(circle at 20% 0%, #203a43 0%, #090909 55%, #000 100%);
}
header {
    margin-bottom: 16px;
}
h1 {
    font-size: clamp(30px, 5vw, 58px);
    margin: 0;
}
p {
    font-size: clamp(18px, 2.5vw, 30px);
}
</style>
