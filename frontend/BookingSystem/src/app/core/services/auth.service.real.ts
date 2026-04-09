import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';
import { LoginResponse } from '../models/user.model';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly tokenService = inject(TokenService);
    private readonly router = inject(Router);

    readonly isLoggedIn = signal<boolean>(this.tokenService.isLoggedIn());

    login(email: string, password: string) {
        return this.http
            .post<LoginResponse>(`${API_BASE_URL}login`, { email, password })
            .pipe(
                tap((res) => {
                    if (res?.access) {
                        this.tokenService.setAccessToken(res.access);
                        this.isLoggedIn.set(true);
                    }
                }),
                map((res) => ({ ok: true as const, data: res })),
                catchError((err) => of({ ok: false as const, error: this.extractError(err) })),
            );
    }

    logout(): void {
        this.tokenService.clear();
        this.isLoggedIn.set(false);
        void this.router.navigate(['/login']);
    }

    private extractError(err: unknown): string {
        const anyErr = err as any;
        return (
            anyErr?.error?.detail ||
            anyErr?.error?.message ||
            anyErr?.message ||
            'Request failed. Please try again.'
        );
    }
}
