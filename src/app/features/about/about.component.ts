import { Component, OnInit, signal, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { invoke } from '@tauri-apps/api/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-about',
    imports: [LucideAngularModule, TranslocoDirective],
    templateUrl: './about.component.html',
    styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit {
    private sanitizer = inject(DomSanitizer);

    changelogHtml = signal<SafeHtml>('');
    changelogLoadFailed = signal(false);

    async ngOnInit(): Promise<void> {
        this.changelogLoadFailed.set(false);

        try {
            const content = await invoke<string>('get_changelog');
            // Parse markdown to HTML
            const html = await marked.parse(content);
            this.changelogHtml.set(
                this.sanitizer.bypassSecurityTrustHtml(html),
            );
        } catch (error) {
            console.error('Failed to load changelog:', error);
            this.changelogLoadFailed.set(true);
            this.changelogHtml.set(this.sanitizer.bypassSecurityTrustHtml(''));
        }
    }
}
