import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AmenitiesApiService } from '../../core/amenities-api.service';
import { FavoritesService } from '../../core/favorites.service';
import { HotelApiService } from '../../core/hotel-api.service';
import { readApiError } from '../../core/error.util';
import { Amenity, Hotel, SearchFilters } from '../../core/models';

function addDays(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-hotels-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hotels.html',
  styleUrl: './hotels.css',
})
export class HotelsPage implements OnInit {
  private readonly api = inject(HotelApiService);
  private readonly favorites = inject(FavoritesService);
  private readonly amenitiesApi = inject(AmenitiesApiService);

  readonly hotels = signal<Hotel[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly amenities = signal<Amenity[]>([]);

  search: SearchFilters = this.createDefaultSearch();

  ngOnInit() {
    this.loadHotels();
    void this.favorites.refresh().subscribe();
    this.loadAmenities();
  }

  loadAmenities() {
    this.amenitiesApi.list().subscribe({
      next: (items) => this.amenities.set(items),
      error: () => this.amenities.set([]),
    });
  }

  loadHotels() {
    this.loading.set(true);
    this.error.set('');

    this.api
      .getHotels(this.search)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (hotels) => this.hotels.set(hotels),
        error: (error) => this.error.set(readApiError(error)),
      });
  }

  resetSearch() {
    this.search = this.createDefaultSearch();
    this.loadHotels();
  }

  detailQueryParams() {
    const params: Record<string, string | number> = {
      guests: this.search.guests,
      check_in: this.search.check_in,
      check_out: this.search.check_out,
    };

    if (this.search.city.trim()) {
      params['city'] = this.search.city.trim();
    }
    if (this.search.country.trim()) {
      params['country'] = this.search.country.trim();
    }

    return params;
  }

  hotelLocation(hotel: Hotel) {
    return [hotel.city, hotel.country].filter(Boolean).join(', ');
  }

  isFavorite(hotel: Hotel) {
    return this.favorites.isFavorite(hotel.id);
  }

  toggleFavorite(hotel: Hotel) {
    void this.favorites.toggle(hotel.id).subscribe();
  }

  toggleAmenity(amenityId: number) {
    const current = new Set(this.search.amenity_ids || []);
    if (current.has(amenityId)) {
      current.delete(amenityId);
    } else {
      current.add(amenityId);
    }
    this.search = { ...this.search, amenity_ids: Array.from(current) };
  }

  private createDefaultSearch(): SearchFilters {
    return {
      city: '',
      country: '',
      guests: 2,
      check_in: addDays(7),
      check_out: addDays(9),
      min_rating: 0,
      price_min: undefined,
      price_max: undefined,
      amenity_ids: [],
      sort: '',
    };
  }
}
