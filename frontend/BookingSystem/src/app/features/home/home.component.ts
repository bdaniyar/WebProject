import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface FeaturedHotel {
  id: number;
  name: string;
  location: string;
  price: number;
  description: string;
  tag: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  location = '';
  checkIn = '';
  checkOut = '';

  readonly featuredHotels: FeaturedHotel[] = [
    { id: 1, name: 'Central City Hotel', location: 'Almaty', price: 18000, description: 'Stylish rooms in the city center with skyline views.', tag: 'Popular' },
    { id: 2, name: 'Mountain View Resort', location: 'Shymbulak', price: 42000, description: 'Cozy mountain retreat with spa and breakfast.', tag: 'Nature' },
    { id: 3, name: 'Seaside Escape', location: 'Aktau', price: 35000, description: 'Oceanfront stay for relaxing weekends and sunsets.', tag: 'Beach' },
    { id: 4, name: 'Airport Business Inn', location: 'Astana', price: 22000, description: 'Business-friendly rooms close to airport transit.', tag: 'Business' },
    { id: 5, name: 'Old Town Boutique', location: 'Turkistan', price: 26000, description: 'Boutique ambience in a charming historic district.', tag: 'Boutique' },
    { id: 6, name: 'Lake Breeze Hotel', location: 'Burabay', price: 30000, description: 'Quiet lakeside getaway with scenic trails nearby.', tag: 'Relax' },
  ];

  readonly features = [
    { icon: '🏨', title: 'Curated Hotels', text: 'Only quality stays with verified reviews and details.' },
    { icon: '💳', title: 'Secure Booking', text: 'Fast checkout flow and reliable reservation process.' },
    { icon: '⚡', title: 'Instant Support', text: 'Friendly support and quick response for each trip.' },
    { icon: '🎯', title: 'Best Value', text: 'Great options across budgets, from classic to premium.' },
  ];

  constructor(private readonly router: Router) {}

  exploreHotels(): void {
    void this.router.navigate(['/hotels']);
  }
}
