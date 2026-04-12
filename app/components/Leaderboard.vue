<script setup lang="ts">
import type { ParticipantRow } from "~/types/game";

defineOptions({ name: "StatsLeaderboard" });

defineProps<{
    rows: ParticipantRow[];
    mode: "quiz" | "crossword" | "final";
}>();

function formatMs(ms: number) {
    if (!ms) return "-";
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60)
        .toString()
        .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}
</script>

<template>
    <table class="leaderboard">
        <thead>
            <tr v-if="mode === 'quiz'">
                <th>Место</th>
                <th>Имя</th>
                <th>Этап 1</th>
                <th>Этап 2</th>
                <th>Этап 3</th>
                <th>Итого</th>
            </tr>
            <tr v-else-if="mode === 'crossword'">
                <th>Место</th>
                <th>Имя</th>
                <th>Слова</th>
                <th>Время</th>
                <th>Очки</th>
            </tr>
            <tr v-else>
                <th>Место</th>
                <th>Имя</th>
                <th>Викторина</th>
                <th>Слова</th>
                <th>Кроссворд</th>
                <th>Итого</th>
            </tr>
        </thead>
        <tbody>
            <tr
                v-for="row in rows"
                :key="row.sessionId"
                :class="`p-${row.place}`">
                <td>{{ row.place }}</td>
                <td>{{ row.name }}</td>
                <template v-if="mode === 'quiz'">
                    <td>{{ row.stage1 }}</td>
                    <td>{{ row.stage2 }}</td>
                    <td>{{ row.stage3 }}</td>
                    <td>{{ row.total }}</td>
                </template>
                <template v-else-if="mode === 'crossword'">
                    <td>{{ row.solvedWords }} / 15</td>
                    <td>{{ formatMs(row.crosswordTimeMs) }}</td>
                    <td>{{ row.crosswordScore }}</td>
                </template>
                <template v-else>
                    <td>{{ row.quizTotal }}</td>
                    <td>{{ row.solvedWords }}</td>
                    <td>{{ row.crosswordScore }}</td>
                    <td>{{ row.total }}</td>
                </template>
            </tr>
        </tbody>
    </table>
</template>

<style scoped>
.leaderboard {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 8px;
}
th,
td {
    text-align: left;
    padding: 12px 14px;
}
tbody tr {
    background: rgba(255, 255, 255, 0.06);
    transition: transform 0.35s ease;
}
tbody tr.p-1 {
    background: rgba(241, 196, 15, 0.28);
}
tbody tr.p-2 {
    background: rgba(189, 195, 199, 0.24);
}
tbody tr.p-3 {
    background: rgba(205, 127, 50, 0.25);
}
</style>
