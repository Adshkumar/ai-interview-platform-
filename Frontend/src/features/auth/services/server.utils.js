/**
 * Pings the backend to wake it up from Render's free-tier hibernation.
 * Returns true if the server is awake, false if it's still starting up.
 */
export async function wakeUpServer(maxWaitMs = 30000) {
    const baseUrl = import.meta.env.VITE_API_URL;
    const interval = 3000;
    const maxAttempts = Math.ceil(maxWaitMs / interval);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const res = await fetch(`${baseUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            if (res.ok || res.status === 404) {
                // 404 is fine — it means the server IS awake, just no /health route
                return true;
            }
        } catch {
            // Server still sleeping, wait and retry
        }
        if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, interval));
        }
    }
    return false;
}
