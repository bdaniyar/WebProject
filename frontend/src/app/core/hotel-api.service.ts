import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { AvailabilityResponse, Booking, BookingPayload, DashboardData, Hotel, Room } from './models';

@Injectable({ providedIn: 'root' })
export class HotelApiService {
  private readonly http = inject(HttpClient);

  getHotels(featured = false): Observable<Hotel[]> {
    const params = featured ? new HttpParams().set('featured', 'true') : undefined;
    return this.http.get<Hotel[]>(`${API_BASE_URL}/hotels/`, { params });
  }

  getHotel(hotelId: number): Observable<Hotel> {
    return this.http.get<Hotel>(`${API_BASE_URL}/hotels/${hotelId}/`);
  }

  getRooms(city = '', guests?: number, hotelId?: number): Observable<Room[]> {
    let params = new HttpParams();
    if (city) {
      params = params.set('city', city);
    }
    if (guests) {
      params = params.set('guests', guests);
    }
    if (hotelId) {
      params = params.set('hotel_id', hotelId);
    }
    return this.http.get<Room[]>(`${API_BASE_URL}/rooms/`, { params });
  }

  searchAvailability(payload: AvailabilityResponse['filters']): Observable<AvailabilityResponse> {
    return this.http.post<AvailabilityResponse>(`${API_BASE_URL}/availability/`, payload);
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${API_BASE_URL}/dashboard/`);
  }

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API_BASE_URL}/bookings/`);
  }

  createBooking(payload: BookingPayload): Observable<Booking> {
    return this.http.post<Booking>(`${API_BASE_URL}/bookings/`, payload);
  }

  updateBooking(bookingId: number, payload: BookingPayload): Observable<Booking> {
    return this.http.put<Booking>(`${API_BASE_URL}/bookings/${bookingId}/`, payload);
  }

  cancelBooking(bookingId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/bookings/${bookingId}/`);
  }
}
