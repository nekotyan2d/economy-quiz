const registerHits = new Map<string, number>();

export function assertRegisterRateLimit(event: H3Event) {
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
    const now = Date.now();
    const prev = registerHits.get(ip) ?? 0;

    if (now - prev < 1000) {
        throw createError({ statusCode: 429, statusMessage: "Слишком часто. Попробуйте через секунду" });
    }

    registerHits.set(ip, now);
}
