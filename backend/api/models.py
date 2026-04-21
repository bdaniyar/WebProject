from django.db import models

# Create your models here.
class Amenity(models.Model):
    title = models.CharField(max_length=80, unique=True)
    icon = models.CharField(max_length=40, blank=True)
    category = models.CharField(max_length=40, default='General')

    class Meta:
        ordering = ('category', 'title')

    def __str__(self):
        return self.title


class Hotel(models.Model):
    name = models.CharField(max_length=120)
    city = models.CharField(max_length=80)
    address = models.CharField(max_length=180)
    description = models.TextField()
    hero_image = models.URLField(blank=True)
    rating = models.FloatField(default=4.5)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-featured', 'city', 'name')

    def __str__(self):
        return f'{self.name} ({self.city})'