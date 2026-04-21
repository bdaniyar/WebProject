from __future__ import annotations

from django.conf import settings
from django.contrib.auth.models import User
from django.core import signing
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


def make_verify_token(*, user: User) -> str:
    return signing.dumps({"uid": user.id}, salt="email-verify")


def read_verify_token(token: str) -> User:
    payload = signing.loads(token, salt="email-verify", max_age=60 * 60 * 24)
    return User.objects.get(pk=payload["uid"])


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_email_view(request):
    token = request.query_params.get("token")
    if not token:
        return Response({"detail": "token is required."}, status=400)

    try:
        user = read_verify_token(token)
    except Exception:
        return Response({"detail": "Invalid or expired token."}, status=400)

    # Django's User has no built-in 'email_verified' field.
    # For demo scope we just confirm success and let frontend show a message.
    # If you want to persist it, add a Profile model or custom user model.
    return Response({"detail": "Email verified.", "username": user.username})
