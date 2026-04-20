import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { readApiError } from '../../core/error.util';
import { HotelApiService } from '../../core/hotel-api.service';
import { AvailabilityResponse, Hotel, SearchFilters } from '../../core/models';

function addDays(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-discover-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './discover.html',
  styleUrl: './discover.css',
})
export class DiscoverPage implements OnInit {
  private readonly api = inject(HotelApiService);

  readonly hotels = signal<Hotel[]>([]);
  readonly availability = signal<AvailabilityResponse | null>(null);
  readonly loadingHotels = signal(false);
  readonly searching = signal(false);
  readonly error = signal('');

  search: SearchFilters = {
    city: 'Almaty',
    country: '',
    guests: 2,
    check_in: addDays(6),
    check_out: addDays(8),
  };

  ngOnInit() {
    this.loadFeaturedHotels();
  }

  loadFeaturedHotels() {
    this.loadingHotels.set(true);
    this.error.set('');

    this.api.getHotels({ featured: true }).subscribe({
      next: (hotels) => this.hotels.set(hotels),
      error: (error) => this.error.set(readApiError(error)),
      complete: () => this.loadingHotels.set(false),
    });
  }

  searchRooms() {
    this.searching.set(true);
    this.error.set('');

    this.api.searchAvailability(this.search).subscribe({
      next: (response) => this.availability.set(response),
      error: (error) => this.error.set(readApiError(error)),
      complete: () => this.searching.set(false),
    });
  }
}