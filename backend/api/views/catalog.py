from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Hotel, Review, Room
from api.serializers import (
    AvailabilityRequestSerializer,
    HotelSerializer,
    ReviewCreateSerializer,
    ReviewSerializer,
    RoomSerializer,
)


def _parse_optional_positive_int(raw_value, field_name):
    if raw_value in (None, ""):
        return None
    try:
        value = int(raw_value)
    except (TypeError, ValueError) as exc:
        raise ValidationError({field_name: "Must be a positive integer."}) from exc
    if value < 1:
        raise ValidationError({field_name: "Must be at least 1."})
    return value


def _extract_catalog_filters(request):
    city = request.query_params.get("city", "").strip()
    country = request.query_params.get("country", "").strip()
    hotel_id = _parse_optional_positive_int(
        request.query_params.get("hotel_id"), "hotel_id"
    )
    guests = _parse_optional_positive_int(request.query_params.get("guests"), "guests")
    check_in = request.query_params.get("check_in")
    check_out = request.query_params.get("check_out")

    if check_in or check_out:
        serializer_input = {
            "city": city,
            "guests": guests or 1,
            "check_in": check_in,
            "check_out": check_out,
        }
        if country:
            serializer_input["country"] = country
        if hotel_id is not None:
            serializer_input["hotel_id"] = hotel_id

        filters_serializer = AvailabilityRequestSerializer(
            data=serializer_input
        )
        filters_serializer.is_valid(raise_exception=True)
        return filters_serializer.validated_data

    return {
        "city": city,
        "country": country,
        "hotel_id": hotel_id,
        "guests": guests,
        "check_in": None,
        "check_out": None,
    }


def _catalog_room_queryset(filters):
    queryset = Room.objects.all().active().prefetch_related("amenities")
    queryset = queryset.in_city(filters.get("city")).in_country(
        filters.get("country")
    )
    queryset = queryset.for_guests(filters.get("guests"))

    if filters.get("hotel_id"):
        queryset = queryset.filter(hotel_id=filters["hotel_id"])

    if filters.get("check_in") and filters.get("check_out"):
        queryset = queryset.available_for_dates(filters["check_in"], filters["check_out"])

    return queryset


def _availability_context(filters):
    if filters.get("check_in") and filters.get("check_out"):
        return filters
    return None


class HotelListCreateAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        featured_only = request.query_params.get("featured") == "true"
        filters = _extract_catalog_filters(request)
        room_queryset = _catalog_room_queryset(filters)

        queryset = Hotel.objects.all()
        if featured_only:
            queryset = queryset.filter(featured=True)
        if filters.get("city"):
            queryset = queryset.filter(city__icontains=filters["city"])
        if filters.get("country"):
            queryset = queryset.filter(country__icontains=filters["country"])

        if any(
            [
                filters.get("city"),
                filters.get("country"),
                filters.get("guests"),
                filters.get("check_in"),
                filters.get("check_out"),
            ]
        ):
            queryset = queryset.filter(rooms__pk__in=room_queryset.values("pk")).distinct()

        queryset = queryset.prefetch_related(
            Prefetch("rooms", queryset=room_queryset, to_attr="catalog_rooms")
        )

        serializer = HotelSerializer(
            queryset,
            many=True,
            context={
                "request": request,
                "availability": _availability_context(filters),
                "room_limit": 3,
            },
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = HotelSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class HotelDetailAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_object(self, hotel_id):
        return get_object_or_404(
            Hotel.objects.prefetch_related(
                Prefetch(
                    "rooms",
                    queryset=Room.objects.active().prefetch_related("amenities"),
                    to_attr="catalog_rooms",
                )
            ),
            pk=hotel_id,
        )

    def get(self, request, hotel_id):
        hotel = self.get_object(hotel_id)
        serializer = HotelSerializer(hotel, context={"request": request})
        return Response(serializer.data)

    def put(self, request, hotel_id):
        hotel = self.get_object(hotel_id)
        serializer = HotelSerializer(
            hotel, data=request.data, context={"request": request}
        )
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
        filters = _extract_catalog_filters(request)
        queryset = _catalog_room_queryset(filters).select_related("hotel")

        serializer = RoomSerializer(
            queryset,
            many=True,
            context={"request": request, "availability": _availability_context(filters)},
        )
        return Response(serializer.data)


class ReviewListCreateAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        queryset = Review.objects.select_related("author", "hotel").all()
        hotel_id = request.query_params.get("hotel_id")
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        serializer = ReviewSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ReviewCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save(author=request.user)
        return Response(
            ReviewSerializer(review, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def availability_view(request):
    filter_serializer = AvailabilityRequestSerializer(data=request.data)
    filter_serializer.is_valid(raise_exception=True)
    filters = filter_serializer.validated_data

    queryset = _catalog_room_queryset(filters).select_related("hotel")

    serializer = RoomSerializer(
        queryset,
        many=True,
        context={"request": request, "availability": filters},
    )
    return Response(
        {
            "filters": {
                "city": filters.get("city", ""),
                "country": filters.get("country", ""),
                "guests": filters["guests"],
                "check_in": filters["check_in"],
                "check_out": filters["check_out"],
            },
            "matches": queryset.count(),
            "rooms": serializer.data,
        }
    )
