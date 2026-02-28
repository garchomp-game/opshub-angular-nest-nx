import { Component, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroDocumentText, heroCheckCircle, heroBriefcase,
  heroClock, heroUsers, heroBanknotes, heroChartBar,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({
    heroDocumentText, heroCheckCircle, heroBriefcase,
    heroClock, heroUsers, heroBanknotes, heroChartBar,
  })],
  template: `
    <div class="stat bg-base-100 rounded-xl shadow-sm border border-base-200
          hover:shadow-md transition-all"
       [class.hover:scale-[1.02]]="!!link()"
       [class.cursor-pointer]="!!link()"
       (click)="onClick()"
       (keydown.enter)="onClick()"
       [attr.tabindex]="link() ? 0 : null"
       [attr.role]="link() ? 'link' : null"
       data-testid="kpi-card">
      <div class="stat-figure" [style.color]="color()">
        <ng-icon [name]="icon()" class="text-3xl" />
      </div>
      <div class="stat-title">{{ title() }}</div>
      <div class="stat-value" [style.color]="color()">{{ value() }}</div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class KpiCardComponent {
  private router = inject(Router);

  title = input.required<string>();
  value = input.required<number>();
  icon = input.required<string>();
  color = input<string>('#1976d2');
  link = input<string>();

  onClick(): void {
    const url = this.link();
    if (url) {
      this.router.navigateByUrl(url);
    }
  }
}
