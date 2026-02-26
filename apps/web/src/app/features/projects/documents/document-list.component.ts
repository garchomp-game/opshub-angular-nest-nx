import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentService } from './document.service';
import { formatFileSize } from '@shared/util';

@Component({
    selector: 'app-document-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatSnackBarModule,
        MatDialogModule,
        MatCardModule,
        MatTooltipModule,
    ],
    template: `
        <div class="document-list-container">
            <!-- ヘッダー -->
            <div class="header">
                <h2>ドキュメント管理</h2>
            </div>

            <!-- アップロードセクション -->
            <mat-card class="upload-section" data-testid="upload-section">
                <div
                    class="drop-zone"
                    [class.drag-over]="isDragOver()"
                    (dragover)="onDragOver($event)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event)"
                    data-testid="drop-zone"
                >
                    <mat-icon class="upload-icon">cloud_upload</mat-icon>
                    <p>ファイルをドラッグ＆ドロップ、または</p>
                    <button mat-raised-button color="primary" (click)="fileInput.click()" data-testid="upload-button">
                        <mat-icon>upload_file</mat-icon>
                        ファイルを選択
                    </button>
                    <input
                        #fileInput
                        type="file"
                        hidden
                        (change)="onFileSelected($event)"
                        data-testid="file-input"
                    />
                    <p class="hint">最大10MB — PDF, 画像, Office, テキストファイル</p>
                </div>
            </mat-card>

            <!-- ローディング -->
            @if (documentService.loading()) {
                <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            }

            <!-- アップロード中 -->
            @if (uploading()) {
                <mat-progress-bar mode="indeterminate" color="accent"></mat-progress-bar>
            }

            <!-- ドキュメント一覧テーブル -->
            <mat-card>
                <table mat-table [dataSource]="documentService.documents()" class="document-table" data-testid="document-table">
                    <!-- ファイル名 -->
                    <ng-container matColumnDef="name">
                        <th mat-header-cell *matHeaderCellDef>ファイル名</th>
                        <td mat-cell *matCellDef="let doc">
                            <div class="file-name-cell">
                                <mat-icon>{{ getMimeIcon(doc.mimeType) }}</mat-icon>
                                <span>{{ doc.name }}</span>
                            </div>
                        </td>
                    </ng-container>

                    <!-- サイズ -->
                    <ng-container matColumnDef="fileSize">
                        <th mat-header-cell *matHeaderCellDef>サイズ</th>
                        <td mat-cell *matCellDef="let doc">{{ formatSize(doc.fileSize) }}</td>
                    </ng-container>

                    <!-- 種別 -->
                    <ng-container matColumnDef="mimeType">
                        <th mat-header-cell *matHeaderCellDef>種別</th>
                        <td mat-cell *matCellDef="let doc">
                            <mat-chip [color]="getMimeColor(doc.mimeType)" highlighted>
                                {{ getMimeLabel(doc.mimeType) }}
                            </mat-chip>
                        </td>
                    </ng-container>

                    <!-- アップロード者 -->
                    <ng-container matColumnDef="uploadedBy">
                        <th mat-header-cell *matHeaderCellDef>アップロード者</th>
                        <td mat-cell *matCellDef="let doc">
                            {{ doc.uploader?.profile?.displayName || '—' }}
                        </td>
                    </ng-container>

                    <!-- 日時 -->
                    <ng-container matColumnDef="createdAt">
                        <th mat-header-cell *matHeaderCellDef>日時</th>
                        <td mat-cell *matCellDef="let doc">{{ doc.createdAt | date:'yyyy/MM/dd HH:mm' }}</td>
                    </ng-container>

                    <!-- 操作 -->
                    <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef>操作</th>
                        <td mat-cell *matCellDef="let doc">
                            <button
                                mat-icon-button
                                matTooltip="ダウンロード"
                                (click)="onDownload(doc)"
                                data-testid="download-button"
                            >
                                <mat-icon>download</mat-icon>
                            </button>
                            <button
                                mat-icon-button
                                color="warn"
                                matTooltip="削除"
                                (click)="onDelete(doc)"
                                data-testid="delete-button"
                            >
                                <mat-icon>delete</mat-icon>
                            </button>
                        </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

                    <!-- 空状態 -->
                    <tr class="no-data" *matNoDataRow>
                        <td [attr.colspan]="displayedColumns.length" class="empty-state">
                            @if (!documentService.loading()) {
                                <mat-icon>folder_open</mat-icon>
                                <p>ドキュメントはまだありません</p>
                            }
                        </td>
                    </tr>
                </table>

                <!-- ページネーション -->
                @if (documentService.meta(); as meta) {
                    <mat-paginator
                        [length]="meta.total"
                        [pageSize]="meta.limit"
                        [pageSizeOptions]="[10, 20, 50]"
                        (page)="onPageChange($event)"
                        data-testid="paginator"
                    ></mat-paginator>
                }
            </mat-card>
        </div>
    `,
    styles: [`
        .document-list-container {
            padding: 24px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .upload-section {
            margin-bottom: 24px;
        }
        .drop-zone {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 32px;
            border: 2px dashed #ccc;
            border-radius: 8px;
            text-align: center;
            transition: background-color 0.2s, border-color 0.2s;
            cursor: pointer;
        }
        .drop-zone.drag-over {
            background-color: rgba(63, 81, 181, 0.08);
            border-color: #3f51b5;
        }
        .upload-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: #9e9e9e;
            margin-bottom: 8px;
        }
        .hint {
            margin-top: 8px;
            font-size: 12px;
            color: #9e9e9e;
        }
        .document-table {
            width: 100%;
        }
        .file-name-cell {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .empty-state {
            text-align: center;
            padding: 48px 16px;
            color: #9e9e9e;
        }
        .empty-state mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
        }
    `],
})
export class DocumentListComponent implements OnInit {
    documentService = inject(DocumentService);
    private route = inject(ActivatedRoute);
    private snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog);

    projectId = '';
    displayedColumns = ['name', 'fileSize', 'mimeType', 'uploadedBy', 'createdAt', 'actions'];
    isDragOver = signal(false);
    uploading = signal(false);

    ngOnInit(): void {
        this.projectId = this.route.snapshot.paramMap.get('id') || '';
        this.documentService.loadDocuments(this.projectId);
    }

    // ─── ドラッグ＆ドロップ ───

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.uploadFile(files[0]);
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.uploadFile(input.files[0]);
            input.value = ''; // リセット
        }
    }

    // ─── アップロード ───

    private uploadFile(file: File): void {
        this.uploading.set(true);
        this.documentService.uploadDocument(this.projectId, file).subscribe({
            next: () => {
                this.snackBar.open('ファイルをアップロードしました', '閉じる', {
                    duration: 3000,
                });
                this.documentService.loadDocuments(this.projectId);
                this.uploading.set(false);
            },
            error: (err) => {
                const message =
                    err.error?.error?.message || 'アップロードに失敗しました';
                this.snackBar.open(message, '閉じる', { duration: 5000 });
                this.uploading.set(false);
            },
        });
    }

    // ─── ダウンロード ───

    onDownload(doc: any): void {
        this.documentService.downloadDocument(doc.id);
    }

    // ─── 削除 ───

    onDelete(doc: any): void {
        if (confirm(`「${doc.name}」を削除しますか？`)) {
            this.documentService.deleteDocument(doc.id).subscribe({
                next: () => {
                    this.snackBar.open('ファイルを削除しました', '閉じる', {
                        duration: 3000,
                    });
                    this.documentService.loadDocuments(this.projectId);
                },
                error: () => {
                    this.snackBar.open('削除に失敗しました', '閉じる', {
                        duration: 5000,
                    });
                },
            });
        }
    }

    // ─── ページネーション ───

    onPageChange(event: PageEvent): void {
        this.documentService.loadDocuments(this.projectId, {
            page: String(event.pageIndex + 1),
            limit: String(event.pageSize),
        });
    }

    // ─── ヘルパー ───

    formatSize(bytes: number | bigint): string {
        return formatFileSize(Number(bytes));
    }

    getMimeIcon(mimeType: string): string {
        const map: Record<string, string> = {
            'application/pdf': 'picture_as_pdf',
            'image/png': 'image',
            'image/jpeg': 'image',
            'image/gif': 'image',
            'image/webp': 'image',
            'text/plain': 'description',
            'text/csv': 'description',
        };
        if (mimeType.includes('word') || mimeType.includes('document')) return 'article';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'grid_on';
        if (mimeType.includes('presentation')) return 'slideshow';
        return map[mimeType] || 'insert_drive_file';
    }

    getMimeLabel(mimeType: string): string {
        const map: Record<string, string> = {
            'application/pdf': 'PDF',
            'image/png': 'PNG',
            'image/jpeg': 'JPEG',
            'image/gif': 'GIF',
            'image/webp': 'WebP',
            'text/plain': 'TXT',
            'text/csv': 'CSV',
        };
        if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLSX';
        if (mimeType.includes('presentation')) return 'PPTX';
        return map[mimeType] || 'ファイル';
    }

    getMimeColor(mimeType: string): string {
        if (mimeType === 'application/pdf') return 'warn';
        if (mimeType.startsWith('image/')) return 'primary';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'accent';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'primary';
        return '';
    }
}
