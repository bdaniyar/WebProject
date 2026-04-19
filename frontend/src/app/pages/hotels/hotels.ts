import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { HotelApiService } from '../../core/hotel-api.service';
import { readApiError } from '../../core/error.util';
import { Hotel, SearchFilters } from '../../core/models';

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

  readonly hotels = signal<Hotel[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  search: SearchFilters = this.createDefaultSearch();

  ngOnInit() {
    this.loadHotels();
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

  private createDefaultSearch(): SearchFilters {
    return {
      city: '',
      country: '',
      guests: 2,
      check_in: addDays(7),
      check_out: addDays(9),
    };
  }
}
