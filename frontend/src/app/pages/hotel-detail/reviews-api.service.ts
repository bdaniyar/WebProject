import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../core/api.config';

export type Review = {
    id: number;
    hotel: number;
    author_name: string;
    rating: number;
    comment: string;
    created_at: string;
};

export type CreateReviewPayload = {
    hotel: number;
    rating: number;
    comment: string;
};

@Injectable({ providedIn: 'root' })
export class ReviewsApiService {
    private readonly http = inject(HttpClient);

    list(hotelId: number): Observable<Review[]> {
        const params = new HttpParams().set('hotel_id', hotelId);
        return this.http.get<Review[]>(`${API_BASE_URL}/reviews/`, { params });
    }

    create(payload: CreateReviewPayload): Observable<Review> {
        return this.http.post<Review>(`${API_BASE_URL}/reviews/`, payload);
    }
}