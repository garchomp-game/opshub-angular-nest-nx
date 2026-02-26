import { Component, input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [NzCardModule, NzStatisticModule, NzIconModule],
  template: `
    <nz-card [nzBordered]="true"
             class="kpi-card group"
             [style.borderLeftWidth.px]="4"
             [style.borderLeftColor]="color()"
             data-testid="kpi-card">
      <nz-statistic
        [nzValue]="value()"
        [nzTitle]="title()"
        [nzPrefix]="prefixTpl"
        [nzValueStyle]="{ color: color(), 'font-weight': '700', 'font-size': '28px' }">
      </nz-statistic>
      <ng-template #prefixTpl>
        <span nz-icon [nzType]="icon()" nzTheme="outline"
              [style.color]="color()" class="text-xl"></span>
      </ng-template>
    </nz-card>
  `,
  styles: [`
    :host {
      display: block;
    }
    .kpi-card {
      border-radius: 12px;
      overflow: hidden;
      transition: box-shadow 0.3s ease, transform 0.3s ease;
    }
    .kpi-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    ::ng-deep .kpi-card .ant-card-body {
      padding: 20px 24px;
    }
    ::ng-deep .kpi-card .ant-statistic-title {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
      margin-bottom: 4px;
    }
  `],
})
export class KpiCardComponent {
  title = input.required<string>();
  value = input.required<number>();
  icon = input.required<string>();
  color = input<string>('#1976d2');
}
