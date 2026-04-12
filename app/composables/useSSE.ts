type EventHandler = (data: unknown) => void;

export function useSSE() {
    const source = useState<EventSource | null>("sse-source", () => null);

    function connect(handlers: Record<string, EventHandler>) {
        if (!import.meta.client) return;
        if (source.value) return;

        const eventSource = new EventSource("/api/events");
        source.value = eventSource;

        for (const [eventName, callback] of Object.entries(handlers)) {
            eventSource.addEventListener(eventName, (event) => {
                const message = event as MessageEvent<string>;
                callback(JSON.parse(message.data) as unknown);
            });
        }

        eventSource.onerror = () => {
            eventSource.close();
            source.value = null;
            setTimeout(() => connect(handlers), 1500);
        };
    }

    function disconnect() {
        source.value?.close();
        source.value = null;
    }

    return { connect, disconnect };
}
