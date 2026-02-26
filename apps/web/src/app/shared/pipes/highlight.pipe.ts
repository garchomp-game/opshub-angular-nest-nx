import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
    private sanitizer = inject(DomSanitizer);

    transform(text: string, keyword: string): SafeHtml {
        if (!keyword || !text) return text;
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        const highlighted = text.replace(regex, '<mark>$1</mark>');
        return this.sanitizer.bypassSecurityTrustHtml(highlighted);
    }
}
