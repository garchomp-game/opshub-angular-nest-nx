import { Component, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CardModule],
  template: `
    <p-card styleClass="hover:shadow-lg transition-all"
        [style]="{ cursor: link() ? 'pointer' : 'default' }"
        (click)="onClick()"
        data-testid="kpi-card">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium opacity-60 mb-1">{{ title() }}</div>
          <div class="text-3xl font-bold" [style.color]="color()">{{ value() }}</div>
        </div>
        <div class="w-12 h-12 rounded-full flex items-center justify-center" [style.background-color]="color() + '1a'">
          <i [class]="piIcon()" class="text-2xl" [style.color]="color()"></i>
        </div>
      </div>
    </p-card>
  `,
  styles: [`:host { display: block; }`],
})
export class KpiCardComponent {
  private router = inject(Router);

  title = input.required<string>();
  value = input.required<number>();
  icon = input.required<string>();
  color = input<string>('#1976d2');
  link = input<string>();

  piIcon(): string {
    const map: Record<string, string> = {
      'heroDocumentText': 'pi pi-file',
      'heroCheckCircle': 'pi pi-check-circle',
      'heroBriefcase': 'pi pi-briefcase',
      'heroClock': 'pi pi-clock',
      'heroUsers': 'pi pi-users',
      'heroBanknotes': 'pi pi-money-bill',
      'heroChartBar': 'pi pi-chart-bar',
    };
    return map[this.icon()] ?? 'pi pi-star';
  }

  onClick(): void {
    const url = this.link();
    if (url) {
      this.router.navigateByUrl(url);
    }
  }
}
