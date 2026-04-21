from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Favorite
from api.serializers import FavoriteSerializer


class FavoriteListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = (
            Favorite.objects.filter(user=request.user)
            .select_related("hotel")
            .order_by("-created_at")
        )
        return Response(FavoriteSerializer(queryset, many=True, context={"request": request}).data)

    def post(self, request):
        serializer = FavoriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        favorite, created = Favorite.objects.get_or_create(
            user=request.user, hotel=serializer.validated_data["hotel"]
        )

        data = FavoriteSerializer(favorite, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class FavoriteDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, hotel_id: int):
        Favorite.objects.filter(user=request.user, hotel_id=hotel_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

