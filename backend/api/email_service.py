from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from api.models import Booking


@dataclass(frozen=True)
class EmailResult:
    ok: bool
    detail: str = ""


def _send(subject: str, to_email: str, template: str, context: dict) -> EmailResult:
    if not to_email:
        return EmailResult(ok=False, detail="User email is empty.")

    try:
        text_body = render_to_string(f"emails/{template}.txt", context)
        html_body = render_to_string(f"emails/{template}.html", context)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            to=[to_email],
        )
        msg.attach_alternative(html_body, "text/html")

        # On some macOS setups OpenSSL cannot find a system CA bundle.
        # If certifi is installed, use its CA bundle for SMTP TLS.
        try:  # pragma: no cover
            import certifi
            import ssl

            msg.connection = msg.get_connection(
                ssl_context=ssl.create_default_context(cafile=certifi.where())
            )
        except Exception:
            pass

        msg.send(fail_silently=False)
        return EmailResult(ok=True)
    except Exception as exc:  # pragma: no cover
        return EmailResult(ok=False, detail=str(exc))


def send_registration_verification_email(
    *, to_email: str, username: str, verify_url: str
) -> EmailResult:
    return _send(
        subject="Confirm your email",
        to_email=to_email,
        template="verify_email",
        context={"username": username, "verify_url": verify_url},
    )


def send_password_reset_email(
    *, to_email: str, username: str, reset_url: str
) -> EmailResult:
    return _send(
        subject="Password reset",
        to_email=to_email,
        template="password_reset",
        context={"username": username, "reset_url": reset_url},
    )


def send_booking_created_email(*, booking: Booking) -> EmailResult:
    return _send(
        subject=f"Booking confirmed: {booking.room.hotel.name}",
        to_email=booking.guest.email,
        template="booking_created",
        context={"booking": booking},
    )


def send_booking_cancelled_email(*, booking: Booking) -> EmailResult:
    return _send(
        subject=f"Booking cancelled: {booking.room.hotel.name}",
        to_email=booking.guest.email,
        template="booking_cancelled",
        context={"booking": booking},
    )
