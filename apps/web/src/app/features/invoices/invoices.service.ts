import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';

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

        this.http.get<any>('/api/invoices', { params }).pipe(
            tap((res) => {
                const data = res.success ? res.data : res;
                this._invoices.set(data.data ?? data);
                if (data.meta) this._totalCount.set(data.meta.total);
            }),
            finalize(() => this._isLoading.set(false)),
        ).subscribe();
    }

    loadOne(id: string): void {
        this._isLoading.set(true);
        this.http.get<any>(`/api/invoices/${id}`).pipe(
            tap((res) => {
                const data = res.success ? res.data : res;
                this._currentInvoice.set(data);
            }),
            finalize(() => this._isLoading.set(false)),
        ).subscribe();
    }

    // ─── HTTP Methods (return Observable) ───

    getAll(query?: InvoiceQuery): Observable<any> {
        let params = new HttpParams();
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params = params.set(key, String(value));
                }
            });
        }
        return this.http.get<any>('/api/invoices', { params });
    }

    getById(id: string): Observable<any> {
        return this.http.get<any>(`/api/invoices/${id}`);
    }

    create(dto: any): Observable<any> {
        return this.http.post<any>('/api/invoices', dto);
    }

    update(id: string, dto: any): Observable<any> {
        return this.http.patch<any>(`/api/invoices/${id}`, dto);
    }

    updateStatus(id: string, status: string): Observable<any> {
        return this.http.patch<any>(`/api/invoices/${id}/status`, { status });
    }

    deleteInvoice(id: string): Observable<any> {
        return this.http.delete<any>(`/api/invoices/${id}`);
    }
}
