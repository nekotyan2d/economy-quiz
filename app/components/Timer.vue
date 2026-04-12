<script setup lang="ts">
defineOptions({ name: "QuizTimer" });

const props = defineProps<{
    deadlineAt?: string | null;
    durationSeconds?: number;
}>();

const leftMs = ref(0);
const totalMs = ref(1000);

function update() {
    if (props.deadlineAt) {
        const nextLeft = Math.max(0, new Date(props.deadlineAt).getTime() - Date.now());
        leftMs.value = nextLeft;

        if (nextLeft > totalMs.value) {
            totalMs.value = nextLeft;
        }
        return;
    }

    if (props.durationSeconds) {
        const durationMs = props.durationSeconds * 1000;
        totalMs.value = Math.max(1, durationMs);
        leftMs.value = Math.max(0, durationMs - (Date.now() % durationMs));
        return;
    }

    leftMs.value = 0;
    totalMs.value = 1000;
}

watch(
    () => props.deadlineAt,
    () => {
        totalMs.value = 1000;
        update();
    },
);

watch(
    () => props.durationSeconds,
    () => {
        totalMs.value = 1000;
        update();
    },
);

const progress = computed(() => Math.max(0, Math.min(100, (leftMs.value / Math.max(1, totalMs.value)) * 100)));
const tone = computed(() => {
    if (progress.value > 66) return "safe";
    if (progress.value > 33) return "warn";
    return "danger";
});
const text = computed(() => {
    const seconds = Math.ceil(leftMs.value / 1000);
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
    const s = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");
    return `${m}:${s}`;
});

let interval: NodeJS.Timeout | null = null;
onMounted(() => {
    update();
    interval = setInterval(update, 250);
});
onBeforeUnmount(() => {
    if (interval) clearInterval(interval);
});
</script>

<template>
    <div class="timer-wrap">
        <div class="timer-text">{{ text }}</div>
        <div class="timer-line">
            <div
                class="timer-fill"
                :class="`timer-fill--${tone}`"
                :style="{ width: `${progress}%` }" />
        </div>
    </div>
</template>

<style scoped>
.timer-wrap {
    display: grid;
    gap: 8px;
}
.timer-text {
    font-size: 20px;
    font-weight: 700;
}
.timer-line {
    height: 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
}
.timer-fill {
    height: 100%;
    background: #2fbf71;
    transition: width 0.2s linear;
}
.timer-fill--safe {
    background: #2fbf71;
}
.timer-fill--warn {
    background: #f5b700;
}
.timer-fill--danger {
    background: #d90429;
}
</style>
