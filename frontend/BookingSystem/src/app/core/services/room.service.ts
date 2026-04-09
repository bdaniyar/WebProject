import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { delay, of } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { USE_MOCK_API } from '../constants/mock.constants';
import { Room } from '../models/room.model';

const MOCK_ROOMS: Room[] = [
  { id: 101, hotel: 1, price: 18000, capacity: 2 },
  { id: 102, hotel: 1, price: 26000, capacity: 3 },
  { id: 201, hotel: 2, price: 42000, capacity: 2 },
  { id: 202, hotel: 2, price: 65000, capacity: 4 },
  { id: 301, hotel: 3, price: 22000, capacity: 1 },
];

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);

  getRoomsByHotel(hotelId: number) {
    if (USE_MOCK_API) {
      return of(MOCK_ROOMS.filter((r) => r.hotel === hotelId)).pipe(delay(250));
    }

    const params = new HttpParams().set('hotel_id', String(hotelId));
    return this.http.get<Room[]>(`${API_BASE_URL}rooms`, { params });
  }
}
