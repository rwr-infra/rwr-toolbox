import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective } from '@jsverse/transloco';
import {
    DashboardService,
    DashboardStats,
    Activity,
} from './services/dashboard.service';

@Component({
    selector: 'app-dashboard',
    imports: [
        CommonModule,
        LucideAngularModule,
        RouterLink,
        TranslocoDirective,
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
    private dashboardService = inject(DashboardService);

    // Convert observables to signals
    stats = toSignal(this.dashboardService.getStats$(), {
        initialValue: {
            serverCount: 0,
            playerCount: 0,
            modCount: 0,
            apiStatus: 'loading',
            lastUpdate: Date.now(),
        },
    });

    activities = toSignal(this.dashboardService.getRecentActivities$(), {
        initialValue: [],
    });

    ngOnInit(): void {
        this.dashboardService.initialize();
    }

    refresh(): void {
        this.dashboardService.refresh();
    }

    trackActivity(_index: number, activity: Activity): string {
        return activity.id;
    }
}
