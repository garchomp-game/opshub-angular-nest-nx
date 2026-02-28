import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroCloudArrowUp, heroArrowUpTray, heroFolderOpen, heroTrash,
  heroArrowDownTray, heroDocumentText, heroPhoto, heroDocument,
} from '@ng-icons/heroicons/outline';
import { DataTableComponent, ToastService } from '../../../shared/ui';
import { DocumentService } from './document.service';
import { formatFileSize } from '@shared/util';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule, NgIcon, DataTableComponent,
  ],
  viewProviders: [provideIcons({
    heroCloudArrowUp, heroArrowUpTray, heroFolderOpen, heroTrash,
    heroArrowDownTray, heroDocumentText, heroPhoto, heroDocument,
  })],
  template: `
    <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-base-200 pb-4">
        <h2 class="text-2xl font-bold text-base-content m-0">ドキュメント管理</h2>
      </div>

      <!-- Upload Section -->
      <div class="card bg-base-100 shadow-sm border-2 border-dashed transition-colors duration-200 cursor-pointer"
         [class.bg-primary/5]="isDragOver()"
         [class.border-primary]="isDragOver()"
         [class.border-base-300]="!isDragOver()"
         (dragover)="onDragOver($event)"
         (dragleave)="onDragLeave($event)"
         (drop)="onDrop($event)"
         (click)="fileInput.click()"
         (keydown.enter)="fileInput.click()"
         (keydown.space)="fileInput.click()"
         tabindex="0"
         role="button"
         data-testid="drop-zone">

        <div class="card-body items-center text-center pointer-events-none py-8">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors"
             [class.bg-base-100]="isDragOver()"
             [class.bg-base-200/50]="!isDragOver()">
            <ng-icon name="heroCloudArrowUp"
               class="text-3xl transition-colors"
               [class.text-primary]="isDragOver()"
               [class.text-base-content/40]="!isDragOver()" />
          </div>

          <h3 class="text-lg font-bold text-base-content mb-2 m-0">ファイルをドラッグ＆ドロップ</h3>
          <p class="text-base-content/50 mb-6 font-medium">または</p>

          <button class="btn btn-primary pointer-events-auto"
              data-testid="upload-button"
              (click)="$event.stopPropagation(); fileInput.click()">
            <ng-icon name="heroArrowUpTray" class="text-lg" />
            ファイルを選択
          </button>
          <input #fileInput type="file" hidden (change)="onFileSelected($event)" data-testid="file-input" />

          <p class="text-xs text-base-content/40 mt-6 font-medium tracking-wide">最大10MB — PDF, 画像, Office, テキストファイル</p>
        </div>
      </div>

      <!-- Loading -->
      @if (documentService.loading() || uploading()) {
        <progress class="progress progress-primary w-full"></progress>
      }

      <!-- Document List Table -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-0">
          @if (!documentService.loading() && documentService.documents().length === 0) {
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="w-20 h-20 rounded-full bg-base-200/50 flex items-center justify-center mb-4">
                <ng-icon name="heroFolderOpen" class="text-4xl text-base-content/40" />
              </div>
              <h3 class="text-lg font-bold text-base-content mb-1">ドキュメントはまだありません</h3>
              <p class="text-base-content/50 mb-6">ファイルをアップロードしてプロジェクト資料を管理しましょう</p>
            </div>
          } @else {
            <app-data-table
              [page]="currentPage"
              [pageSize]="documentService.meta()?.limit ?? 10"
              [total]="documentService.meta()?.total ?? 0"
              (pageChange)="onPageIndexChange($event)"
              data-testid="document-table">
              <thead>
                <tr>
                  <th>ファイル名</th>
                  <th>サイズ</th>
                  <th>種別</th>
                  <th>アップロード者</th>
                  <th>日時</th>
                  <th class="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                @for (doc of documentService.documents(); track doc.id) {
                  <tr class="hover:bg-base-200/40">
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-base-200/50 flex items-center justify-center text-base-content/40 shrink-0">
                          <ng-icon [name]="getMimeHeroIcon(doc.mimeType)" class="text-xl" />
                        </div>
                        <span class="font-medium text-base-content">{{ doc.name }}</span>
                      </div>
                    </td>
                    <td class="text-base-content/60 whitespace-nowrap font-medium">
                      {{ formatSize(doc.fileSize) }}
                    </td>
                    <td>
                      <span class="badge text-xs" [class]="getMimeBadgeClasses(doc.mimeType)">
                        {{ getMimeLabel(doc.mimeType) }}
                      </span>
                    </td>
                    <td class="text-base-content/60 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <div class="avatar avatar-placeholder">
                          <div class="bg-primary/10 text-primary rounded-full w-6 h-6">
                            <span style="font-size: 12px;">{{ (doc.uploader?.profile?.displayName || 'U').charAt(0) }}</span>
                          </div>
                        </div>
                        <span class="font-medium">{{ doc.uploader?.profile?.displayName || '—' }}</span>
                      </div>
                    </td>
                    <td class="text-base-content/50 whitespace-nowrap">
                      {{ doc.createdAt | date:'yyyy/MM/dd HH:mm' }}
                    </td>
                    <td class="text-right whitespace-nowrap">
                      <div class="tooltip" data-tip="ダウンロード">
                        <button class="btn btn-ghost btn-circle btn-sm"
                            (click)="onDownload(doc)"
                            data-testid="download-button">
                          <ng-icon name="heroArrowDownTray" class="text-lg" />
                        </button>
                      </div>
                      <div class="tooltip" data-tip="削除">
                        <button class="btn btn-ghost btn-circle btn-sm text-error"
                            (click)="onDelete(doc)"
                            data-testid="delete-button">
                          <ng-icon name="heroTrash" class="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </app-data-table>
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class DocumentListComponent implements OnInit {
  documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

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
        this.toast.success('ファイルをアップロードしました');
        this.documentService.loadDocuments(this.projectId);
        this.uploading.set(false);
      },
      error: (err) => {
        const msg =
          err.error?.error?.message || 'アップロードに失敗しました';
        this.toast.error(msg);
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
          this.toast.success('ファイルを削除しました');
          this.documentService.loadDocuments(this.projectId);
        },
        error: () => {
          this.toast.error('削除に失敗しました');
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

  getMimeHeroIcon(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'heroDocumentText';
    if (mimeType.startsWith('image/')) return 'heroPhoto';
    if (mimeType.startsWith('text/')) return 'heroDocumentText';
    return 'heroDocument';
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

  getMimeBadgeClasses(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'badge-error badge-outline';
    if (mimeType.startsWith('image/')) return 'badge-info badge-outline';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'badge-secondary badge-outline';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'badge-success badge-outline';
    if (mimeType.includes('presentation')) return 'badge-warning badge-outline';
    return 'badge-ghost';
  }

  getMimeIcon(mimeType: string): string {
    return this.getMimeHeroIcon(mimeType);
  }
}
