"""Error monitoring (Sentry) wiring for the backend.

Sentry is initialised **only in production and only when a DSN is configured**
(``settings.sentry_enabled``). In development it is a no-op so local runs never
ship events anywhere.

The SDK is imported lazily inside ``init_sentry`` so the app still boots if
``sentry-sdk`` isn't installed — the import error is logged and the app
continues without error monitoring rather than crashing.

We rely on Sentry's ``send_default_pii=False`` (the default) plus a
``before_send`` scrubber so request headers / cookies / auth material are never
transmitted.
"""
from __future__ import annotations

import logging

from .config import settings

logger = logging.getLogger("app.observability")

_SENSITIVE_HEADERS = {"authorization", "cookie", "set-cookie", "x-api-key"}


def _scrub_event(event, _hint):
    """Strip any auth-bearing headers/cookies before an event leaves the process."""
    try:
        request = event.get("request")
        if isinstance(request, dict):
            headers = request.get("headers")
            if isinstance(headers, dict):
                for key in list(headers):
                    if key.lower() in _SENSITIVE_HEADERS:
                        headers[key] = "[REDACTED]"
            request.pop("cookies", None)
            # Never ship query strings — they can carry the WS ?token= param.
            if request.get("query_string"):
                request["query_string"] = "[REDACTED]"
    except Exception:  # scrubbing must never break delivery
        pass
    return event


def init_sentry() -> bool:
    """Initialise Sentry if enabled. Returns True if it was actually started."""
    if not settings.sentry_enabled:
        return False
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
    except ImportError:
        logger.warning("sentry-sdk not installed — error monitoring disabled")
        return False

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        release=settings.APP_VERSION,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,  # never attach user/cookie/header PII
        before_send=_scrub_event,
        integrations=[StarletteIntegration(), FastApiIntegration()],
    )
    logger.info("Sentry initialised", extra={"release": settings.APP_VERSION})
    return True
