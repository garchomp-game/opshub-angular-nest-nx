import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-kpi-card',
    standalone: true,
    imports: [MatCardModule, MatIconModule],
    template: `
    <mat-card class="kpi-card" [style.border-left-color]="color()" data-testid="kpi-card">
      <mat-card-content class="kpi-content">
        <div class="kpi-icon" [style.background-color]="color() + '20'" [style.color]="color()">
          <mat-icon>{{ icon() }}</mat-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-value" data-testid="kpi-value">{{ value() }}</span>
          <span class="kpi-title">{{ title() }}</span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
    styles: [`
    .kpi-card {
      border-left: 4px solid transparent;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .kpi-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 0;
    }
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
    }
    .kpi-title {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.54);
      margin-top: 2px;
    }
  `],
})
export class KpiCardComponent {
    title = input.required<string>();
    value = input.required<number>();
    icon = input.required<string>();
    color = input<string>('#1976d2');
}
