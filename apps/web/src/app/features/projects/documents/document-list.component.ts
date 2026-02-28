import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastService } from '../../../shared/ui';
import { DocumentService } from './document.service';
import { formatFileSize } from '@shared/util';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    DatePipe,
    TableModule, PaginatorModule, TagModule, AvatarModule,
    ButtonModule, TooltipModule, ProgressBarModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-surface-200 pb-4">
        <h2 class="text-2xl font-bold m-0">ドキュメント管理</h2>
      </div>

      <!-- Upload Section -->
      <div class="border-2 border-dashed rounded-xl transition-colors duration-200 cursor-pointer p-8"
         [class.bg-primary-50]="isDragOver()"
         [class.border-primary]="isDragOver()"
         [class.border-surface-300]="!isDragOver()"
         (dragover)="onDragOver($event)"
         (dragleave)="onDragLeave($event)"
         (drop)="onDrop($event)"
         (click)="fileInput.click()"
         (keydown.enter)="fileInput.click()"
         (keydown.space)="fileInput.click()"
         tabindex="0"
         role="button"
         data-testid="drop-zone">

        <div class="flex flex-col items-center text-center pointer-events-none">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors"
             [class.bg-white]="isDragOver()"
             [class.bg-surface-100]="!isDragOver()">
            <i class="pi pi-cloud-upload text-3xl transition-colors"
               [class.text-primary]="isDragOver()"
               [style.opacity]="isDragOver() ? 1 : 0.5"></i>
          </div>

          <h3 class="text-lg font-bold mb-2 m-0">ファイルをドラッグ＆ドロップ</h3>
          <p class="text-surface-400 mb-6 font-medium">または</p>

          <p-button label="ファイルを選択" icon="pi pi-upload"
              data-testid="upload-button"
              styleClass="pointer-events-auto"
              (onClick)="$event.stopPropagation(); fileInput.click()" />
          <input #fileInput type="file" hidden (change)="onFileSelected($event)" data-testid="file-input" />

          <p class="text-xs text-surface-300 mt-6 font-medium tracking-wide">最大10MB — PDF, 画像, Office, テキストファイル</p>
        </div>
      </div>

      <!-- Loading -->
      @if (documentService.loading() || uploading()) {
        <p-progressbar mode="indeterminate" [style]="{'height': '4px'}" />
      }

      <!-- Document List Table -->
      @if (!documentService.loading() && documentService.documents().length === 0) {
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center mb-4">
            <i class="pi pi-folder-open text-4xl text-surface-300"></i>
          </div>
          <h3 class="text-lg font-bold mb-1">ドキュメントはまだありません</h3>
          <p class="text-surface-400 mb-6">ファイルをアップロードしてプロジェクト資料を管理しましょう</p>
        </div>
      } @else if (documentService.documents().length > 0) {
        <p-table [value]="documentService.documents()" [tableStyle]="{'min-width': '50rem'}"
            data-testid="document-table">
          <ng-template #header>
            <tr>
              <th>ファイル名</th>
              <th>サイズ</th>
              <th>種別</th>
              <th>アップロード者</th>
              <th>日時</th>
              <th class="text-right">操作</th>
            </tr>
          </ng-template>
          <ng-template #body let-doc>
            <tr>
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-400 shrink-0">
                    <i [class]="getMimeIcon(doc.mimeType)" class="text-xl"></i>
                  </div>
                  <span class="font-medium">{{ doc.name }}</span>
                </div>
              </td>
              <td class="text-surface-500 whitespace-nowrap font-medium">
                {{ formatSize(doc.fileSize) }}
              </td>
              <td>
                <p-tag [value]="getMimeLabel(doc.mimeType)" [severity]="getMimeTagSeverity(doc.mimeType)" />
              </td>
              <td class="text-surface-500 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <p-avatar [label]="(doc.uploader?.profile?.displayName || 'U').charAt(0)"
                      shape="circle" size="small"
                      [style]="{'background-color': 'var(--p-primary-100)', 'color': 'var(--p-primary-700)', 'width': '1.5rem', 'height': '1.5rem', 'font-size': '0.75rem'}" />
                  <span class="font-medium">{{ doc.uploader?.profile?.displayName || '—' }}</span>
                </div>
              </td>
              <td class="text-surface-400 whitespace-nowrap">
                {{ doc.createdAt | date:'yyyy/MM/dd HH:mm' }}
              </td>
              <td class="text-right whitespace-nowrap">
                <p-button icon="pi pi-download" [rounded]="true" [text]="true" size="small"
                    pTooltip="ダウンロード"
                    (onClick)="onDownload(doc)"
                    data-testid="download-button" />
                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" size="small"
                    severity="danger"
                    pTooltip="削除"
                    (onClick)="onDelete(doc)"
                    data-testid="delete-button" />
              </td>
            </tr>
          </ng-template>
        </p-table>
        <p-paginator
          [first]="(currentPage - 1) * (documentService.meta()?.limit ?? 10)"
          [rows]="documentService.meta()?.limit ?? 10"
          [totalRecords]="documentService.meta()?.total ?? 0"
          (onPageChange)="onPaginatorChange($event)" />
      }
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

  onPaginatorChange(event: any): void {
    const page = Math.floor(event.first / event.rows) + 1;
    this.currentPage = page;
    this.documentService.loadDocuments(this.projectId, {
      page: String(page),
      limit: String(event.rows),
    });
  }

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

  getMimeIcon(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'pi pi-file-pdf';
    if (mimeType.startsWith('image/')) return 'pi pi-image';
    if (mimeType.startsWith('text/')) return 'pi pi-file';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'pi pi-file-word';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'pi pi-file-excel';
    return 'pi pi-file';
  }

  // Keep legacy method name for test compatibility
  getMimeHeroIcon(mimeType: string): string {
    return this.getMimeIcon(mimeType);
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

  getMimeTagSeverity(mimeType: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    if (mimeType === 'application/pdf') return 'danger';
    if (mimeType.startsWith('image/')) return 'info';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'secondary';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'success';
    if (mimeType.includes('presentation')) return 'warn';
    return 'secondary';
  }

  getMimeBadgeClasses(mimeType: string): string {
    return '';  // kept for backward compatibility
  }

  getMimeIcon_legacy(mimeType: string): string {
    return this.getMimeIcon(mimeType);
  }
}
