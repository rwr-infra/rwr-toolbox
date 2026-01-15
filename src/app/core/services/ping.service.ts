import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SettingsService } from './settings.service';

/**
 * Ping result
 */
export interface PingResult {
    /** Server address (address:port) */
    address: string;
    /** Ping time in milliseconds, or null if failed */
    ping: number | null;
    /** Error message if failed */
    error?: string;
}

/**
 * Server to ping
 */
export interface ServerToPing {
    /** Server address */
    address: string;
    /** Server port */
    port: number;
}

/**
 * Ping service using Tauri native commands
 * For web mode, returns mock data
 */
@Injectable({
    providedIn: 'root',
})
export class PingService {
    private settingsService = inject(SettingsService);

    private pingingSubject = new BehaviorSubject<boolean>(false);
    /** Pinging state observable */
    readonly pinging$ = this.pingingSubject.asObservable();

    /**
     * Check if running in Tauri environment
     */
    private isTauri(): boolean {
        return typeof window !== 'undefined' && '__TAURI__' in window;
    }

    /**
     * Ping a single server
     * @param address Server address
     * @param port Server port
     * @returns Observable of ping result
     */
    pingServer(address: string, port: number): Observable<PingResult> {
        this.pingingSubject.next(true);

        if (this.isTauri()) {
            // Use Tauri command
            return this.pingServerTauri(address, port);
        } else {
            // Mock ping for web mode
            return this.pingServerMock(address, port);
        }
    }

    /**
     * Ping using Tauri command
     */
    private pingServerTauri(
        address: string,
        port: number,
    ): Observable<PingResult> {
        // Dynamic import to avoid errors in web mode
        return from(
            import('@tauri-apps/api/core').then(({ invoke }) => {
                return invoke<number>('ping_server', {
                    address,
                    port,
                    timeout: this.settingsService.settings().pingTimeout,
                });
            }),
        ).pipe(
            map((ping) => ({ address: `${address}:${port}`, ping })),
            catchError((error) => {
                this.pingingSubject.next(false);
                return of({
                    address: `${address}:${port}`,
                    ping: null,
                    error: error.toString(),
                });
            }),
        );
    }

    /**
     * Mock ping for web mode
     */
    private pingServerMock(
        address: string,
        port: number,
    ): Observable<PingResult> {
        return of({
            address: `${address}:${port}`,
            ping: Math.floor(Math.random() * 200) + 20,
        }).pipe(
            map((result) => {
                this.pingingSubject.next(false);
                return result;
            }),
        );
    }

    /**
     * Batch ping multiple servers
     * @param servers Array of servers to ping
     * @returns Observable of ping results array
     */
    pingServers(servers: ServerToPing[]): Observable<PingResult[]> {
        this.pingingSubject.next(true);

        if (this.isTauri()) {
            return this.pingServersTauri(servers);
        } else {
            return this.pingServersMock(servers);
        }
    }

    /**
     * Batch ping using Tauri
     */
    private pingServersTauri(
        servers: ServerToPing[],
    ): Observable<PingResult[]> {
        const promises = servers.map((server) => {
            return this.pingServerTauri(
                server.address,
                server.port,
            ).toPromise();
        });

        return from(Promise.all(promises)).pipe(
            map((results) => {
                this.pingingSubject.next(false);
                return results as PingResult[];
            }),
        );
    }

    /**
     * Batch mock ping for web mode
     */
    private pingServersMock(servers: ServerToPing[]): Observable<PingResult[]> {
        const results = servers.map((server) => ({
            address: `${server.address}:${server.port}`,
            ping: Math.floor(Math.random() * 200) + 20,
        }));

        return of(results).pipe(
            map((results) => {
                this.pingingSubject.next(false);
                return results;
            }),
        );
    }
}
