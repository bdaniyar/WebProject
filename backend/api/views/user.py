from django.contrib.auth import update_session_auth_hash
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


def _user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def user_me_view(request):
    user = request.user

    if request.method == "GET":
        return Response(_user_payload(user))

    # PUT
    data = request.data or {}
    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    user.email = data.get("email", user.email)
    user.save(update_fields=["first_name", "last_name", "email"])

    return Response(_user_payload(user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    data = request.data or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return Response(
            {"detail": "Both current_password and new_password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(new_password) < 6:
        return Response(
            {"detail": "New password must be at least 6 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not request.user.check_password(current_password):
        return Response(
            {"detail": "Current password is incorrect."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.user.set_password(new_password)
    request.user.save()

    # Keep session valid for non-JWT auth as well.
    update_session_auth_hash(request, request.user)

    return Response(
        {"detail": "Password changed successfully."}, status=status.HTTP_200_OK
    )
