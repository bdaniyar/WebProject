import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BookingComposerComponent } from '../../core/booking-composer/booking-composer';
import { HotelApiService } from '../../core/hotel-api.service';
import { readApiError } from '../../core/error.util';
import { Hotel } from '../../core/models';

@Component({
    selector: 'app-hotels-page',
    imports: [CommonModule, RouterLink, BookingComposerComponent],
    templateUrl: './hotels.html',
    styleUrl: './hotels.css',
})
export class HotelsPage implements OnInit {
    private readonly api = inject(HotelApiService);

    readonly hotels = signal<Hotel[]>([]);
    readonly loading = signal(false);
    readonly error = signal('');

    ngOnInit() {
        this.loadHotels();
    }

    loadHotels() {
        this.loading.set(true);
        this.error.set('');

        this.api.getHotels(false).subscribe({
            next: (hotels) => this.hotels.set(hotels),
            error: (error) => this.error.set(readApiError(error)),
            complete: () => this.loading.set(false),
        });
    }
}
