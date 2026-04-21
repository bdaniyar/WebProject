import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../core/api.config';
import { UserProfile } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
    private readonly http = inject(HttpClient);

    getMe(): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${API_BASE_URL}/user/me/`);
    }

    updateMe(payload: Partial<UserProfile>): Observable<UserProfile> {
        return this.http.put<UserProfile>(`${API_BASE_URL}/user/me/`, payload);
    }

    changePassword(payload: { old_password: string; new_password: string }): Observable<void> {
        return this.http.post<void>(`${API_BASE_URL}/user/change-password/`, payload);
    }
}
