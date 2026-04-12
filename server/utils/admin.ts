export function assertAdmin(event: H3Event) {
    const token = getHeader(event, "x-admin-token");
    const config = useRuntimeConfig(event);
    const expected = config.adminPassword as string;

    if (!token || token !== expected) {
        throw createError({ statusCode: 401, statusMessage: "Неверный admin токен" });
    }
}
