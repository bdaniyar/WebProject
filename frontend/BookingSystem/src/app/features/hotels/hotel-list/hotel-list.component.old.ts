import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HotelService } from '../../../core/services/hotel.service';
import { Hotel } from '../../../core/models/hotel.model';

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hotel-list.component.html',
  styleUrl: './hotel-list.component.css',
})
export class HotelListComponent {
  private readonly hotelsApi = inject(HotelService);

  hotels: Hotel[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.loadHotels();
  }

  loadHotels() {
    this.loading = true;
    this.error = null;

    this.hotelsApi.getHotels().subscribe({
      next: (data) => {
        this.hotels = data;
        this.loading = false;
      },
      error: (e: Error) => {
        this.loading = false;
        this.error = e.message || 'Failed to load hotels.';
      },
    });
  }
}
