export interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Amenity {
  id: number;
  title: string;
  icon: string;
  category: string;
}

export interface RoomPreview {
  id: number;
  hotel_name: string;
  title: string;
  capacity: number;
  price_per_night: number;
  total_units: number;
  image_url: string;
  amenities: Amenity[];
  available_units: number;
}

export interface Hotel {
  id: number;
  name: string;
  country: string;
  city: string;
  address: string;
  description: string;
  hero_image: string;
  rating: number;
  latitude?: number | null;
  longitude?: number | null;
  featured: boolean;
  room_count: number;
  starting_price: number | null;
  rooms: RoomPreview[];
}

export interface Room {
  id: number;
  hotel: {
    id: number;
    name: string;
    city: string;
    country: string;
    rating: number;
    featured: boolean;
  };
  title: string;
  description: string;
  capacity: number;
  price_per_night: number;
  total_units: number;
  image_url: string;
  active: boolean;
  amenities: Amenity[];
  available_units: number;
}

export interface Booking {
  id: number;
  room: Room;
  check_in: string;
  check_out: string;
  guests: number;
  special_request: string;
  status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  user: UserProfile;
  active_bookings: number;
  total_spent: number;
  upcoming_check_in: string | null;
  bookings: Booking[];
  recommended_rooms: Room[];
}

export interface SearchFilters {
  city: string;
  country: string;
  guests: number;
  check_in: string;
  check_out: string;
  hotel_id?: number;
  min_rating?: number;
  price_min?: number;
  price_max?: number;
  amenity_ids?: number[];
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | '';
}

export interface HotelSearchFilters {
  city?: string;
  country?: string;
  guests?: number;
  check_in?: string;
  check_out?: string;
  featured?: boolean;
  min_rating?: number;
  price_min?: number;
  price_max?: number;
  amenity_ids?: number[];
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | '';
}

export interface HotelPreview {
  id: number;
  name: string;
  city: string;
  country: string;
  rating: number;
  featured: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface Favorite {
  id: number;
  hotel: HotelPreview;
  created_at: string;
}

export interface AvailabilityResponse {
  filters: SearchFilters;
  matches: number;
  rooms: Room[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: UserProfile;
}

export interface BookingPayload {
  room_id: number | null;
  check_in: string;
  check_out: string;
  guests: number;
  special_request: string;
}
