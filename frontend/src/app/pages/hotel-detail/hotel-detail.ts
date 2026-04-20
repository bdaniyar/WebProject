import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { readApiError } from '../../core/error.util';
import { HotelApiService } from '../../core/hotel-api.service';
import { BookingPayload, Hotel, Room } from '../../core/models';
import { CreateReviewPayload, Review, ReviewsApiService } from './reviews-api.service';

@Component({
  selector: 'app-hotel-detail-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hotel-detail.html',
  styleUrl: './hotel-detail.css',
})
export class HotelDetailPage implements OnInit {
  private readonly api = inject(HotelApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly reviewsApi = inject(ReviewsApiService);

  readonly hotel = signal<Hotel | null>(null);
  readonly rooms = signal<Room[]>([]);
  readonly loading = signal(false);
  readonly roomsLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly reviews = signal<Review[]>([]);
  readonly reviewsBusy = signal(false);
  readonly reviewError = signal('');
  readonly reviewSuccess = signal('');

  reviewForm: CreateReviewPayload = {
    hotel: 0,
    rating: 5,
    comment: '',
  };

  readonly hotelId = computed(() => Number(this.route.snapshot.paramMap.get('id')) || 0);

  bookingForm: BookingPayload = {
    room_id: null,
    check_in: new Date().toISOString().slice(0, 10),
    check_out: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    guests: 2,
    special_request: '',
  };

  ngOnInit() {
    const id = this.hotelId();
    if (!id) {
      this.error.set('Invalid hotel id.');
      return;
    }

    this.syncBookingFormFromQuery();
    this.reviewForm.hotel = id;

    this.loadHotel(id);
    this.loadRooms(id);
    this.loadReviews(id);
  }

  loadHotel(id: number) {
    this.loading.set(true);
    this.error.set('');

    this.api.getHotel(id).subscribe({
      next: (hotel) => this.hotel.set(hotel),
      error: (error) => this.error.set(readApiError(error)),
      complete: () => this.loading.set(false),
    });
  }

  loadRooms(id: number) {
    this.roomsLoading.set(true);

    this.api
      .getRooms('', this.bookingForm.guests, id, this.bookingForm.check_in, this.bookingForm.check_out)
      .subscribe({
        next: (rooms) => this.rooms.set(rooms),
        error: (error) => this.error.set(readApiError(error)),
        complete: () => this.roomsLoading.set(false),
      });
  }

  loadReviews(hotelId: number) {
    this.reviewsBusy.set(true);
    this.reviewError.set('');
    this.reviewSuccess.set('');

    this.reviewsApi.list(hotelId).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: (error) => this.reviewError.set(readApiError(error)),
      complete: () => this.reviewsBusy.set(false),
    });
  }

  submitReview() {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.reviewsBusy.set(true);
    this.reviewError.set('');
    this.reviewSuccess.set('');

    this.reviewsApi.create(this.reviewForm).subscribe({
      next: () => {
        this.reviewSuccess.set('Review submitted. Thank you!');
        this.reviewForm = { hotel: this.hotelId(), rating: 5, comment: '' };
        this.loadReviews(this.hotelId());
      },
      error: (error) => this.reviewError.set(readApiError(error)),
      complete: () => this.reviewsBusy.set(false),
    });
  }

  bookNow(roomId: number) {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    this.api
      .createBooking({
        ...this.bookingForm,
        room_id: roomId,
      })
      .subscribe({
        next: () => {
          this.success.set('Booking created. Availability updated.');
          this.loadRooms(this.hotelId());
        },
        error: (error) => this.error.set(readApiError(error)),
        complete: () => this.saving.set(false),
      });
  }

  updateStay() {
    this.success.set('');
    this.error.set('');
    this.loadRooms(this.hotelId());
  }

  stayNights() {
    const checkIn = new Date(this.bookingForm.check_in);
    const checkOut = new Date(this.bookingForm.check_out);
    const diff = checkOut.getTime() - checkIn.getTime();

    if (Number.isNaN(diff) || diff <= 0) {
      return 0;
    }

    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  estimatedPrice(room: Room) {
    return room.price_per_night * this.stayNights();
  }

  hotelLocation(hotel: Hotel) {
    return [hotel.city, hotel.country].filter(Boolean).join(', ');
  }

  private syncBookingFormFromQuery() {
    const params = this.route.snapshot.queryParamMap;
    const guests = Number(params.get('guests'));

    this.bookingForm = {
      ...this.bookingForm,
      check_in: params.get('check_in') || this.bookingForm.check_in,
      check_out: params.get('check_out') || this.bookingForm.check_out,
      guests: Number.isFinite(guests) && guests > 0 ? guests : this.bookingForm.guests,
    };
  }
}