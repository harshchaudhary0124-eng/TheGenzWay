from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any, Optional

from ..database import get_db
from ..models.user import User
from ..models.onboarding import UserOnboarding
from ..routes.auth import get_current_user

# Mirrors frontend/lib/discover.ts DOMAIN_ANSWER_KEYS — positional order must match
_DOMAIN_KEYS: dict[str, tuple[str, str, str, str]] = {
    "Entrepreneurship":        ("stage", "focus", "context", "intent"),
    "Artificial Intelligence": ("level", "area", "work", "intent"),
    "Software / Development":  ("level", "area", "work", "intent"),
    "Design":                  ("type", "mode", "focus", "intent"),
    "Blockchain / Web3":       ("role", "area", "status", "intent"),
    "Product / Startups":      ("role", "context", "area", "intent"),
    "Content Creation":        ("type", "platform", "stage", "intent"),
    "Marketing / Growth":      ("role", "area", "context", "intent"),
    "Finance / Investing":     ("role", "area", "interest", "intent"),
    "Research / Deep Tech":    ("domain", "role", "work", "intent"),
}


def _row_to_answers(row: UserOnboarding, domain: str) -> dict[str, str]:
    keys = _DOMAIN_KEYS.get(domain)
    if not keys:
        return {}
    return {
        keys[0]: row.answer_1 or "",
        keys[1]: row.answer_2 or "",
        keys[2]: row.answer_3 or "",
        keys[3]: row.answer_4 or "",
    }


def _row_is_complete(row: UserOnboarding) -> bool:
    """All 4 answer columns must be non-empty strings."""
    return all(
        str(v).strip()
        for v in (row.answer_1, row.answer_2, row.answer_3, row.answer_4)
    )


def _load_completed_domains(user_id: int, interested_domains: list[str], db: Session) -> Optional[dict[str, dict[str, str]]]:
    """
    Returns a dict of {domain: answers} for the user ONLY if every domain
    in interested_domains has a complete user_onboarding row.
    Returns None if any domain is missing or has incomplete answers.
    """
    rows = (
        db.query(UserOnboarding)
        .filter(UserOnboarding.id == user_id)
        .all()
    )
    row_map: dict[str, UserOnboarding] = {r.domain: r for r in rows}

    result: dict[str, dict[str, str]] = {}
    for domain in interested_domains:
        row = row_map.get(domain)
        if not row or not _row_is_complete(row):
            return None  # Any incomplete domain disqualifies the whole user
        result[domain] = _row_to_answers(row, domain)

    return result


def _identity_summary(domain: str, answers: dict) -> str:
    if not answers:
        return f"Active in {domain}"

    if domain == "Entrepreneurship":
        stage = answers.get("stage", "")
        focus = answers.get("focus", "")
        if stage == "Exploring":
            return f"Exploring entrepreneurship — interested in {focus.lower() or 'the space'}"
        return f"{stage} {focus} founder" if focus else f"{stage} founder"

    if domain == "Artificial Intelligence":
        level = answers.get("level", "")
        area = answers.get("area", "")
        if level == "Exploring":
            return f"Exploring AI — curious about {area.lower() or 'the field'}"
        if level in ("Building AI products", "Working professionally"):
            return f"AI practitioner focused on {area.lower() or 'the field'}"
        return f"Building with AI — {area or level}"

    if domain == "Software / Development":
        level = answers.get("level", "")
        area = answers.get("area", "")
        if level == "Exploring":
            return "Getting into software development"
        return f"{area} developer — {level}" if area else f"Software developer — {level}"

    if domain == "Design":
        type_ = answers.get("type", "")
        focus = answers.get("focus", "")
        if type_ == "Exploring":
            return "Exploring design"
        return f"{type_} designer, focused on {focus.lower()}" if focus else f"{type_} designer"

    if domain == "Blockchain / Web3":
        role = answers.get("role", "")
        area = answers.get("area", "")
        if role == "Exploring":
            return "Exploring Web3"
        return f"Web3 {role.lower()} — {area}" if area else f"Web3 {role.lower()}"

    if domain == "Product / Startups":
        role = answers.get("role", "")
        context = answers.get("context", "")
        if role == "Exploring":
            return "Exploring product & startups"
        return f"{role} at {context.lower()}" if context else f"{role}"

    if domain == "Content Creation":
        type_ = answers.get("type", "")
        platform = answers.get("platform", "")
        if type_ == "Exploring":
            return "Getting into content creation"
        return f"{type_} creator on {platform}" if platform else f"{type_} creator"

    if domain == "Marketing / Growth":
        role = answers.get("role", "")
        area = answers.get("area", "")
        if role == "Exploring":
            return "Exploring marketing & growth"
        return f"{role} focused on {area.lower()}" if area else f"{role}"

    if domain == "Finance / Investing":
        role = answers.get("role", "")
        area = answers.get("area", "")
        if role == "Exploring":
            return "Exploring finance & investing"
        return f"{role} — {area}" if area else f"{role}"

    if domain == "Research / Deep Tech":
        domain_area = answers.get("domain", "")
        role = answers.get("role", "")
        if domain_area == "Exploring":
            return "Exploring deep tech & research"
        return f"{role or 'Researcher'} in {domain_area or domain}"

    return f"Active in {domain}"


