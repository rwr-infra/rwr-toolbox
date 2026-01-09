import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-mods-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, TranslocoDirective],
  templateUrl: './mods-layout.component.html',
  styleUrl: './mods-layout.component.css'
})
export class ModsLayoutComponent {
  constructor(private router: Router) {}

  /**
   * Check if a route is active
   */
  isRouteActive(routePath: string): boolean {
    return this.router.url.includes(routePath);
  }
}
