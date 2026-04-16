from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Hotel, Review, Room
from api.serializers import (
    AvailabilityRequestSerializer,
    HotelSerializer,
    ReviewSerializer,
    RoomSerializer,
)


class HotelListCreateAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        featured_only = request.query_params.get('featured') == 'true'
        queryset = Hotel.objects.prefetch_related('rooms__amenities')
        if featured_only:
            queryset = queryset.filter(featured=True)
        serializer = HotelSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = HotelSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class HotelDetailAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_object(self, hotel_id):
        return get_object_or_404(Hotel.objects.prefetch_related('rooms__amenities'), pk=hotel_id)

    def get(self, request, hotel_id):
        hotel = self.get_object(hotel_id)
        serializer = HotelSerializer(hotel, context={'request': request})
        return Response(serializer.data)

    def put(self, request, hotel_id):
        hotel = self.get_object(hotel_id)
        serializer = HotelSerializer(hotel, data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, hotel_id):
        hotel = self.get_object(hotel_id)
        hotel.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RoomListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        city = request.query_params.get('city')
        hotel_id = request.query_params.get('hotel_id')
        guests = request.query_params.get('guests')

        queryset = (
            Room.objects.active()
            .select_related('hotel')
            .prefetch_related('amenities')
            .in_city(city)
            .for_guests(int(guests) if guests else None)
        )
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)

        serializer = RoomSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class ReviewListCreateAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        queryset = Review.objects.select_related('author', 'hotel').all()
        hotel_id = request.query_params.get('hotel_id')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        serializer = ReviewSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def availability_view(request):
    filter_serializer = AvailabilityRequestSerializer(data=request.data)
    filter_serializer.is_valid(raise_exception=True)
    filters = filter_serializer.validated_data

    queryset = (
        Room.objects.active()
        .select_related('hotel')
        .prefetch_related('amenities')
        .in_city(filters.get('city'))
        .for_guests(filters['guests'])
    )
    if filters.get('hotel_id'):
        queryset = queryset.filter(hotel_id=filters['hotel_id'])

    available_rooms = [
        room
        for room in queryset
        if room.available_units(filters['check_in'], filters['check_out']) > 0
    ]
    serializer = RoomSerializer(
        available_rooms,
        many=True,
        context={'request': request, 'availability': filters},
    )
    return Response(
        {
            'filters': {
                'city': filters.get('city', ''),
                'guests': filters['guests'],
                'check_in': filters['check_in'],
                'check_out': filters['check_out'],
            },
            'matches': len(available_rooms),
            'rooms': serializer.data,
        }
    )
