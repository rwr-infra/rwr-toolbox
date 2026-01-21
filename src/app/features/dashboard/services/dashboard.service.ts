import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, map, combineLatest } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { invoke } from '@tauri-apps/api/core';
import { TranslocoService } from '@jsverse/transloco';
import { ServerService } from '../../servers/services/server.service';
import { PlayerService } from '../../players/services/player.service';
import { SettingsService } from '../../../core/services/settings.service';
import { PingService } from '../../../core/services/ping.service';
import { DirectoryService } from '../../settings/services/directory.service';

/**
 * Dashboard statistics
 */
export interface DashboardStats {
    serverCount: number;
    playerCount: number;
    modCount: number;
    apiStatus: 'online' | 'offline' | 'loading';
    apiPing: number | null;
    lastUpdate: number;
}

/**
 * Activity log entry
 */
export interface Activity {
    id: string;
    type: 'server' | 'player' | 'mod' | 'system';
    title: string;
    description: string;
    timestamp: number;
    icon: string;
}

/**
 * System status information
 */
export interface SystemStatus {
    apiConnected: boolean;
    apiPing: number | null;
    cacheEnabled: boolean;
    gamePathConfigured: boolean;
    lastUpdate: number;
}

/**
 * Service for aggregating dashboard data from multiple sources
 */
@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private serverService = inject(ServerService);
    private playerService = inject(PlayerService);
    private settingsService = inject(SettingsService);
    private pingService = inject(PingService);
    private directoryService = inject(DirectoryService);

    private transloco = inject(TranslocoService);

    // State management with signals (Principle IX: Signal管状态)
    private activitiesState = signal<Activity[]>([]);
    private apiStatusState = signal<'online' | 'offline' | 'loading'>(
        'loading',
    );
    private apiPingState = signal<number | null>(null);

    readonly activitiesSig = this.activitiesState.asReadonly();
    readonly apiStatusSig = this.apiStatusState.asReadonly();
    readonly apiPingSig = this.apiPingState.asReadonly();

    /**
     * Get aggregated dashboard statistics
     */
    getStats$(): Observable<DashboardStats> {
        return combineLatest([
            toObservable(this.serverService.serversSig),
            toObservable(this.apiStatusSig),
            toObservable(this.apiPingSig),
            toObservable(this.directoryService.directoriesSig),
        ]).pipe(
            map(([servers, apiStatus, apiPing, directories]) => {
                const serverCount = servers.length;
                const playerCount = servers.reduce(
                    (sum: number, s: any) => sum + s.currentPlayers,
                    0,
                );

                const modCount = directories.reduce(
                    (sum, dir) => sum + (dir.packageCount || 0),
                    0,
                );

                return {
                    serverCount,
                    playerCount,
                    modCount,
                    apiStatus,
                    apiPing,
                    lastUpdate: Date.now(),
                };
            }),
        );
    }

    /**
     * Get recent activities
     */
    getRecentActivities$(): Observable<Activity[]> {
        return toObservable(this.activitiesSig);
    }

    /**
     * Get system status
     */
    getSystemStatus$(): Observable<SystemStatus> {
        return combineLatest([
            toObservable(this.apiStatusSig),
            toObservable(this.apiPingSig),
            toObservable(this.directoryService.validDirectoryCountSig),
        ]).pipe(
            map(([apiStatus, apiPing, validDirCount]) => ({
                apiConnected: apiStatus === 'online',
                apiPing,
                cacheEnabled: true,
                gamePathConfigured: validDirCount > 0,
                lastUpdate: Date.now(),
            })),
        );
    }

    /**
     * Add an activity to the log
     */
    addActivity(activity: Omit<Activity, 'id' | 'timestamp'>): void {
        const newActivity: Activity = {
            ...activity,
            id: `activity-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
        };

        const currentActivities = this.activitiesState();
        this.activitiesState.set(
            [newActivity, ...currentActivities].slice(0, 10),
        );
    }

    private pingInterval: any;

    /**
     * Start periodic ping to RWR API
     */
    private startPingInterval(): void {
        if (this.pingInterval) return;

        const performPing = () => {
            // Ping RWR official site to check latency
            this.pingService
                .pingServer('rwr.runningwithrifles.com', 80)
                .subscribe({
                    next: (result) => {
                        this.apiPingState.set(result.ping);
                        this.apiStatusState.set(
                            result.ping !== null ? 'online' : 'offline',
                        );
                    },
                    error: () => {
                        this.apiPingState.set(null);
                        this.apiStatusState.set('offline');
                    },
                });
        };

        // Immediate ping
        performPing();

        // 10s interval
        this.pingInterval = setInterval(performPing, 10000);
    }

    /**
     * Stop ping interval
     */
    stopPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Refresh dashboard data
     */
    refresh(): void {
        this.serverService.fetchServers(true).subscribe({
            next: () => {
                this.apiStatusState.set('online');
            },
            error: () => {
                this.apiStatusState.set('offline');
            },
        });
        void this.syncChangelog();
    }

    /**
     * Sync the latest entry from CHANGELOG.md to the activity log
     */
    async syncChangelog(): Promise<void> {
        try {
            const content = await invoke<string>('get_changelog');
            // Regex to extract the first version block (e.g. ## [0.1.0] - 2026-01-21)
            const versionMatch = content.match(
                /##\s*\[(.*?)\]\s*-\s*(.*?)\n([\s\S]*?)(?=\n##|$)/,
            );

            if (versionMatch) {
                const version = versionMatch[1];
                const date = versionMatch[2];
                // Extract the first few lines of description (remove markdown symbols)
                const rawDesc = versionMatch[3].trim().split('\n')[0] || '';
                const cleanDesc = rawDesc
                    .replace(/^###?\s*/, '')
                    .replace(/^-\s*/, '');

                // Check if this version is already in activities to avoid duplicates
                const exists = this.activitiesState().some((a) =>
                    a.title.includes(version),
                );
                if (!exists) {
                    this.addActivity({
                        type: 'system',
                        title: this.transloco.translate(
                            'dashboard.activities.latest_update',
                            { version },
                        ),
                        description: `${date}: ${cleanDesc || this.transloco.translate('dashboard.activities.view_details')}`,
                        icon: 'refresh-cw',
                    });
                }
            }
        } catch (error) {
            console.error('Failed to sync changelog:', error);
        }
    }

    /**
     * Initialize dashboard with default activities
     */
    initialize(): void {
        this.activitiesState.set([
            {
                id: 'activity-welcome',
                type: 'system',
                title: this.transloco.translate('dashboard.activities.welcome'),
                description: this.transloco.translate(
                    'dashboard.activities.welcome_desc',
                ),
                timestamp: Date.now(),
                icon: 'box',
            },
        ]);

        // Initial refresh (which also syncs changelog)
        this.refresh();
        this.startPingInterval();
    }
}
