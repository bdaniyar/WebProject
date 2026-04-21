from api.views.auth import login_view, logout_view, refresh_view, register_view
from api.views.bookings import (
    BookingDetailAPIView,
    BookingListCreateAPIView,
    dashboard_view,
)
from api.views.catalog import (
    HotelDetailAPIView,
    HotelListCreateAPIView,
    ReviewListCreateAPIView,
    RoomListAPIView,
    availability_view,
)
from api.views.user import change_password_view, user_me_view

__all__ = [
    "BookingDetailAPIView",
    "BookingListCreateAPIView",
    "HotelDetailAPIView",
    "HotelListCreateAPIView",
    "ReviewListCreateAPIView",
    "RoomListAPIView",
    "availability_view",
    "dashboard_view",
    "login_view",
    "logout_view",
    "refresh_view",
    "register_view",
    "user_me_view",
    "change_password_view",
]
