from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Booking, Room
from api.serializers import BookingSerializer, DashboardSerializer, RoomSerializer


class BookingListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = (
            Booking.objects.filter(guest=request.user)
            .select_related('room__hotel')
            .prefetch_related('room__amenities')
            .order_by('-created_at')
        )
        serializer = BookingSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = BookingSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookingDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, booking_id):
        return get_object_or_404(
            Booking.objects.select_related('room__hotel').prefetch_related('room__amenities'),
            pk=booking_id,
            guest=request.user,
        )

    def get(self, request, booking_id):
        booking = self.get_object(request, booking_id)
        serializer = BookingSerializer(booking, context={'request': request})
        return Response(serializer.data)

    def put(self, request, booking_id):
        booking = self.get_object(request, booking_id)
        serializer = BookingSerializer(booking, data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, booking_id):
        booking = self.get_object(request, booking_id)
        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=['status', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    bookings = (
        Booking.objects.filter(guest=request.user)
        .select_related('room__hotel')
        .prefetch_related('room__amenities')
        .order_by('check_in')
    )
    active_bookings = bookings.exclude(status=Booking.Status.CANCELLED)
    recommended_rooms = Room.objects.active().select_related('hotel').prefetch_related('amenities')[:3]

    payload = {
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
        },
        'active_bookings': active_bookings.count(),
        'total_spent': float(sum(booking.total_price for booking in bookings)),
        'upcoming_check_in': active_bookings.first().check_in if active_bookings.exists() else None,
        'bookings': BookingSerializer(bookings, many=True, context={'request': request}).data,
        'recommended_rooms': RoomSerializer(recommended_rooms, many=True, context={'request': request}).data,
    }
    serializer = DashboardSerializer(payload)
    return Response(serializer.data)
