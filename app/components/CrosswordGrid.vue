<script setup lang="ts">
import type { CrosswordWord } from "~/types/game";

const props = defineProps<{
    words: CrosswordWord[];
    solvedWordIds: string[];
}>();

const emit = defineEmits<{
    solve: [wordId: string, answer: string];
}>();

const inputs = reactive<Record<string, string>>({});

const ROWS = 19;
const COLS = 14;

for (const word of props.words) {
    if (!inputs[word.id]) inputs[word.id] = "";
}

function submit(wordId: string) {
    emit("solve", wordId, inputs[wordId] ?? "");
}

const grid = computed(() => {
    const cells: string[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ""));
    const priorities: number[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => -1));

    for (const word of props.words) {
        const value = (inputs[word.id] ?? "").trim().toUpperCase();
        const limit = Math.min(value.length, word.answer.length);
        const isSolved = props.solvedWordIds.includes(word.id);

        for (let i = 0; i < word.answer.length; i += 1) {
            const r = word.direction === "across" ? word.row - 1 : word.row - 1 + i;
            const c = word.direction === "across" ? word.col + i : word.col;

            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
            const rowCells = cells[r];
            const rowPriorities = priorities[r];
            if (!rowCells) continue;
            if (!rowPriorities) continue;

            const char = isSolved ? word.answer[i] : i < limit ? (value[i] ?? "·") : "·";
            const priority = isSolved ? 2 : char === "·" ? 0 : 1;

            if (priority >= rowPriorities[c]!) {
                rowCells[c] = char!;
                rowPriorities[c] = priority;
            }
        }
    }

    return cells;
});
</script>

<template>
    <section class="crossword-wrap">
        <div class="grid-wrap">
            <div class="grid">
                <template
                    v-for="(row, r) in grid"
                    :key="`row-${r}`">
                    <div
                        v-for="(cell, c) in row"
                        :key="`cell-${r}-${c}`"
                        class="cell"
                        :class="{ empty: !cell }">
                        {{ cell }}
                    </div>
                </template>
            </div>
        </div>

        <div class="hints">
            <article
                v-for="word in words"
                :key="word.id"
                class="hint-card"
                :class="{ solved: solvedWordIds.includes(word.id) }">
                <div class="meta">
                    <strong>{{ word.id.toUpperCase() }}</strong>
                    <span>{{ word.direction === "across" ? "Горизонталь" : "Вертикаль" }}</span>
                </div>
                <p>{{ word.hint }}</p>
                <div class="input-row">
                    <input
                        v-model="inputs[word.id]"
                        :disabled="solvedWordIds.includes(word.id)"
                        placeholder="Введите слово" />
                    <button
                        :disabled="solvedWordIds.includes(word.id)"
                        @click="submit(word.id)">
                        Проверить
                    </button>
                </div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.crossword-wrap {
    display: grid;
    gap: 16px;
}
.grid-wrap {
    overflow: auto;
    padding: 10px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.04);
}
.grid {
    display: grid;
    grid-template-columns: repeat(14, 28px);
    gap: 2px;
    width: max-content;
    margin: 0 auto;
}
.cell {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.16);
    font-size: 14px;
    font-weight: 700;
}
.cell.empty {
    background: rgba(255, 255, 255, 0.03);
}
.hints {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 12px;
}
.hint-card {
    padding: 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
}
.hint-card.solved {
    border-color: rgba(47, 191, 113, 0.7);
    background: rgba(47, 191, 113, 0.14);
}
.meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}
p {
    margin: 0 0 10px;
}
.input-row {
    display: flex;
    gap: 8px;
}
input {
    flex: 1;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.28);
    color: #fff;
}
button {
    padding: 8px 12px;
    border: none;
    border-radius: 10px;
    background: #2fbf71;
    color: #04110b;
    font-weight: 700;
}
</style>
