from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from api.demo_hotels_catalog import HOTELS_DATA
from api.models import Amenity, Hotel, Review, Room


class Command(BaseCommand):
    help = "Seed the project with demo hotels, rooms, users, and reviews."

    def handle(self, *args, **options):
        amenity_specs = [
            ("Breakfast", "utensils", "Dining"),
            ("Spa", "sparkles", "Wellness"),
            ("Airport transfer", "plane", "Travel"),
            ("Fast Wi-Fi", "wifi", "Tech"),
            ("Pool", "waves", "Leisure"),
            ("Workspace", "briefcase", "Business"),
        ]
        amenities = {}
        for title, icon, category in amenity_specs:
            amenity, _ = Amenity.objects.get_or_create(
                title=title,
                defaults={"icon": icon, "category": category},
            )
            amenities[title] = amenity

        for hotel_data in HOTELS_DATA:
            rooms_data = hotel_data["rooms"]
            hotel_defaults = {
                key: value for key, value in hotel_data.items() if key != "rooms"
            }

            coords_by_city = {
                "London": (51.5072, -0.1276),
                "Almaty": (43.2389, 76.8897),
                "Singapore": (1.3521, 103.8198),
                "Dubai": (25.2048, 55.2708),
                "Paris": (48.8566, 2.3522),
                "Tokyo": (35.6762, 139.6503),
                "New York": (40.7128, -74.0060),
                "Bali": (-8.3405, 115.0920),
                "Barcelona": (41.3874, 2.1686),
                "Seoul": (37.5665, 126.9780),
                "Sydney": (-33.8688, 151.2093),
                "Bangkok": (13.7563, 100.5018),
                "Berlin": (52.5200, 13.4050),
                "Banff": (51.1784, -115.5708),
            }
            city_coords = coords_by_city.get(hotel_data.get("city") or "")
            if city_coords:
                hotel_defaults.setdefault("latitude", city_coords[0])
                hotel_defaults.setdefault("longitude", city_coords[1])

            hotel, _ = Hotel.objects.update_or_create(
                name=hotel_data["name"],
                defaults=hotel_defaults,
            )
            room_titles = [room["title"] for room in rooms_data]
            hotel.rooms.exclude(title__in=room_titles).delete()
            for room_data in rooms_data:
                room, _ = Room.objects.update_or_create(
                    hotel=hotel,
                    title=room_data["title"],
                    defaults={
                        "description": room_data.get("description")
                        or f"{room_data['title']} at {hotel.name} for {room_data['capacity']} guests.",
                        "capacity": room_data["capacity"],
                        "price_per_night": Decimal(room_data["price"]),
                        "total_units": room_data["total_units"],
                        "image_url": room_data.get("image_url") or hotel.hero_image,
                        "active": True,
                    },
                )
                room.amenities.set([amenities[name] for name in room_data["amenities"]])

        demo_user, created = User.objects.get_or_create(
            username="demo",
            defaults={
                "first_name": "Demo",
                "last_name": "Guest",
                "email": "demo@example.com",
            },
        )
        if created:
            demo_user.set_password("demo1234")
            demo_user.save()

        reviewer, created = User.objects.get_or_create(
            username="manager",
            defaults={
                "first_name": "Hotel",
                "last_name": "Manager",
                "email": "manager@example.com",
                "is_staff": True,
            },
        )
        if created:
            reviewer.set_password("manager1234")
            reviewer.save()

        first_hotel = Hotel.objects.first()
        if first_hotel and not first_hotel.reviews.exists():
            Review.objects.create(
                author=reviewer,
                hotel=first_hotel,
                rating=5,
                comment="Clean rooms, quick booking flow, and a very smooth front desk experience.",
            )

        total_rooms = sum(len(hotel["rooms"]) for hotel in HOTELS_DATA)
        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data ready. Hotels: {len(HOTELS_DATA)}, rooms: {total_rooms}. Login: demo / demo1234"
            )
        )
