import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { Amenity } from './models';

@Injectable({ providedIn: 'root' })
export class AmenitiesApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<Amenity[]> {
    return this.http.get<Amenity[]>(`${API_BASE_URL}/amenities/`);
  }
}