def _why_matched(domain: str, current: dict, target: dict) -> str:
    if not current or not target:
        return f"Both active in {domain}"

    c_intent = current.get("intent", "")
    t_intent = target.get("intent", "")
    t_focus = target.get("focus", target.get("area", target.get("work", "")))

    if c_intent and t_intent and c_intent == t_intent:
        return f"Same goals — both looking for: {c_intent}"
    if c_intent and t_focus and c_intent != t_focus:
        return f"You want {c_intent.lower()} — they're working on {t_focus.lower()}"

    c_stage = current.get("stage", current.get("level", current.get("role", "")))
    t_stage = target.get("stage", target.get("level", target.get("role", "")))
    if c_stage and t_stage and c_stage == t_stage and c_stage != "Exploring":
        return f"Both at {c_stage} stage in {domain}"

    return f"Both building in {domain}"


router = APIRouter(prefix="/discover", tags=["discover"])


@router.get("/people")
def discover_people(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    user_domains: list[str] = current_user.interested_domains or []
    if not user_domains:
        return []

    # Load current user's own completed answers (needed for why_matched)
    current_domain_answers = _load_completed_domains(current_user.id, user_domains, db) or {}

    candidates = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.onboarding_completed == True,  # noqa: E712
        )
        .all()
    )

    result: list[dict[str, Any]] = []

    for candidate in candidates:
        candidate_domains: list[str] = candidate.interested_domains or []
        if not candidate_domains:
            continue

        # Gate: every one of the candidate's domains must have complete answers
        # in user_onboarding. If any domain is missing or partial, skip entirely.
        candidate_answers = _load_completed_domains(candidate.id, candidate_domains, db)
        if candidate_answers is None:
            continue

        # Only keep domains shared between current user and candidate
        shared = [d for d in user_domains if d in set(candidate_domains)]
        if not shared:
            continue

        # Render only matching (shared) domains — not every candidate domain —
        # so each card shows just the domains in common with the current user.
        matched_domains: list[dict[str, Any]] = []
        for domain in shared:
            target_ans = candidate_answers[domain]
            current_ans = current_domain_answers.get(domain, {})
            matched_domains.append({
                "domain": domain,
                "onboarding_answers": target_ans,
                "identity_summary": _identity_summary(domain, target_ans),
                "why_matched": _why_matched(domain, current_ans, target_ans),
            })

        # Full profile: EVERY domain the candidate chose, with complete answers.
        # Consumed by the "View Profile" modal, which must never show partial info.
        all_domains: list[dict[str, Any]] = [
            {
                "domain": domain,
                "onboarding_answers": candidate_answers[domain],
                "identity_summary": _identity_summary(domain, candidate_answers[domain]),
            }
            for domain in candidate_domains
        ]

        result.append({
            "id": candidate.id,
            "full_name": candidate.full_name,
            "city": candidate.city,
            "country": candidate.country,
            "matched_domains": matched_domains,
            "all_domains": all_domains,
            "interested_domains": candidate_domains,
            "profile_slug": candidate.profile_slug,
        })

    # Most domain overlap first
    result.sort(key=lambda p: len(p["matched_domains"]), reverse=True)
    return result[:30]
