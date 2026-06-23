from sqlalchemy.orm import Session
from ..models.user import User
from ..models.onboarding import UserOnboarding


def _parse_onboarding_answers(raw: dict) -> dict[str, dict]:
    """
    Normalise onboarding_answers to {domain: {question_id: answer, ...}}.

    Old single-domain format: {"domain": "X", "answers": {"q1": "a1", ...}}
    New multi-domain format:  {"DomainX": {"q1": "a1"}, "DomainY": {...}}
    """
    if not raw:
        return {}
    if "domain" in raw and "answers" in raw:
        domain = raw["domain"]
        answers = raw["answers"]
        if isinstance(domain, str) and isinstance(answers, dict):
            return {domain: answers}
    # Treat every top-level key as a domain name
    return {k: v for k, v in raw.items() if isinstance(v, dict)}


def sync_onboarding_rows(db: Session) -> int:
    """
    For every user with onboarding_completed=True, ensure user_onboarding has
    one row per domain sourced from onboarding_answers.  Returns rows upserted.
    """
    completed = db.query(User).filter(User.onboarding_completed.is_(True)).all()
    upserted = 0

    for user in completed:
        domains_data = _parse_onboarding_answers(user.onboarding_answers or {})
        if not domains_data:
            continue

        for domain, answers in domains_data.items():
            av = list(answers.values())
            existing = (
                db.query(UserOnboarding)
                .filter(
                    UserOnboarding.id == user.id,
                    UserOnboarding.domain == domain,
                )
                .first()
            )
            if existing:
                existing.answer_1 = av[0] if len(av) > 0 else ""
                existing.answer_2 = av[1] if len(av) > 1 else ""
                existing.answer_3 = av[2] if len(av) > 2 else ""
                existing.answer_4 = av[3] if len(av) > 3 else ""
            else:
                db.add(UserOnboarding(
                    id=user.id,
                    full_name=user.full_name,
                    domain=domain,
                    answer_1=av[0] if len(av) > 0 else "",
                    answer_2=av[1] if len(av) > 1 else "",
                    answer_3=av[2] if len(av) > 2 else "",
                    answer_4=av[3] if len(av) > 3 else "",
                ))
            upserted += 1

    db.commit()
    return upserted
