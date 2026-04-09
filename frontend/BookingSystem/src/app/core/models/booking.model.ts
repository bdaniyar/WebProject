export interface Booking {
    id: number;
    room: number; // room id
    start_date: string; // ISO date
    end_date: string; // ISO date
    user: number; // user id
}

export interface CreateBookingRequest {
    room: number;
    start_date: string;
    end_date: string;
}
