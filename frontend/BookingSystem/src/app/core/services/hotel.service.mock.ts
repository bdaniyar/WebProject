import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, of } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { USE_MOCK_API } from '../constants/mock.constants';
import { Hotel } from '../models/hotel.model';

const MOCK_HOTELS: Hotel[] = [
    {
        id: 1,
        name: 'Central City Hotel',
        location: 'Almaty',
        description: 'Comfortable rooms with city views and fast check-in.',
    },
    {
        id: 2,
        name: 'Mountain View Resort',
        location: 'Shymbulak',
        description: 'Resort near the mountains with spa and breakfast included.',
    },
    {
        id: 3,
        name: 'Airport Business Inn',
        location: 'Astana',
        description: 'Convenient stay for business trips close to the airport.',
    },
];

@Injectable({ providedIn: 'root' })
export class HotelService {
    private readonly http = inject(HttpClient);

    getHotels() {
        if (USE_MOCK_API) return of(MOCK_HOTELS).pipe(delay(350));
        return this.http.get<Hotel[]>(`${API_BASE_URL}hotels`);
    }

    getHotel(id: number) {
        if (USE_MOCK_API) {
            const found = MOCK_HOTELS.find((h) => h.id === id);
            return of(found as Hotel).pipe(delay(250));
        }
        return this.http.get<Hotel>(`${API_BASE_URL}hotels/${id}`);
    }
}
