import { Booking } from '../models/booking.model';

// Very small in-memory store for local UI development.
// This resets on page refresh.
class MockDb {
    bookings: Booking[] = [
        {
            id: 1,
            room: 101,
            start_date: '2026-04-10',
            end_date: '2026-04-12',
            user: 1,
        },
    ];

    nextBookingId(): number {
        return this.bookings.length ? Math.max(...this.bookings.map((b) => b.id)) + 1 : 1;
    }
}

export const mockDb = new MockDb();
