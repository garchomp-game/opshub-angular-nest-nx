export function getNotificationLink(
    resourceType: string | null,
    resourceId: string | null,
): string | null {
    if (!resourceType || !resourceId) return null;
    const routes: Record<string, string> = {
        workflow: `/workflows/${resourceId}`,
        project: `/projects/${resourceId}`,
        task: `/projects`,
        expense: `/expenses`,
    };
    return routes[resourceType] ?? null;
}
