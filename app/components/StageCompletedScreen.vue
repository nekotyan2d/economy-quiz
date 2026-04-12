<script setup lang="ts">
const props = defineProps<{
    stage: 1 | 2 | 3;
}>();

const nextLabel = computed(() => {
    if (props.stage === 1) return "Этап 2";
    if (props.stage === 2) return "Этап 3";
    return "Кроссворд";
});
</script>

<template>
    <section class="stage-break-card">
        <p class="eyebrow">Этап завершен</p>
        <h2>Этап {{ stage }} завершен</h2>
        <p>
            Ожидаем ведущего: следующий шаг
            <strong>{{ nextLabel }}</strong>
        </p>
    </section>
</template>

<style scoped>
.stage-break-card {
    display: grid;
    gap: 10px;
    padding: 22px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.24), rgba(255, 255, 255, 0.06));
}
.eyebrow {
    margin: 0;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.08em;
    opacity: 0.85;
}
h2 {
    margin: 0;
    font-size: clamp(22px, 4vw, 34px);
}
p {
    margin: 0;
    color: rgba(255, 255, 255, 0.9);
}
</style>
