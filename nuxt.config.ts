// https://nuxt.com/docs/api/configuration/nuxt-config
import "dotenv/config.js";
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    modules: ["@nuxt/ui", "@nuxt/eslint"],
    css: ["~/assets/css/main.css"],
    runtimeConfig: {
        adminPassword: process.env.ADMIN_PASSWORD || "change_me",
        public: {},
    },
});
