from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.email_service import send_booking_cancelled_email, send_booking_created_email
from api.models import Booking, Room
from api.serializers import BookingSerializer, DashboardSerializer, RoomSerializer


def _booking_creation_race_safe(serializer):
    """Create booking inside an atomic transaction to reduce race conditions."""
    with transaction.atomic():
        serializer.is_valid(raise_exception=True)
        return serializer.save()


def _sync_completed_bookings(user):
    today = timezone.localdate()
    return Booking.objects.filter(
        guest=user,
        status__in=[Booking.Status.CONFIRMED, Booking.Status.CHECKED_IN],
        check_out__lt=today,
    ).update(status=Booking.Status.COMPLETED, updated_at=timezone.now())


def _user_booking_queryset(user):
    _sync_completed_bookings(user)
    return (
        Booking.objects.filter(guest=user)
        .select_related("room__hotel")
        .prefetch_related("room__amenities")
    )


class BookingListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = _user_booking_queryset(request.user).order_by("-created_at", "-id")
        serializer = BookingSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = BookingSerializer(data=request.data, context={"request": request})
        booking = _booking_creation_race_safe(serializer)

        if booking.guest.email:
            send_booking_created_email(booking=booking)

        return Response(
            BookingSerializer(booking, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class BookingDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, booking_id):
        _sync_completed_bookings(request.user)
        return get_object_or_404(
            Booking.objects.select_related("room__hotel").prefetch_related(
                "room__amenities"
            ),
            pk=booking_id,
            guest=request.user,
        )

    def get(self, request, booking_id):
        booking = self.get_object(request, booking_id)
        serializer = BookingSerializer(booking, context={"request": request})
        return Response(serializer.data)

    def put(self, request, booking_id):
        booking = self.get_object(request, booking_id)
        if booking.status in [Booking.Status.CANCELLED, Booking.Status.COMPLETED]:
            return Response(
                {"detail": "Only active bookings can be edited."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BookingSerializer(
            booking, data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, booking_id):
        booking = self.get_object(request, booking_id)
        if booking.status == Booking.Status.CANCELLED:
            return Response(
                {"detail": "This booking is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if booking.status == Booking.Status.COMPLETED:
            return Response(
                {"detail": "Completed stays cannot be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=["status", "updated_at"])

        if booking.guest.email:
            send_booking_cancelled_email(booking=booking)

        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    bookings = _user_booking_queryset(request.user).order_by("-created_at", "-id")
    active_bookings = bookings.filter(
        status__in=[Booking.Status.CONFIRMED, Booking.Status.CHECKED_IN]
    )
    upcoming_booking = active_bookings.order_by("check_in", "-created_at").first()
    recommended_rooms = (
        Room.objects.filter(active=True)
        .select_related("hotel")
        .prefetch_related("amenities")[:3]
    )

    payload = {
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "email": request.user.email,
        },
        "active_bookings": active_bookings.count(),
        "total_spent": float(sum(booking.total_price for booking in bookings)),
        "upcoming_check_in": upcoming_booking.check_in if upcoming_booking else None,
        "bookings": BookingSerializer(
            bookings, many=True, context={"request": request}
        ).data,
        "recommended_rooms": RoomSerializer(
            recommended_rooms, many=True, context={"request": request}
        ).data,
    }
    serializer = DashboardSerializer(payload)
    return Response(serializer.data)
