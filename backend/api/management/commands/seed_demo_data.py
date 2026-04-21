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
