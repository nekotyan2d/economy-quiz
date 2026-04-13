<script setup lang="ts">
const token = ref("");
const adminMessage = ref("");
const game = useGame();
const phase = game.phase;
const participants = game.participants;

function getErrorMessage(err: unknown, fallback: string) {
    if (err && typeof err === "object" && "data" in err) {
        const data = (err as { data?: { statusMessage?: string } }).data;
        if (data?.statusMessage) return data.statusMessage;
    }

    return fallback;
}

function loadToken() {
    if (!import.meta.client) return;
    token.value = localStorage.getItem("admin-token") ?? "";
}

function saveToken() {
    if (!import.meta.client) return;
    localStorage.setItem("admin-token", token.value);
}

async function callAdmin(path: string, body?: Record<string, unknown>) {
    adminMessage.value = "";
    try {
        await $fetch(path, {
            method: "POST",
            headers: {
                "X-Admin-Token": token.value,
            },
            body,
        });
        adminMessage.value = "Команда выполнена";
    } catch (err: unknown) {
        adminMessage.value = getErrorMessage(err, "Ошибка admin запроса");
    }
}

async function kickParticipant(sessionId: string) {
    await callAdmin("/api/admin/kick", { sessionId });
}

onMounted(async () => {
    loadToken();
    await game.init();
});

useHead({
    title: "Ведущий",
});
</script>

<template>
    <main class="admin-page">
        <h1>Панель ведущего</h1>

        <section class="card">
            <label>Admin token</label>
            <input
                v-model="token"
                placeholder="Введите пароль ведущего"
                @blur="saveToken" />
            <p>Текущая фаза: {{ phase }}</p>
            <p v-if="adminMessage">{{ adminMessage }}</p>
        </section>

        <section class="grid">
            <button @click="callAdmin('/api/admin/start-stage', { stage: 1 })">Старт этапа 1</button>
            <button @click="callAdmin('/api/admin/start-stage', { stage: 2 })">Старт этапа 2</button>
            <button @click="callAdmin('/api/admin/start-stage', { stage: 3 })">Старт этапа 3</button>
            <button @click="callAdmin('/api/admin/next-question')">Следующий вопрос</button>
            <button @click="callAdmin('/api/admin/start-crossword')">Запустить кроссворд</button>
            <button @click="callAdmin('/api/admin/finish')">Завершить игру</button>
            <button
                class="danger"
                @click="callAdmin('/api/admin/reset')">
                Сбросить всё
            </button>
        </section>

        <section class="card">
            <h2>Участники</h2>
            <ul>
                <li
                    v-for="person in participants"
                    :key="person.sessionId">
                    <span class="participant-name">{{ person.name }}</span>
                    <span class="participant-status">{{ person.onlineStatus }}</span>
                    <button
                        class="danger participant-kick"
                        @click="kickParticipant(person.sessionId)">
                        Кикнуть
                    </button>
                </li>
            </ul>
        </section>
    </main>
</template>

<style scoped>
.admin-page {
    min-height: 100svh;
    width: min(1000px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 14px;
    padding: 16px;
}
.card {
    padding: 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.07);
}
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
}
button {
    padding: 10px 12px;
    border-radius: 10px;
    border: none;
    background: #2b9eb3;
    color: #fff;
    font-weight: 700;
}
button.danger {
    background: #d90429;
}
input {
    width: 100%;
    margin-top: 6px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.22);
    color: #fff;
}
ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 8px;
}
li {
    display: flex;
    align-items: center;
    gap: 10px;
}
.participant-name {
    margin-right: auto;
}
.participant-status {
    opacity: 0.8;
}
.participant-kick {
    width: auto;
}
</style>
