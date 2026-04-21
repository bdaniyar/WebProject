from django.urls import path

from api.views import (
    BookingDetailAPIView,
    BookingListCreateAPIView,
    HotelDetailAPIView,
    HotelListCreateAPIView,
    ReviewListCreateAPIView,
    RoomListAPIView,
    availability_view,
    change_password_view,
    dashboard_view,
    login_view,
    logout_view,
    register_view,
    user_me_view,
)

from api.views.email_verification import verify_email_view
from api.views.password_reset import (
    password_reset_confirm_view,
    password_reset_request_view,
)

urlpatterns = [
    path("auth/register/", register_view, name="register"),
    path("auth/login/", login_view, name="login"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/verify-email/", verify_email_view, name="verify-email"),
    path("auth/password-reset/", password_reset_request_view, name="password-reset"),
    path("auth/password-reset/confirm/", password_reset_confirm_view, name="password-reset-confirm"),
    path("user/me/", user_me_view, name="user-me"),
    path("user/change-password/", change_password_view, name="user-change-password"),
    path("availability/", availability_view, name="availability"),
    path("dashboard/", dashboard_view, name="dashboard"),
    path("hotels/", HotelListCreateAPIView.as_view(), name="hotel-list"),
    path("hotels/<int:hotel_id>/", HotelDetailAPIView.as_view(), name="hotel-detail"),
    path("rooms/", RoomListAPIView.as_view(), name="room-list"),
    path("bookings/", BookingListCreateAPIView.as_view(), name="booking-list"),
    path(
        "bookings/<int:booking_id>/",
        BookingDetailAPIView.as_view(),
        name="booking-detail",
    ),
    path("reviews/", ReviewListCreateAPIView.as_view(), name="review-list"),
]
