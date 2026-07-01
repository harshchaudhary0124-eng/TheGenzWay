"""Centralised security primitives: rate limiting + HTTP hardening.

Kept in one module so limits and header policy are easy to audit and tune.
"""
from limits import RateLimitItemPerMinute
from limits.storage import MemoryStorage
from limits.strategies import FixedWindowRateLimiter
from slowapi import Limiter
from slowapi.util import get_remote_address

from .config import settings

# ── HTTP rate limiter (per client IP) ────────────────────────────────────────
# slowapi decorates HTTP routes. Storage is in-process; a multi-node deployment
# should point this at Redis (Limiter(..., storage_uri="redis://...")).
#
# headers_enabled stays False: with headers_enabled=True, slowapi requires every
# rate-limited route to expose a `response: Response` parameter (to write the
# X-RateLimit-* advisory headers) and raises otherwise. Our limited routes
# (register/login/upload) return models, not Response objects, so we keep the
# enforcement but drop the optional advisory headers. Rate limiting (429 on
# abuse) is unaffected.
limiter = Limiter(key_func=get_remote_address, headers_enabled=False)

# Sensible per-IP limits — generous enough for real use, tight enough to stop
# brute-force / abuse. Tune via these constants only.
LOGIN_RATE_LIMIT = "10/minute"
REGISTER_RATE_LIMIT = "5/minute"
UPLOAD_RATE_LIMIT = "30/minute"


# ── WebSocket connection limiter ─────────────────────────────────────────────
# slowapi's decorator doesn't support WebSocket handshakes, so the WS route
# calls this directly. Uses the same `limits` backend as slowapi.
_ws_storage = MemoryStorage()
_ws_strategy = FixedWindowRateLimiter(_ws_storage)
_WS_CONNECT_LIMIT = RateLimitItemPerMinute(30)


def ws_connection_allowed(client_ip: str) -> bool:
    """Return True if this IP may open another WS connection this minute."""
    return _ws_strategy.hit(_WS_CONNECT_LIMIT, "ws_connect", client_ip or "unknown")


# ── Secure response headers ──────────────────────────────────────────────────
# Paths whose responses must NOT get the strict API CSP (interactive docs need
# to load Swagger UI assets). These are disabled entirely in production anyway.
_CSP_EXEMPT_PREFIXES = ("/docs", "/redoc", "/openapi.json")

# Strict policy for a pure JSON/file API: nothing is allowed to execute or be
# embedded. Safe for JSON responses and for any directly-opened upload.
_API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"


def security_headers(path: str) -> dict[str, str]:
    """Build the set of hardening headers for a response on `path`."""
    headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        # This is a pure JSON/file API — it never needs camera, mic, geolocation,
        # etc. Deny the lot so a compromised response can't request them.
        "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()",
    }
    if not any(path.startswith(p) for p in _CSP_EXEMPT_PREFIXES):
        headers["Content-Security-Policy"] = _API_CSP
    # HSTS only in production (and only meaningful over HTTPS).
    if settings.is_production:
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return headers
