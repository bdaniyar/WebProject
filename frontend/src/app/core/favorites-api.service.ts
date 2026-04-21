import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { Favorite } from './models';

@Injectable({ providedIn: 'root' })
export class FavoritesApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${API_BASE_URL}/favorites/`);
  }

  add(hotelId: number): Observable<Favorite> {
    return this.http.post<Favorite>(`${API_BASE_URL}/favorites/`, { hotel_id: hotelId });
  }

  remove(hotelId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/favorites/${hotelId}/`);
  }
}

