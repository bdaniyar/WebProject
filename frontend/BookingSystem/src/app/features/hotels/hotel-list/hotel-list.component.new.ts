import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Hotel } from '../../../core/models/hotel.model';
import { HttpErrorService } from '../../../core/services/http-error.service';
import { HotelService } from '../../../core/services/hotel.service';

@Component({
    selector: 'app-hotel-list',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './hotel-list.component.html',
    styleUrl: './hotel-list.component.css',
})
export class HotelListComponent {
    private readonly hotelsApi = inject(HotelService);
    private readonly httpError = inject(HttpErrorService);

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
            error: (e: any) => {
                this.loading = false;
                this.error = this.httpError.toMessage(e, 'Failed to load hotels.');
            },
        });
    }
}
