<script setup lang="ts">
const name = ref("");
const error = ref("");
const pending = ref(false);

const session = useSession();
const game = useGame();
const sessionId = session.sessionId;
const phase = game.phase;
const participants = game.participants;

function getErrorMessage(err: unknown, fallback: string) {
    if (err && typeof err === "object" && "data" in err) {
        const data = (err as { data?: { statusMessage?: string } }).data;
        if (data?.statusMessage) return data.statusMessage;
    }

    return fallback;
}

onMounted(async () => {
    await game.init();
    if (sessionId.value && phase.value !== "lobby") {
        game.goToPhaseRoute();
    }
});

watch(
    () => phase.value,
    () => {
        if (phase.value !== "lobby") {
            game.goToPhaseRoute();
        }
    },
);

async function register() {
    error.value = "";
    if (name.value.trim().length < 2 || name.value.trim().length > 30) {
        error.value = "Имя должно быть от 2 до 30 символов";
        return;
    }

    pending.value = true;
    try {
        await session.register(name.value.trim());
    } catch (err: unknown) {
        error.value = getErrorMessage(err, "Не удалось зарегистрироваться");
    } finally {
        pending.value = false;
    }
}

useHead({
    title: "Economy Quiz",
});
</script>

<template>
    <main class="page">
        <section
            v-if="!sessionId"
            class="card">
            <h1>Economy Quiz</h1>
            <p>Введите имя, чтобы присоединиться к игре</p>
            <input
                v-model="name"
                maxlength="30"
                placeholder="Ваше имя" />
            <button
                :disabled="pending"
                @click="register">
                Войти
            </button>
            <p
                v-if="error"
                class="error">
                {{ error }}
            </p>
        </section>

        <LobbyScreen
            v-else
            :participants="participants" />
    </main>
</template>

<style scoped>
.page {
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: 16px;
}
.card {
    width: min(560px, 100%);
    display: grid;
    gap: 12px;
    padding: 24px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.06);
}
h1 {
    margin: 0;
    font-size: clamp(28px, 6vw, 44px);
}
input,
button {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
}
input {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.25);
    color: #fff;
}
button {
    border: none;
    background: #2fbf71;
    font-weight: 800;
    color: #04110b;
}
.error {
    color: #ffd166;
}
</style>
