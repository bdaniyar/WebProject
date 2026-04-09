import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, map, of } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { USE_MOCK_API } from '../constants/mock.constants';
import { Booking, CreateBookingRequest } from '../models/booking.model';
import { mockDb } from './mock-db';

@Injectable({ providedIn: 'root' })
export class BookingService {
    private readonly http = inject(HttpClient);

    createBooking(payload: CreateBookingRequest) {
        if (USE_MOCK_API) {
            const booking: Booking = {
                id: mockDb.nextBookingId(),
                room: payload.room,
                start_date: payload.start_date,
                end_date: payload.end_date,
                user: 1,
            };
            mockDb.bookings = [booking, ...mockDb.bookings];
            return of(booking).pipe(delay(350));
        }

        return this.http.post<Booking>(`${API_BASE_URL}bookings`, payload);
    }

    getMyBookings() {
        if (USE_MOCK_API) return of(mockDb.bookings).pipe(delay(250));
        return this.http.get<Booking[]>(`${API_BASE_URL}bookings/my`);
    }

    cancelBooking(id: number) {
        if (USE_MOCK_API) {
            mockDb.bookings = mockDb.bookings.filter((b) => b.id !== id);
            return of(void 0).pipe(delay(200));
        }

        return this.http.delete<void>(`${API_BASE_URL}bookings/${id}`);
    }
}
