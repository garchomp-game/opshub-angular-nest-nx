export abstract class StorageService {
    abstract upload(path: string, file: Buffer, contentType: string): Promise<void>;
    abstract download(path: string): Promise<Buffer>;
    abstract getSignedUrl(path: string, expiresIn: number): Promise<string>;
    abstract delete(path: string): Promise<void>;
}
