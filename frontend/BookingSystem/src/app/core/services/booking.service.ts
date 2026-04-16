import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from '../constants/api.constants';
import { Booking, CreateBookingRequest } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  createBooking(payload: CreateBookingRequest) {
    return this.http.post<Booking>(`${API_BASE_URL}bookings/`, payload);
  }

  getMyBookings() {
    return this.http.get<Booking[]>(`${API_BASE_URL}bookings/`);
  }

  cancelBooking(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}bookings/${id}/`);
  }
}
