import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { ApiResponse } from '@shared/types';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId?: string;
  clientName: string;
  issuedDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; profile?: { displayName: string } };
  project?: { id: string; name: string } | null;
  items?: InvoiceItem[];
}

export interface PaginatedInvoices {
  data: Invoice[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface InvoiceQuery {
  status?: string;
  clientName?: string;
  projectId?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private http = inject(HttpClient);

  // ─── State ───
  private _invoices = signal<Invoice[]>([]);
  private _currentInvoice = signal<Invoice | null>(null);
  private _isLoading = signal(false);
  private _totalCount = signal(0);

  // ─── Public Signals ───
  readonly invoices = this._invoices.asReadonly();
  readonly currentInvoice = this._currentInvoice.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();

  // ─── Load Methods (side-effect) ───

  loadAll(query: InvoiceQuery = {}): void {
    this._isLoading.set(true);
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });

    this.http.get<ApiResponse<PaginatedInvoices>>('/api/invoices', { params }).pipe(
      tap((res) => {
        const payload = res.success ? res.data : (res as unknown as PaginatedInvoices);
        this._invoices.set(payload.data ?? []);
        if (payload.meta) this._totalCount.set(payload.meta.total);
      }),
      finalize(() => this._isLoading.set(false)),
    ).subscribe();
  }

  loadOne(id: string): void {
    this._isLoading.set(true);
    this.http.get<ApiResponse<Invoice>>(`/api/invoices/${id}`).pipe(
      tap((res) => {
        const data = res.success ? res.data : (res as unknown as Invoice);
        this._currentInvoice.set(data);
      }),
      finalize(() => this._isLoading.set(false)),
    ).subscribe();
  }

  // ─── HTTP Methods (return Observable) ───

  getAll(query?: InvoiceQuery): Observable<ApiResponse<PaginatedInvoices>> {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<ApiResponse<PaginatedInvoices>>('/api/invoices', { params });
  }

  getById(id: string): Observable<ApiResponse<Invoice>> {
    return this.http.get<ApiResponse<Invoice>>(`/api/invoices/${id}`);
  }

  create(dto: Record<string, unknown>): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>('/api/invoices', dto);
  }

  update(id: string, dto: Record<string, unknown>): Observable<ApiResponse<Invoice>> {
    return this.http.patch<ApiResponse<Invoice>>(`/api/invoices/${id}`, dto);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<Invoice>> {
    return this.http.patch<ApiResponse<Invoice>>(`/api/invoices/${id}/status`, { status });
  }

  deleteInvoice(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/invoices/${id}`);
  }
}
