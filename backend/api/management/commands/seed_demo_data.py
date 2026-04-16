from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from api.models import Amenity, Hotel, Review, Room


class Command(BaseCommand):
    help = 'Seed the project with demo hotels, rooms, users, and reviews.'

    def handle(self, *args, **options):
        amenity_specs = [
            ('Breakfast', 'utensils', 'Dining'),
            ('Spa', 'sparkles', 'Wellness'),
            ('Airport transfer', 'plane', 'Travel'),
            ('Fast Wi-Fi', 'wifi', 'Tech'),
            ('Pool', 'waves', 'Leisure'),
            ('Workspace', 'briefcase', 'Business'),
        ]
        amenities = {}
        for title, icon, category in amenity_specs:
            amenity, _ = Amenity.objects.get_or_create(
                title=title,
                defaults={'icon': icon, 'category': category},
            )
            amenities[title] = amenity

        hotels_data = [
            {
                'name': 'Azure Stay',
                'city': 'Almaty',
                'address': '15 Dostyk Avenue',
                'description': 'Minimal business hotel with skyline views and fast check-in.',
                'hero_image': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
                'featured': True,
                'rooms': [
                    ('City King', 2, '139.00', 4, ['Breakfast', 'Fast Wi-Fi', 'Workspace']),
                    ('Skyline Suite', 3, '219.00', 2, ['Breakfast', 'Spa', 'Fast Wi-Fi']),
                ],
            },
            {
                'name': 'Nomad Harbor',
                'city': 'Astana',
                'address': '7 Mangilik El',
                'description': 'Warm lounge spaces, family rooms, and airport-friendly access.',
                'hero_image': 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80',
                'featured': True,
                'rooms': [
                    ('Family Loft', 4, '189.00', 3, ['Breakfast', 'Pool', 'Airport transfer']),
                    ('Quiet Studio', 2, '119.00', 5, ['Fast Wi-Fi', 'Workspace']),
                ],
            },
            {
                'name': 'Steppe Retreat',
                'city': 'Shymkent',
                'address': '48 Tauke Khan Street',
                'description': 'Resort-style hideaway with wellness amenities and slower evenings.',
                'hero_image': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
                'featured': False,
                'rooms': [
                    ('Garden Deluxe', 2, '149.00', 3, ['Spa', 'Pool', 'Breakfast']),
                    ('Retreat Villa', 5, '279.00', 1, ['Spa', 'Pool', 'Airport transfer']),
                ],
            },
        ]

        for hotel_data in hotels_data:
            rooms_data = hotel_data.pop('rooms')
            hotel, _ = Hotel.objects.update_or_create(
                name=hotel_data['name'],
                defaults=hotel_data,
            )
            for title, capacity, price, total_units, amenity_titles in rooms_data:
                room, _ = Room.objects.update_or_create(
                    hotel=hotel,
                    title=title,
                    defaults={
                        'description': f'{title} at {hotel.name} for {capacity} guests.',
                        'capacity': capacity,
                        'price_per_night': Decimal(price),
                        'total_units': total_units,
                        'image_url': hotel.hero_image,
                        'active': True,
                    },
                )
                room.amenities.set([amenities[name] for name in amenity_titles])

        demo_user, created = User.objects.get_or_create(
            username='demo',
            defaults={
                'first_name': 'Demo',
                'last_name': 'Guest',
                'email': 'demo@example.com',
            },
        )
        if created:
            demo_user.set_password('demo1234')
            demo_user.save()

        reviewer, created = User.objects.get_or_create(
            username='manager',
            defaults={
                'first_name': 'Hotel',
                'last_name': 'Manager',
                'email': 'manager@example.com',
                'is_staff': True,
            },
        )
        if created:
            reviewer.set_password('manager1234')
            reviewer.save()

        first_hotel = Hotel.objects.first()
        if first_hotel and not first_hotel.reviews.exists():
            Review.objects.create(
                author=reviewer,
                hotel=first_hotel,
                rating=5,
                comment='Clean rooms, quick booking flow, and a very smooth front desk experience.',
            )

        self.stdout.write(self.style.SUCCESS('Demo data ready. Login: demo / demo1234'))
