import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [BreadcrumbModule],
  template: `
    @if (items().length > 0) {
      <p-breadcrumb [model]="items()" [home]="home" data-testid="breadcrumb"
          styleClass="border-0 bg-transparent p-0 mb-4" />
    }
  `,
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  home: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };

  items = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.buildBreadcrumbs(this.activatedRoute.root)),
    ),
    { initialValue: [] as MenuItem[] },
  );

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: MenuItem[] = [],
  ): MenuItem[] {
    const children = route.children;
    if (!children || children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const snapshot = child.snapshot;
      if (!snapshot) {
        continue;
      }

      const segments = snapshot.url || [];
      const routeURL = segments.map((seg) => seg.path).join('/');
      const nextURL = routeURL ? `${url}/${routeURL}` : url;

      const title = snapshot.data?.['title'];
      if (title && !breadcrumbs.some((b) => b.label === title)) {
        breadcrumbs.push({ label: title, routerLink: nextURL || '/' });
      }

      return this.buildBreadcrumbs(child, nextURL, breadcrumbs);
    }

    return breadcrumbs;
  }
}
