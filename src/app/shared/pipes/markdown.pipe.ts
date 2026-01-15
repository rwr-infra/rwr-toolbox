import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({
    name: 'markdown',
    standalone: true,
})
export class MarkdownPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {
        // 配置 marked 使用 GFM (marked v17+ API)
        marked.setOptions({
            gfm: true, // GitHub Flavored Markdown
            breaks: true, // 支持换行符
        });
    }

    transform(value: string): SafeHtml | null {
        if (!value) return null;

        try {
            const html = marked.parse(value) as string;
            return this.sanitizer.bypassSecurityTrustHtml(html);
        } catch (e) {
            console.error('Markdown parse error:', e);
            return this.sanitizer.bypassSecurityTrustHtml(value);
        }
    }
}
