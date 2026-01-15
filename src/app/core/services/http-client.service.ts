import { Injectable, inject } from '@angular/core';
import {
    HttpHeaders,
    HttpParams,
    HttpErrorResponse,
} from '@angular/common/http';
import { invoke } from '@tauri-apps/api/core';
import { Observable, throwError, timer, from } from 'rxjs';
import {
    timeout,
    retryWhen,
    delayWhen,
    scan,
    catchError,
} from 'rxjs/operators';

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
    /** Request timeout in milliseconds (default: 10000) */
    timeout?: number;
    /** Number of retries (default: 2) */
    retries?: number;
    /** Custom headers */
    headers?: HttpHeaders;
    /** Query parameters */
    params?: HttpParams;
    /** Add cache buster parameter (default: true) */
    withCacheBuster?: boolean;
    /** Response type hint (default: json) */
    responseType?: 'json' | 'text';
}

/**
 * HTTP client service with timeout, retry, and cache buster support
 */
@Injectable({
    providedIn: 'root',
})
export class HttpClientService {
    private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
    private readonly DEFAULT_RETRIES = 2;

    /**
     * Tauri HTTP client wrapper to bypass browser CORS in desktop builds.
     */
    private async getViaTauri<T>(
        url: string,
        timeoutMs: number,
        responseType: 'json' | 'text',
    ): Promise<T> {
        const payload = await invoke<string>('proxy_fetch', {
            url,
            timeoutMs,
        });
        if (responseType === 'text') {
            return payload as unknown as T;
        }
        return JSON.parse(payload) as T;
    }

    /**
     * Perform GET request with timeout and retry logic
     * @param url The URL to fetch
     * @param options Request options
     * @returns Observable of the response
     */
    get<T>(url: string, options: HttpRequestOptions = {}): Observable<T> {
        const {
            timeout: timeoutMs = this.DEFAULT_TIMEOUT,
            retries = this.DEFAULT_RETRIES,
            headers,
            params,
            withCacheBuster = true,
            responseType = 'json',
        } = options;

        // Add cache buster parameter
        let httpParams = params || new HttpParams();
        if (withCacheBuster) {
            httpParams = httpParams.set('_t', Date.now().toString());
        }

        const finalUrl = httpParams.keys().length
            ? `${url}?${httpParams.toString()}`
            : url;
        console.log('GET finalUrl:', finalUrl);

        // Always use Tauri HTTP to avoid browser CORS
        const request$: Observable<T> = from(
            this.getViaTauri<T>(finalUrl, timeoutMs, responseType),
        );

        return request$.pipe(
            timeout(timeoutMs),
            retryWhen((errors) =>
                errors.pipe(
                    scan((errorCount, error) => {
                        if (errorCount >= retries) {
                            throw error;
                        }
                        // Don't retry on 4xx errors
                        if (
                            error instanceof HttpErrorResponse &&
                            error.status >= 400 &&
                            error.status < 500
                        ) {
                            throw error;
                        }
                        return errorCount + 1;
                    }, 0),
                    delayWhen(() => timer(1000)), // Wait 1s before retry
                ),
            ),
            catchError(this.handleError),
        );
    }

    /**
     * Handle HTTP errors
     * @param error The error to handle
     * @returns Observable that throws the error
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        const isHttpError = error instanceof HttpErrorResponse;
        const errorMessage = isHttpError
            ? `Server error: ${error.status} - ${error.statusText}`
            : 'An unknown error occurred';

        console.error('HTTP error:', errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
