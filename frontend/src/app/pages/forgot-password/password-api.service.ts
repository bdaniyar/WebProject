import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../core/api.config';

@Injectable({ providedIn: 'root' })
export class PasswordApiService {
    private readonly http = inject(HttpClient);

    requestReset(email: string): Observable<{ detail: string }> {
        return this.http.post<{ detail: string }>(`${API_BASE_URL}/auth/password-reset/`, { email });
    }

    confirmReset(token: string, new_password: string): Observable<{ detail: string }> {
        return this.http.post<{ detail: string }>(`${API_BASE_URL}/auth/password-reset/confirm/`, {
            token,
            new_password,
        });
    }
}
