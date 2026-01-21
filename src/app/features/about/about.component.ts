import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
    selector: 'app-about',
    imports: [LucideAngularModule, TranslocoDirective],
    templateUrl: './about.component.html',
    styleUrl: './about.component.css',
})
export class AboutComponent {}
