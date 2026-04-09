import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from '../constants/api.constants';
import { Hotel } from '../models/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelService {
    private readonly http = inject(HttpClient);

    getHotels() {
        return this.http.get<Hotel[]>(`${API_BASE_URL}hotels`);
    }

    getHotel(id: number) {
        return this.http.get<Hotel>(`${API_BASE_URL}hotels/${id}`);
    }
}
