import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '../constants/api.constants';
import { Room } from '../models/room.model';

@Injectable({ providedIn: 'root' })
export class RoomService {
    private readonly http = inject(HttpClient);

    getRoomsByHotel(hotelId: number) {
        const params = new HttpParams().set('hotel_id', String(hotelId));
        return this.http.get<Room[]>(`${API_BASE_URL}rooms/`, { params });
    }
}
