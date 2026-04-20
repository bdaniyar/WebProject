from __future__ import annotations

import ssl

from django.core.mail.backends.smtp import EmailBackend


class CertifiEmailBackend(EmailBackend):
    """SMTP backend that uses certifi CA bundle for TLS.

    Fixes macOS Python setups where OpenSSL can't find system root certificates,
    which causes: ssl.SSLCertVerificationError: CERTIFICATE_VERIFY_FAILED

    Django's SMTP backend passes `ssl_context=self.ssl_context` to starttls(),
    so `ssl_context` must be an SSLContext attribute, not a method.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            import certifi

            self.ssl_context = ssl.create_default_context(cafile=certifi.where())
        except Exception:
            self.ssl_context = ssl.create_default_context()
