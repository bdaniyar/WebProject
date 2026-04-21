import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';
import {
  AvailabilityResponse,
  Booking,
  BookingPayload,
  DashboardData,
  Hotel,
  HotelSearchFilters,
  Room,
} from './models';

@Injectable({ providedIn: 'root' })
export class HotelApiService {
  private readonly http = inject(HttpClient);

  getHotels(filters: HotelSearchFilters = {}): Observable<Hotel[]> {
    let params = new HttpParams();
    if (filters.featured) {
      params = params.set('featured', 'true');
    }
    if (filters.city) {
      params = params.set('city', filters.city);
    }
    if (filters.country) {
      params = params.set('country', filters.country);
    }
    if (filters.guests) {
      params = params.set('guests', filters.guests);
    }
    if (filters.check_in) {
      params = params.set('check_in', filters.check_in);
    }
    if (filters.check_out) {
      params = params.set('check_out', filters.check_out);
    }
    if (typeof filters.min_rating === 'number') {
      params = params.set('min_rating', String(filters.min_rating));
    }
    if (typeof filters.price_min === 'number') {
      params = params.set('price_min', String(filters.price_min));
    }
    if (typeof filters.price_max === 'number') {
      params = params.set('price_max', String(filters.price_max));
    }
    if (filters.amenity_ids?.length) {
      params = params.set('amenity_ids', filters.amenity_ids.join(','));
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    return this.http.get<Hotel[]>(`${API_BASE_URL}/hotels/`, { params });
  }

  getHotel(hotelId: number): Observable<Hotel> {
    return this.http.get<Hotel>(`${API_BASE_URL}/hotels/${hotelId}/`);
  }

  getRooms(
    city = '',
    guests?: number,
    hotelId?: number,
    checkIn?: string,
    checkOut?: string,
  ): Observable<Room[]> {
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
    if (checkIn) {
      params = params.set('check_in', checkIn);
    }
    if (checkOut) {
      params = params.set('check_out', checkOut);
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
