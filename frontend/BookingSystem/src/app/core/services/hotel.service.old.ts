import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';
import { Hotel } from '../models/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelService {
  private readonly http = inject(HttpClient);

  getHotels() {
    return this.http.get<Hotel[]>(`${API_BASE_URL}hotels`).pipe(
      catchError((err) => of(this.throwFriendly<Hotel[]>(err))),
    );
  }

  getHotel(id: number) {
    return this.http.get<Hotel>(`${API_BASE_URL}hotels/${id}`).pipe(
      catchError((err) => of(this.throwFriendly<Hotel>(err))),
    );
  }

  // helper: make TypeScript happy but keep runtime behavior consistent
  private throwFriendly<T>(err: any): T {
    throw new Error(err?.error?.detail || 'Failed to load data.');
  }
}
