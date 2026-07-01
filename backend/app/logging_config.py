"""Structured logging for the API.

One place to configure how the whole backend logs. Design rules:

* **Structured.** In production every record is emitted as a single JSON line
  (easy to ship to Better Stack / any log drain and to query). In development we
  keep a readable human format.
* **Secret-safe.** A redaction filter scrubs anything that looks like a
  password, JWT, API key/secret or bearer token out of every log message before
  it is written — so credentials can never leak into logs even by accident.
* **Idempotent.** ``configure_logging`` can be called more than once (tests,
  reload) without stacking duplicate handlers.

Nothing here logs request/response bodies, headers or auth material — the
request middleware (in ``main.py``) only logs method, path, status and timing.
"""
from __future__ import annotations

import json
import logging
import re
import sys
from datetime import datetime, timezone

# ── Redaction ────────────────────────────────────────────────────────────────
# Patterns that, if they ever appear in a formatted log message, are masked.
# This is defence-in-depth: we already avoid logging secrets at the call sites,
# but a stray f-string should never be able to leak one.
_REDACTIONS: tuple[tuple[re.Pattern[str], str], ...] = (
    # Bearer <jwt>  →  Bearer [REDACTED]
    (re.compile(r"(?i)(bearer\s+)[A-Za-z0-9._\-]+"), r"\1[REDACTED]"),
    # JWTs anywhere (three base64url segments)
    (re.compile(r"\beyJ[A-Za-z0-9._\-]+\.[A-Za-z0-9._\-]+\.[A-Za-z0-9._\-]+"), "[REDACTED_JWT]"),
    # key/secret/password/token = value  (query strings, kwargs, JSON-ish)
    (
        re.compile(
            r"(?i)(password|passwd|pwd|secret|api[_-]?secret|api[_-]?key|token|authorization)"
            r"(\"?\s*[:=]\s*\"?)([^\s,&\"}]+)"
        ),
        r"\1\2[REDACTED]",
    ),
)


def redact(message: str) -> str:
    """Mask anything credential-shaped in a log message."""
    for pattern, replacement in _REDACTIONS:
        message = pattern.sub(replacement, message)
    return message


class RedactingFilter(logging.Filter):
    """Scrub secrets from the rendered message of every record."""

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            record.msg = redact(record.getMessage())
            record.args = ()  # already interpolated into msg above
        except Exception:  # never let logging-of-logging break the app
            pass
        return True


# Standard LogRecord attributes — anything NOT in here was passed via `extra=`
# and is worth emitting as a structured field.
_RESERVED = set(
    vars(logging.makeLogRecord({})).keys()
) | {"message", "asctime", "taskName"}


class JsonFormatter(logging.Formatter):
    """Render a record as a single JSON line (production format)."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key not in _RESERVED and not key.startswith("_"):
                payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging(level: str = "INFO", *, json_output: bool = False) -> None:
    """Install handlers/formatters on the root logger (idempotent)."""
    root = logging.getLogger()
    root.setLevel(level.upper())

    # Replace any handlers we previously added so re-running doesn't duplicate.
    for handler in list(root.handlers):
        root.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    if json_output:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)-8s %(name)s | %(message)s")
        )
    handler.addFilter(RedactingFilter())
    root.addHandler(handler)

    # Align uvicorn's loggers with ours so access/error logs share the format
    # and pass through the redaction filter too.
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(name)
        lg.handlers = []
        lg.propagate = True
