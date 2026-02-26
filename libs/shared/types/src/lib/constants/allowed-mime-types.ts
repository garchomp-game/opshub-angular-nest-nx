export const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',      // .xlsx
    'text/plain',
    'text/csv',
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
