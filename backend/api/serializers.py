from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Min
from django.utils import timezone
from rest_framework import serializers

from .models import Amenity, Booking, Favorite, Hotel, Review, Room


MAX_STAY_NIGHTS = 30
MAX_ADVANCE_DAYS = 365


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ("id", "title", "icon", "category")


class HotelPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = ("id", "name", "city", "country", "rating", "featured", "latitude", "longitude")


class RoomPreviewSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    available_units = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = (
            "id",
            "hotel_name",
            "title",
            "capacity",
            "price_per_night",
            "total_units",
            "image_url",
            "amenities",
            "available_units",
        )

    def get_available_units(self, obj):
        availability = self.context.get("availability") or {}
        check_in = availability.get("check_in")
        check_out = availability.get("check_out")
        return obj.available_units(check_in=check_in, check_out=check_out)


class HotelSerializer(serializers.ModelSerializer):
    room_count = serializers.SerializerMethodField()
    starting_price = serializers.SerializerMethodField()
    rooms = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = (
            "id",
            "name",
            "city",
            "country",
            "address",
            "description",
            "hero_image",
            "rating",
            "latitude",
            "longitude",
            "featured",
            "room_count",
            "starting_price",
            "rooms",
        )

    def _catalog_rooms(self, obj):
        if hasattr(obj, "catalog_rooms"):
            return obj.catalog_rooms
        return obj.rooms.filter(active=True).prefetch_related("amenities")

    def get_starting_price(self, obj):
        rooms = self._catalog_rooms(obj)
        if isinstance(rooms, list):
            return min((room.price_per_night for room in rooms), default=None)
        return rooms.aggregate(min_price=Min("price_per_night"))["min_price"]

    def get_room_count(self, obj):
        rooms = self._catalog_rooms(obj)
        if isinstance(rooms, list):
            return len(rooms)
        return rooms.count()

    def get_rooms(self, obj):
        room_queryset = self._catalog_rooms(obj)
        room_limit = self.context.get("room_limit", 3)
        if room_limit is not None:
            room_queryset = room_queryset[:room_limit]
        return RoomPreviewSerializer(
            room_queryset, many=True, context=self.context
        ).data


class RoomSerializer(serializers.ModelSerializer):
    hotel = HotelPreviewSerializer(read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(),
        source="hotel",
        write_only=True,
        required=False,
    )
    available_units = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = (
            "id",
            "hotel",
            "hotel_id",
            "title",
            "description",
            "capacity",
            "price_per_night",
            "total_units",
            "image_url",
            "active",
            "amenities",
            "available_units",
        )

    def get_available_units(self, obj):
        availability = self.context.get("availability") or {}
        check_in = availability.get("check_in")
        check_out = availability.get("check_out")
        return obj.available_units(check_in=check_in, check_out=check_out)


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ("id", "hotel", "author_name", "rating", "comment", "created_at")
        read_only_fields = ("author_name", "created_at")

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("hotel", "rating", "comment")

    def validate(self, attrs):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        #today = timezone.localdate()
        hotel = attrs.get("hotel")
        is_eligible = (
            Booking.objects.filter(
                guest=request.user,
                room__hotel=hotel,
                #check_out__lt=today,
            )
            .exclude(status=Booking.Status.CANCELLED)
            .exists()
        )
        if not is_eligible:
            raise serializers.ValidationError(
                "You can only leave a review after you have completed a stay in this hotel."
            )

        return attrs


class FavoriteSerializer(serializers.ModelSerializer):
    hotel = HotelPreviewSerializer(read_only=True)
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(),
        source="hotel",
        write_only=True,
    )

    class Meta:
        model = Favorite
        fields = ("id", "hotel", "hotel_id", "created_at")
        read_only_fields = ("id", "hotel", "created_at")


class BookingSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.filter(active=True),
        source="room",
        write_only=True,
    )

    class Meta:
        model = Booking
        fields = (
            "id",
            "room",
            "room_id",
            "check_in",
            "check_out",
            "guests",
            "special_request",
            "status",
            "total_price",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("status", "total_price", "created_at", "updated_at")

    def validate(self, attrs):
        room = attrs.get("room", getattr(self.instance, "room", None))
        check_in = attrs.get("check_in", getattr(self.instance, "check_in", None))
        check_out = attrs.get("check_out", getattr(self.instance, "check_out", None))
        guests = attrs.get("guests", getattr(self.instance, "guests", None))

        if not room or not check_in or not check_out or not guests:
            raise serializers.ValidationError("Room, dates, and guests are required.")

        if check_in >= check_out:
            raise serializers.ValidationError("Check-out must be later than check-in.")

        if check_in < timezone.localdate():
            raise serializers.ValidationError("Check-in cannot be in the past.")

        if guests > room.capacity:
            raise serializers.ValidationError(
                "Selected room cannot host that many guests."
            )

        stay_nights = (check_out - check_in).days
        if stay_nights > MAX_STAY_NIGHTS:
            raise serializers.ValidationError(
                f"Stay cannot exceed {MAX_STAY_NIGHTS} nights."
            )

        if check_in > (timezone.localdate() + timedelta(days=MAX_ADVANCE_DAYS)):
            raise serializers.ValidationError(
                f"Check-in cannot be more than {MAX_ADVANCE_DAYS} days in advance."
            )

        if room.available_units(check_in, check_out, exclude_booking=self.instance) < 1:
            raise serializers.ValidationError(
                "No rooms left for those dates. Please pick another option."
            )

        return attrs

    def _calculate_total(self, room, check_in, check_out):
        nights = (check_out - check_in).days
        return room.price_per_night * nights

    def create(self, validated_data):
        request = self.context["request"]
        booking = Booking.objects.create(
            guest=request.user,
            total_price=self._calculate_total(
                validated_data["room"],
                validated_data["check_in"],
                validated_data["check_out"],
            ),
            **validated_data,
        )
        return booking

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.total_price = self._calculate_total(
            instance.room, instance.check_in, instance.check_out
        )
        instance.save()
        return instance


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class AvailabilityRequestSerializer(serializers.Serializer):
    city = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    hotel_id = serializers.IntegerField(required=False, min_value=1)
    guests = serializers.IntegerField(min_value=1)
    check_in = serializers.DateField()
    check_out = serializers.DateField()

    def validate(self, attrs):
        if attrs["check_in"] >= attrs["check_out"]:
            raise serializers.ValidationError("Check-out must be later than check-in.")
        return attrs


class DashboardSerializer(serializers.Serializer):
    user = serializers.DictField()
    active_bookings = serializers.IntegerField()
    total_spent = serializers.FloatField()
    upcoming_check_in = serializers.DateField(allow_null=True)
    bookings = serializers.ListField()
    recommended_rooms = serializers.ListField()
