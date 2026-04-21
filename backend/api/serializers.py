from django.contrib.auth.models import User
from django.db.models import Min
from django.utils import timezone
from rest_framework import serializers

from .models import Amenity, Booking, Hotel, Review, Room


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ('id', 'title', 'icon', 'category')


class HotelPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = ('id', 'name', 'city', 'rating', 'featured')


class RoomPreviewSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = (
            'id',
            'hotel_name',
            'title',
            'capacity',
            'price_per_night',
            'total_units',
            'image_url',
            'amenities',
        )


class HotelSerializer(serializers.ModelSerializer):
    room_count = serializers.SerializerMethodField()
    starting_price = serializers.SerializerMethodField()
    rooms = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = (
            'id',
            'name',
            'city',
            'address',
            'description',
            'hero_image',
            'rating',
            'featured',
            'room_count',
            'starting_price',
            'rooms',
        )

    def get_starting_price(self, obj):
        return obj.rooms.filter(active=True).aggregate(min_price=Min('price_per_night'))['min_price']

    def get_room_count(self, obj):
        return obj.rooms.count()

    def get_rooms(self, obj):
        room_queryset = obj.rooms.filter(active=True).prefetch_related('amenities')[:3]
        return RoomPreviewSerializer(room_queryset, many=True, context=self.context).data


class RoomSerializer(serializers.ModelSerializer):
    hotel = HotelPreviewSerializer(read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(),
        source='hotel',
        write_only=True,
        required=False,
    )
    available_units = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = (
            'id',
            'hotel',
            'hotel_id',
            'title',
            'description',
            'capacity',
            'price_per_night',
            'total_units',
            'image_url',
            'active',
            'amenities',
            'available_units',
        )

    def get_available_units(self, obj):
        availability = self.context.get('availability') or {}
        check_in = availability.get('check_in')
        check_out = availability.get('check_out')
        return obj.available_units(check_in=check_in, check_out=check_out)


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ('id', 'hotel', 'author_name', 'rating', 'comment', 'created_at')
        read_only_fields = ('author_name', 'created_at')

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username


class BookingSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(queryset=Room.objects.active(), source='room', write_only=True)

    class Meta:
        model = Booking
        fields = (
            'id',
            'room',
            'room_id',
            'check_in',
            'check_out',
            'guests',
            'special_request',
            'status',
            'total_price',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('status', 'total_price', 'created_at', 'updated_at')

    def validate(self, attrs):
        room = attrs.get('room', getattr(self.instance, 'room', None))
        check_in = attrs.get('check_in', getattr(self.instance, 'check_in', None))
        check_out = attrs.get('check_out', getattr(self.instance, 'check_out', None))
        guests = attrs.get('guests', getattr(self.instance, 'guests', None))

        if not room or not check_in or not check_out or not guests:
            raise serializers.ValidationError('Room, dates, and guests are required.')

        if check_in >= check_out:
            raise serializers.ValidationError('Check-out must be later than check-in.')

        if check_in < timezone.localdate():
            raise serializers.ValidationError('Check-in cannot be in the past.')

        if guests > room.capacity:
            raise serializers.ValidationError('Selected room cannot host that many guests.')

        if room.available_units(check_in, check_out, exclude_booking=self.instance) < 1:
            raise serializers.ValidationError('No rooms left for those dates. Please pick another option.')

        return attrs

    def _calculate_total(self, room, check_in, check_out):
        nights = (check_out - check_in).days
        return room.price_per_night * nights

    def create(self, validated_data):
        request = self.context['request']
        booking = Booking.objects.create(
            guest=request.user,
            total_price=self._calculate_total(
                validated_data['room'],
                validated_data['check_in'],
                validated_data['check_out'],
            ),
            **validated_data,
        )
        return booking

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.total_price = self._calculate_total(instance.room, instance.check_in, instance.check_out)
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
            raise serializers.ValidationError('Username is already taken.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class AvailabilityRequestSerializer(serializers.Serializer):
    city = serializers.CharField(required=False, allow_blank=True)
    hotel_id = serializers.IntegerField(required=False, min_value=1)
    guests = serializers.IntegerField(min_value=1)
    check_in = serializers.DateField()
    check_out = serializers.DateField()

    def validate(self, attrs):
        if attrs['check_in'] >= attrs['check_out']:
            raise serializers.ValidationError('Check-out must be later than check-in.')
        return attrs


class DashboardSerializer(serializers.Serializer):
    user = serializers.DictField()
    active_bookings = serializers.IntegerField()
    total_spent = serializers.FloatField()
    upcoming_check_in = serializers.DateField(allow_null=True)
    bookings = serializers.ListField()
    recommended_rooms = serializers.ListField()