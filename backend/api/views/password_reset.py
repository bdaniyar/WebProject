from __future__ import annotations

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.email_service import send_password_reset_email


def _make_token(*, user: User) -> str:
    # Signed token (no DB tables needed)
    return signing.dumps({"uid": user.id}, salt="password-reset")


def _read_token(token: str) -> User:
    payload = signing.loads(token, salt="password-reset", max_age=60 * 60)
    return User.objects.get(pk=payload["uid"])


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request_view(request):
    email = (request.data.get("email") or "").strip()

    # Always return 200 to avoid user enumeration.
    if not email:
        return Response({"detail": "If the email exists, a reset link was sent."})

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({"detail": "If the email exists, a reset link was sent."})

    token = _make_token(user=user)
    reset_url = f"{settings.SITE_URL}/reset-password?token={token}"
    send_password_reset_email(
        to_email=user.email, username=user.username, reset_url=reset_url
    )

    return Response({"detail": "If the email exists, a reset link was sent."})


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    if not token or not new_password:
        return Response(
            {"detail": "token and new_password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = _read_token(token)
    except Exception:
        return Response(
            {"detail": "Reset link is invalid or expired."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(new_password, user=user)
    except Exception as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save(update_fields=["password"])

    return Response({"detail": "Password reset successful."})
