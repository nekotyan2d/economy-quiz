<script setup lang="ts">
defineProps<{
    participants: Array<{ sessionId: string; name: string; onlineStatus: string }>;
}>();
</script>

<template>
    <section class="lobby">
        <h2>Ждем начала</h2>
        <p>Ведущий скоро запустит викторину</p>
        <div class="count">Участников: {{ participants.length }}</div>
        <ul>
            <li
                v-for="person in participants"
                :key="person.sessionId">
                <span>{{ person.name }}</span>
                <span :class="person.onlineStatus">{{ person.onlineStatus }}</span>
            </li>
        </ul>
    </section>
</template>

<style scoped>
.lobby {
    display: grid;
    gap: 12px;
    padding: 24px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.06);
}
.count {
    font-size: 18px;
    font-weight: 700;
}
ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
}
li {
    display: flex;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
}
.online {
    color: #2fbf71;
}
.offline {
    color: #f5b700;
}
</style>
