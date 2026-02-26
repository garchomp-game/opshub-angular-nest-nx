import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';

export interface KpiData {
    pendingApprovals: number;
    myWorkflows: number;
    myTasks: number;
    weeklyHours: number;
}

export interface ProjectProgress {
    projectId: string;
    projectName: string;
    totalTasks: number;
    completedTasks: number;
    progressPercent: number;
}

export interface QuickAction {
    label: string;
    icon: string;
    routerLink: string;
    roles: string[];
}

export interface DashboardData {
    kpi: KpiData;
    recentNotifications: any[];
    quickActions: QuickAction[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);

    // ─── State ───
    private _dashboardData = signal<DashboardData | null>(null);
    private _projectProgress = signal<ProjectProgress[]>([]);
    private _isLoading = signal(false);

    // ─── Public Signals ───
    readonly dashboardData = this._dashboardData.asReadonly();
    readonly projectProgress = this._projectProgress.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();

    // ─── Load Methods (Signal update) ───

    loadDashboard(): void {
        this._isLoading.set(true);
        this.http.get<any>('/api/dashboard').pipe(
            tap((res) => {
                const data = res.success ? res.data : res;
                this._dashboardData.set(data);
            }),
            finalize(() => this._isLoading.set(false)),
        ).subscribe();
    }

    loadProjectProgress(): void {
        this._isLoading.set(true);
        this.http.get<any>('/api/dashboard/project-progress').pipe(
            tap((res) => {
                const data = res.success ? res.data : res;
                this._projectProgress.set(Array.isArray(data) ? data : []);
            }),
            finalize(() => this._isLoading.set(false)),
        ).subscribe();
    }

    // ─── Observable Methods ───

    getDashboard(): Observable<any> {
        return this.http.get<any>('/api/dashboard');
    }

    getKpi(): Observable<any> {
        return this.http.get<any>('/api/dashboard/kpi');
    }

    getProjectProgress(): Observable<any> {
        return this.http.get<any>('/api/dashboard/project-progress');
    }
}
