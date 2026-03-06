import { parentPort, workerData } from 'node:worker_threads';
import * as archiver from 'archiver';
import { Writable } from 'node:stream';

/**
 * ZIP 生成ワーカースレッド
 *
 * ファイル名と内容のペア配列を受け取り、ZIP バッファを返す。
 * メインスレッドのブロッキングを回避するためにワーカースレッドで実行する。
 */
async function generateZip() {
    try {
        const { files } = workerData as {
            files: Array<{ name: string; content: string }>;
        };

        const chunks: Buffer[] = [];
        const archive = archiver.create('zip', { zlib: { level: 6 } });

        const writable = new Writable({
            write(chunk, _encoding, callback) {
                chunks.push(Buffer.from(chunk));
                callback();
            },
        });

        archive.pipe(writable);

        for (const file of files) {
            archive.append(file.content, { name: file.name });
        }

        await archive.finalize();

        // writable の finish イベントを待つ
        await new Promise<void>((resolve) => writable.on('finish', resolve));

        const buffer = Buffer.concat(chunks);

        parentPort?.postMessage({
            success: true,
            data: buffer,
        });
    } catch (error: any) {
        parentPort?.postMessage({
            success: false,
            error: error.message,
        });
    }
}

generateZip();
