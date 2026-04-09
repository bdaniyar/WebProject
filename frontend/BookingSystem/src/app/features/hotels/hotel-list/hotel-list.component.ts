import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Hotel } from '../../../core/models/hotel.model';
import { HttpErrorService } from '../../../core/services/http-error.service';
import { HotelService } from '../../../core/services/hotel.service';

@Component({
    selector: 'app-hotel-list',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './hotel-list.component.html',
    styleUrl: './hotel-list.component.css',
})
export class HotelListComponent {
    private readonly hotelsApi = inject(HotelService);
    private readonly httpError = inject(HttpErrorService);

    hotels: Hotel[] = [];
    filteredHotels: Hotel[] = [];
    loading = false;
    error: string | null = null;
    selectedLocation = '';

    ngOnInit() {
        this.loadHotels();
    }

    loadHotels() {
        this.loading = true;
        this.error = null;

        this.hotelsApi.getHotels().subscribe({
            next: (data) => {
                this.hotels = data;
                this.applyFilters();
                this.loading = false;
            },
            error: (e: any) => {
                this.loading = false;
                this.error = this.httpError.toMessage(e, 'Failed to load hotels.');
            },
        });
    }

    get locations(): string[] {
        return [...new Set(this.hotels.map((hotel) => hotel.location).filter(Boolean))].sort();
    }

    applyFilters() {
        this.filteredHotels = this.hotels.filter((hotel) => {
            return !this.selectedLocation || hotel.location === this.selectedLocation;
        });
    }

    resetFilters() {
        this.selectedLocation = '';
        this.applyFilters();
    }
}
