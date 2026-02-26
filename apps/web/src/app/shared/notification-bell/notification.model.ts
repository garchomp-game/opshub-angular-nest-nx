export interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    resourceType: string | null;
    resourceId: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationListResponse {
    data: Notification[];
    total: number;
}

export interface UnreadCountResponse {
    count: number;
}
