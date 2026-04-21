from django.contrib import admin

from .models import Amenity, Booking, Hotel, Review, Room


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'icon')
    search_fields = ('title', 'category')


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'country', 'rating', 'featured')
    list_filter = ('country', 'city', 'featured')
    search_fields = ('name', 'city', 'country', 'address')


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('title', 'hotel', 'capacity', 'price_per_night', 'total_units', 'active')
    list_filter = ('hotel__country', 'hotel__city', 'active', 'capacity')
    search_fields = ('title', 'hotel__name', 'hotel__city', 'hotel__country')
    filter_horizontal = ('amenities',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'guest', 'room', 'check_in', 'check_out', 'status', 'total_price')
    list_filter = ('status', 'check_in', 'check_out')
    search_fields = ('guest__username', 'room__title', 'room__hotel__name')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('author', 'hotel', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('author__username', 'hotel__name', 'comment')
