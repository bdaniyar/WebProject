from decimal import Decimal

from django.contrib.auth.models import User
from django.db import models


class RoomQuerySet(models.QuerySet):
    def active(self):
        return self.filter(active=True)

    def in_city(self, city: str | None):
        if not city:
            return self
        return self.filter(hotel__city__icontains=city)

    def for_guests(self, guests: int | None):
        if not guests:
            return self
        return self.filter(capacity__gte=guests)


RoomManager = models.Manager.from_queryset(RoomQuerySet)


class Amenity(models.Model):
    title = models.CharField(max_length=80, unique=True)
    icon = models.CharField(max_length=40, blank=True)
    category = models.CharField(max_length=40, default='General')

    class Meta:
        ordering = ('category', 'title')

    def __str__(self):
        return self.title


class Hotel(models.Model):
    name = models.CharField(max_length=120)
    city = models.CharField(max_length=80)
    address = models.CharField(max_length=180)
    description = models.TextField()
    hero_image = models.URLField(blank=True)
    rating = models.FloatField(default=4.5)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-featured', 'city', 'name')

    def __str__(self):
        return f'{self.name} ({self.city})'


class Room(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rooms')
    title = models.CharField(max_length=120)
    description = models.TextField()
    capacity = models.PositiveSmallIntegerField(default=2)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    total_units = models.PositiveSmallIntegerField(default=1)
    image_url = models.URLField(blank=True)
    active = models.BooleanField(default=True)
    amenities = models.ManyToManyField(Amenity, related_name='rooms', blank=True)

    objects = RoomManager()

    class Meta:
        ordering = ('hotel__name', 'price_per_night', 'title')

    def __str__(self):
        return f'{self.hotel.name} - {self.title}'

    def reserved_units(self, check_in, check_out, exclude_booking=None) -> int:
        overlapping = self.bookings.filter(
            status__in=[Booking.Status.CONFIRMED, Booking.Status.CHECKED_IN],
            check_in__lt=check_out,
            check_out__gt=check_in,
        )
        if exclude_booking is not None:
            overlapping = overlapping.exclude(pk=exclude_booking.pk)
        return overlapping.count()

    def available_units(self, check_in=None, check_out=None, exclude_booking=None) -> int:
        if not check_in or not check_out:
            return self.total_units
        return max(self.total_units - self.reserved_units(check_in, check_out, exclude_booking), 0)


class Booking(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = 'confirmed', 'Confirmed'
        CHECKED_IN = 'checked_in', 'Checked In'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    guest = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    check_in = models.DateField()
    check_out = models.DateField()
    guests = models.PositiveSmallIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    special_request = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('check_in', '-created_at')

    def __str__(self):
        return f'Booking #{self.pk} by {self.guest.username}'


class Review(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hotel_reviews')
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.hotel.name} review by {self.author.username}'