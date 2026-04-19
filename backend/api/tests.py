from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from api.models import Booking, Hotel, Room


class CatalogFiltersTests(APITestCase):
    def setUp(self):
        self.hotel = Hotel.objects.create(
            name="Azure Stay",
            city="Almaty",
            country="Kazakhstan",
            address="15 Dostyk Avenue",
            description="Minimal business hotel with skyline views and fast check-in.",
            hero_image="https://example.com/hotel.jpg",
            featured=True,
        )
        self.room = Room.objects.create(
            hotel=self.hotel,
            title="City King",
            description="Comfortable room for city stays.",
            capacity=2,
            price_per_night=Decimal("139.00"),
            total_units=4,
            image_url="https://example.com/room.jpg",
            active=True,
        )
        self.check_in = timezone.localdate() + timedelta(days=7)
        self.check_out = self.check_in + timedelta(days=2)

    def test_hotel_list_accepts_dates_without_hotel_id(self):
        response = self.client.get(
            reverse("hotel-list"),
            {
                "city": "Almaty",
                "guests": 2,
                "check_in": self.check_in.isoformat(),
                "check_out": self.check_out.isoformat(),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.hotel.id)

    def test_room_list_accepts_dates_without_hotel_id(self):
        response = self.client.get(
            reverse("room-list"),
            {
                "city": "Almaty",
                "guests": 2,
                "check_in": self.check_in.isoformat(),
                "check_out": self.check_out.isoformat(),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.room.id)


class DashboardBookingsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="guest", password="pass12345")
        self.client.force_authenticate(user=self.user)

        hotel = Hotel.objects.create(
            name="Nomad Harbor",
            city="Astana",
            country="Kazakhstan",
            address="7 Mangilik El",
            description="Warm lounge spaces and airport-friendly access.",
            hero_image="https://example.com/hotel.jpg",
            featured=True,
        )
        self.room = Room.objects.create(
            hotel=hotel,
            title="Quiet Studio",
            description="Quiet room near the city center.",
            capacity=2,
            price_per_night=Decimal("119.00"),
            total_units=5,
            image_url="https://example.com/room.jpg",
            active=True,
        )

    def test_dashboard_returns_latest_bookings_first_and_keeps_upcoming_check_in(self):
        today = timezone.localdate()
        older_confirmed = Booking.objects.create(
            guest=self.user,
            room=self.room,
            check_in=today + timedelta(days=12),
            check_out=today + timedelta(days=14),
            guests=2,
            total_price=Decimal("238.00"),
            status=Booking.Status.CONFIRMED,
        )
        newer_cancelled = Booking.objects.create(
            guest=self.user,
            room=self.room,
            check_in=today + timedelta(days=3),
            check_out=today + timedelta(days=5),
            guests=2,
            total_price=Decimal("238.00"),
            status=Booking.Status.CANCELLED,
        )
        middle_confirmed = Booking.objects.create(
            guest=self.user,
            room=self.room,
            check_in=today + timedelta(days=6),
            check_out=today + timedelta(days=8),
            guests=2,
            total_price=Decimal("238.00"),
            status=Booking.Status.CONFIRMED,
        )

        now = timezone.now()
        Booking.objects.filter(pk=older_confirmed.pk).update(
            created_at=now - timedelta(days=3)
        )
        Booking.objects.filter(pk=middle_confirmed.pk).update(
            created_at=now - timedelta(days=2)
        )
        Booking.objects.filter(pk=newer_cancelled.pk).update(
            created_at=now - timedelta(days=1)
        )

        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [booking["id"] for booking in response.data["bookings"]],
            [newer_cancelled.id, middle_confirmed.id, older_confirmed.id],
        )
        self.assertEqual(
            response.data["upcoming_check_in"],
            middle_confirmed.check_in.isoformat(),
        )

    def test_dashboard_marks_finished_confirmed_booking_as_completed(self):
        today = timezone.localdate()
        finished_booking = Booking.objects.create(
            guest=self.user,
            room=self.room,
            check_in=today - timedelta(days=5),
            check_out=today - timedelta(days=2),
            guests=2,
            total_price=Decimal("238.00"),
            status=Booking.Status.CONFIRMED,
        )
        future_booking = Booking.objects.create(
            guest=self.user,
            room=self.room,
            check_in=today + timedelta(days=4),
            check_out=today + timedelta(days=6),
            guests=2,
            total_price=Decimal("238.00"),
            status=Booking.Status.CONFIRMED,
        )

        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 200)
        finished_booking.refresh_from_db()
        self.assertEqual(finished_booking.status, Booking.Status.COMPLETED)
        self.assertEqual(response.data["active_bookings"], 1)
        self.assertEqual(
            response.data["upcoming_check_in"],
            future_booking.check_in.isoformat(),
        )
        self.assertEqual(response.data["bookings"][0]["status"], Booking.Status.CONFIRMED)
        self.assertEqual(response.data["bookings"][1]["status"], Booking.Status.COMPLETED)

    def test_completed_booking_cannot_be_cancelled(self):
        today = timezone.localdate()
        completed_booking = Booking.objects.create(
            guest=self.user,
            room=self.room,
            check_in=today - timedelta(days=4),
            check_out=today - timedelta(days=1),
            guests=2,
            total_price=Decimal("238.00"),
            status=Booking.Status.CONFIRMED,
        )

        response = self.client.delete(
            reverse("booking-detail", kwargs={"booking_id": completed_booking.id})
        )

        self.assertEqual(response.status_code, 400)
        completed_booking.refresh_from_db()
        self.assertEqual(completed_booking.status, Booking.Status.COMPLETED)
