import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (breadcrumbs().length > 0) {
      <div class="breadcrumbs text-sm text-base-content/60 mb-4" data-testid="breadcrumb">
        <ul>
          <li><a routerLink="/dashboard">ホーム</a></li>
          @for (item of breadcrumbs(); track item.url) {
            <li>
              @if (!$last) {
                <a [routerLink]="item.url">{{ item.label }}</a>
              } @else {
                <span>{{ item.label }}</span>
              }
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.buildBreadcrumbs(this.activatedRoute.root)),
    ),
    { initialValue: [] as BreadcrumbItem[] },
  );

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: BreadcrumbItem[] = [],
  ): BreadcrumbItem[] {
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
        breadcrumbs.push({ label: title, url: nextURL || '/' });
      }

      return this.buildBreadcrumbs(child, nextURL, breadcrumbs);
    }

    return breadcrumbs;
  }
}
