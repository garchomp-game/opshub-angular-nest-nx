import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DocumentService } from './document.service';
import { formatFileSize } from '@shared/util';

@Component({
    selector: 'app-document-list',
    standalone: true,
    imports: [
        CommonModule,
        NzTableModule, NzButtonModule, NzIconModule,
        NzTagModule, NzProgressModule, NzTooltipModule,
        NzSpinModule, NzAvatarModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-gray-200 pb-4">
                <h2 class="text-2xl font-bold text-gray-900 m-0">ドキュメント管理</h2>
            </div>

            <!-- Upload Section -->
            <div class="bg-white rounded-xl shadow-sm border-2 border-dashed p-8 transition-colors duration-200 cursor-pointer"
                 [class.bg-blue-50]="isDragOver()"
                 [class.border-blue-400]="isDragOver()"
                 [class.border-gray-300]="!isDragOver()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)"
                 (click)="fileInput.click()"
                 (keydown.enter)="fileInput.click()"
                 (keydown.space)="fileInput.click()"
                 tabindex="0"
                 role="button"
                 data-testid="drop-zone">

                <div class="flex flex-col items-center justify-center text-center pointer-events-none">
                    <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors"
                         [class.bg-white]="isDragOver()"
                         [class.bg-gray-50]="!isDragOver()">
                        <span nz-icon nzType="cloud-upload" nzTheme="outline"
                              class="transition-colors"
                              [class.text-blue-600]="isDragOver()"
                              [class.text-gray-400]="!isDragOver()"
                              style="font-size: 32px;"></span>
                    </div>

                    <h3 class="text-lg font-bold text-gray-900 mb-2 m-0">ファイルをドラッグ＆ドロップ</h3>
                    <p class="text-gray-500 mb-6 font-medium">または</p>

                    <button nz-button nzType="primary"
                            class="pointer-events-auto"
                            data-testid="upload-button"
                            (click)="$event.stopPropagation(); fileInput.click()">
                        <span nz-icon nzType="upload" nzTheme="outline"></span>
                        ファイルを選択
                    </button>
                    <input #fileInput type="file" hidden (change)="onFileSelected($event)" data-testid="file-input" />

                    <p class="text-xs text-gray-400 mt-6 font-medium tracking-wide">最大10MB — PDF, 画像, Office, テキストファイル</p>
                </div>
            </div>

            <!-- Loading -->
            @if (documentService.loading() || uploading()) {
                <nz-progress [nzPercent]="0" nzStatus="active" [nzShowInfo]="false" nzSize="small"></nz-progress>
            }

            <!-- Document List Table -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                @if (!documentService.loading() && documentService.documents().length === 0) {
                    <div class="flex flex-col items-center justify-center py-16 text-center">
                        <div class="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <span nz-icon nzType="folder-open" nzTheme="outline" class="text-gray-400" style="font-size: 40px;"></span>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 mb-1">ドキュメントはまだありません</h3>
                        <p class="text-gray-500 mb-6">ファイルをアップロードしてプロジェクト資料を管理しましょう</p>
                    </div>
                } @else {
                    <nz-table #docTable
                              [nzData]="documentService.documents()"
                              [nzFrontPagination]="false"
                              [nzTotal]="documentService.meta()?.total ?? 0"
                              [nzPageSize]="documentService.meta()?.limit ?? 10"
                              [nzPageIndex]="currentPage"
                              (nzPageIndexChange)="onPageIndexChange($event)"
                              (nzPageSizeChange)="onPageSizeChange($event)"
                              [nzPageSizeOptions]="[10, 20, 50]"
                              nzShowSizeChanger
                              nzSize="middle"
                              data-testid="document-table">
                        <thead>
                            <tr>
                                <th nzWidth="250px">ファイル名</th>
                                <th nzWidth="100px">サイズ</th>
                                <th nzWidth="80px">種別</th>
                                <th nzWidth="150px">アップロード者</th>
                                <th nzWidth="150px">日時</th>
                                <th nzWidth="100px" class="text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (doc of docTable.data; track doc.id) {
                                <tr class="hover:bg-gray-50/50 transition-colors">
                                    <td>
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                                <span nz-icon [nzType]="getMimeNzIcon(doc.mimeType)" nzTheme="outline" style="font-size: 20px;"></span>
                                            </div>
                                            <span class="font-medium text-gray-900">{{ doc.name }}</span>
                                        </div>
                                    </td>
                                    <td class="text-gray-600 whitespace-nowrap font-medium">
                                        {{ formatSize(doc.fileSize) }}
                                    </td>
                                    <td>
                                        <nz-tag [nzColor]="getMimeTagColor(doc.mimeType)">
                                            {{ getMimeLabel(doc.mimeType) }}
                                        </nz-tag>
                                    </td>
                                    <td class="text-gray-600 whitespace-nowrap">
                                        <div class="flex items-center gap-2">
                                            <nz-avatar [nzText]="(doc.uploader?.profile?.displayName || 'U').charAt(0)"
                                                       [nzSize]="24"
                                                       style="background-color: #e0e7ff; color: #4338ca; font-size: 12px;"></nz-avatar>
                                            <span class="font-medium">{{ doc.uploader?.profile?.displayName || '—' }}</span>
                                        </div>
                                    </td>
                                    <td class="text-gray-500 whitespace-nowrap">
                                        {{ doc.createdAt | date:'yyyy/MM/dd HH:mm' }}
                                    </td>
                                    <td class="text-right whitespace-nowrap">
                                        <button nz-button nzType="text" nzShape="circle"
                                                nz-tooltip nzTooltipTitle="ダウンロード"
                                                (click)="onDownload(doc)"
                                                data-testid="download-button">
                                            <span nz-icon nzType="download" nzTheme="outline"></span>
                                        </button>
                                        <button nz-button nzType="text" nzShape="circle" nzDanger
                                                nz-tooltip nzTooltipTitle="削除"
                                                (click)="onDelete(doc)"
                                                data-testid="delete-button">
                                            <span nz-icon nzType="delete" nzTheme="outline"></span>
                                        </button>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </nz-table>
                }
            </div>
        </div>
    `,
    styles: [],
})
export class DocumentListComponent implements OnInit {
    documentService = inject(DocumentService);
    private route = inject(ActivatedRoute);
    private message = inject(NzMessageService);

    projectId = '';
    displayedColumns = ['name', 'fileSize', 'mimeType', 'uploadedBy', 'createdAt', 'actions'];
    isDragOver = signal(false);
    uploading = signal(false);
    currentPage = 1;

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
                this.message.success('ファイルをアップロードしました');
                this.documentService.loadDocuments(this.projectId);
                this.uploading.set(false);
            },
            error: (err) => {
                const msg =
                    err.error?.error?.message || 'アップロードに失敗しました';
                this.message.error(msg);
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
                    this.message.success('ファイルを削除しました');
                    this.documentService.loadDocuments(this.projectId);
                },
                error: () => {
                    this.message.error('削除に失敗しました');
                },
            });
        }
    }

    // ─── ページネーション ───

    onPageIndexChange(page: number): void {
        this.currentPage = page;
        this.documentService.loadDocuments(this.projectId, {
            page: String(page),
            limit: String(this.documentService.meta()?.limit ?? 10),
        });
    }

    onPageSizeChange(size: number): void {
        this.currentPage = 1;
        this.documentService.loadDocuments(this.projectId, {
            page: '1',
            limit: String(size),
        });
    }

    // ─── ヘルパー ───

    formatSize(bytes: number | bigint): string {
        return formatFileSize(Number(bytes));
    }

    getMimeNzIcon(mimeType: string): string {
        const map: Record<string, string> = {
            'application/pdf': 'file-pdf',
            'image/png': 'file-image',
            'image/jpeg': 'file-image',
            'image/gif': 'file-image',
            'image/webp': 'file-image',
            'text/plain': 'file-text',
            'text/csv': 'file-text',
        };
        if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'file-excel';
        if (mimeType.includes('presentation')) return 'file-ppt';
        return map[mimeType] || 'file';
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

    getMimeTagColor(mimeType: string): string {
        if (mimeType === 'application/pdf') return 'red';
        if (mimeType.startsWith('image/')) return 'blue';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'purple';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'green';
        if (mimeType.includes('presentation')) return 'orange';
        return 'default';
    }

    getMimeIcon(mimeType: string): string {
        return this.getMimeNzIcon(mimeType);
    }

    getMimeBadgeClasses(mimeType: string): string {
        if (mimeType === 'application/pdf') return 'bg-red-100 text-red-700 border-red-200';
        if (mimeType.startsWith('image/')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (mimeType.includes('presentation')) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}
