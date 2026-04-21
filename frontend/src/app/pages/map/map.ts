import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, PLATFORM_ID, signal, ViewChild } from '@angular/core';

import { HotelApiService } from '../../core/hotel-api.service';
import { readApiError } from '../../core/error.util';
import { Hotel } from '../../core/models';

type LatLng = { lat: number; lng: number };

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

@Component({
  selector: 'app-map-page',
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class MapPage implements AfterViewInit {
  private readonly api = inject(HotelApiService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly hotels = signal<Hotel[]>([]);
  readonly error = signal('');
  readonly userLocation = signal<LatLng | null>(null);
  readonly radiusKm = signal(10);

  @ViewChild('map', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private leaflet: typeof import('leaflet') | null = null;
  private map: import('leaflet').Map | null = null;
  private markersLayer: import('leaflet').LayerGroup | null = null;
  private userMarker: import('leaflet').Marker | null = null;
  private radiusCircle: import('leaflet').Circle | null = null;

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.leaflet = await import('leaflet');
    this.initMap();
    this.loadHotels();
    this.locateUser();
  }

  setRadius(value: number) {
    this.radiusKm.set(value);
    this.render();
  }

  locateUser() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userLocation.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        this.render(true);
      },
      () => {
        // ignore location errors
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  private initMap() {
    if (!this.leaflet) return;
    const L = this.leaflet;

    // Ensure default marker icons render correctly in bundlers.
    // (Leaflet's defaults expect image assets to be copied as-is.)
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    this.map = L.map(this.mapEl.nativeElement, {
      zoomControl: true,
      center: [43.2389, 76.8897], // default: Almaty
      zoom: 3,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
  }

  private loadHotels() {
    this.error.set('');
    // Pull a full catalog list (with coordinates) and filter client-side by radius.
    this.api.getHotels({}).subscribe({
      next: (hotels) => {
        this.hotels.set(hotels);
        this.render(true);
      },
      error: (e) => this.error.set(readApiError(e)),
    });
  }

  private render(fit = false) {
    if (!this.leaflet) return;
    const L = this.leaflet;
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const user = this.userLocation();
    const radius = this.radiusKm();

    if (user) {
      if (this.userMarker) {
        this.userMarker.setLatLng([user.lat, user.lng]);
      } else {
        this.userMarker = L.marker([user.lat, user.lng]).addTo(this.map);
      }

      const meters = radius * 1000;
      if (this.radiusCircle) {
        this.radiusCircle.setLatLng([user.lat, user.lng]);
        this.radiusCircle.setRadius(meters);
      } else {
        this.radiusCircle = L.circle([user.lat, user.lng], {
          radius: meters,
          color: '#0b5ed7',
          fillColor: '#0b5ed7',
          fillOpacity: 0.08,
          weight: 2,
        }).addTo(this.map);
      }
    }

    const bounds = L.latLngBounds([]);

    for (const h of this.hotels()) {
      if (typeof h.latitude !== 'number' || typeof h.longitude !== 'number') continue;
      const hotelPos = { lat: h.latitude, lng: h.longitude };
      if (user && haversineKm(user, hotelPos) > radius) continue;

      const marker = L.marker([hotelPos.lat, hotelPos.lng]).bindPopup(
        `<strong>${h.name}</strong><br/>${[h.city, h.country].filter(Boolean).join(', ')}`,
      );
      marker.addTo(this.markersLayer);
      bounds.extend([hotelPos.lat, hotelPos.lng]);
    }

    if (fit) {
      if (bounds.isValid()) {
        this.map.fitBounds(bounds.pad(0.2));
      } else if (user) {
        this.map.setView([user.lat, user.lng], 11);
      }
    }
  }
}

