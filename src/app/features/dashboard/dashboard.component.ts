import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
export class DashboardComponent implements OnInit, OnDestroy {
    private dashboardService = inject(DashboardService);

    // Convert observables to signals
    stats = toSignal(this.dashboardService.getStats$(), {
        initialValue: {
            serverCount: 0,
            playerCount: 0,
            modCount: 0,
            apiStatus: 'loading' as const,
            apiPing: null,
            lastUpdate: Date.now(),
        } as DashboardStats,
    });

    activities = toSignal(this.dashboardService.getRecentActivities$(), {
        initialValue: [],
    });

    ngOnInit(): void {
        this.dashboardService.initialize();
    }

    ngOnDestroy(): void {
        this.dashboardService.stopPingInterval();
    }

    refresh(): void {
        this.dashboardService.refresh();
    }

    trackActivity(_index: number, activity: Activity): string {
        return activity.id;
    }
}
