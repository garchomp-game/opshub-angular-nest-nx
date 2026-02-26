import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-placeholder',
    standalone: true,
    template: `
    <h1>{{ title }}</h1>
    <p>このモジュールは今後のチケットで実装されます。</p>
  `,
})
export class PlaceholderComponent {
    private route = inject(ActivatedRoute);
    title = this.route.snapshot.data['title'] ?? 'Feature';
}
