import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
    selector: 'app-mods-layout',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoDirective],
    templateUrl: './mods-layout.component.html',
})
export class ModsLayoutComponent {}
