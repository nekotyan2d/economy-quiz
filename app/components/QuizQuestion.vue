<script setup lang="ts">
import type { Question } from "~/types/game";

const props = defineProps<{
    question: Question;
    deadlineAt: string | null;
    disabled?: boolean;
    revealCorrectIndex?: number | null;
}>();

const emit = defineEmits<{
    answered: [optionIndex: number];
}>();

const selected = ref<number | null>(null);

function answer(index: number) {
    if (props.disabled || selected.value !== null) return;
    selected.value = index;
    emit("answered", index);
}

function answerClass(index: number) {
    if (props.revealCorrectIndex === null || props.revealCorrectIndex === undefined) {
        return {
            selected: selected.value === index,
        };
    }

    return {
        correct: index === props.revealCorrectIndex,
        wrong: selected.value === index && index !== props.revealCorrectIndex,
    };
}
</script>

<template>
    <article class="question-card">
        <Timer :deadline-at="deadlineAt" />
        <h2>{{ question.text }}</h2>
        <div class="answers">
            <button
                v-for="(option, index) in question.options"
                :key="option"
                class="answer-btn"
                :disabled="disabled || selected !== null"
                :class="answerClass(index)"
                @click="answer(index)">
                <strong>{{ ["A", "B", "C", "D"][index] }}</strong>
                <span>{{ option }}</span>
            </button>
        </div>
    </article>
</template>

<style scoped>
.question-card {
    display: grid;
    gap: 18px;
    padding: 20px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.06);
}
h2 {
    margin: 0;
    font-size: clamp(20px, 4vw, 30px);
}
.answers {
    display: grid;
    gap: 12px;
}
.answer-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.25);
    color: #f8f8f2;
    cursor: pointer;
}
.answer-btn.selected {
    border-color: #6aa4ff;
    background: rgba(106, 164, 255, 0.25);
}
.answer-btn.correct {
    border-color: #2fbf71;
    background: rgba(47, 191, 113, 0.22);
}
.answer-btn.wrong {
    border-color: #ff5a67;
    background: rgba(255, 90, 103, 0.22);
}
.answer-btn:disabled {
    opacity: 0.75;
    cursor: not-allowed;
}
</style>
