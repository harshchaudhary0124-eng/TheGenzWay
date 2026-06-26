import re
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.onboarding import UserOnboarding
from ..schemas.auth import (
    RegisterRequest, LoginRequest, OnboardingRequest,
    TokenResponse, UserResponse, OnboardingProfileResponse,
)
from ..services.auth import hash_password, verify_password, create_access_token, decode_access_token
from ..services.sync import sync_onboarding_rows

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer()


def _make_slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower().strip()).strip("-")
    return f"{base}-{secrets.token_hex(3)}"


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_access_token(creds.credentials)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    import traceback, sys
    try:
        return _register_impl(body, db)
    except HTTPException:
        raise
    except BaseException as exc:
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}") from exc

def _register_impl(body: RegisterRequest, db: Session):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    slug = _make_slug(body.full_name)
    while db.query(User).filter(User.profile_slug == slug).first():
        slug = _make_slug(body.full_name)

    user = User(
        full_name=body.full_name,
        email=body.email,
        hashed_password=hash_password(body.password),
        qualification=body.qualification,
        interested_domains=body.interested_domains,
        country=body.country,
        city=body.city,
        profile_slug=slug,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    import traceback, sys
    try:
        user = db.query(User).filter(User.email == body.email).first()
        if not user or not verify_password(body.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        return TokenResponse(access_token=create_access_token(user.id))
    except HTTPException:
        raise
    except BaseException as exc:
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}") from exc


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/onboarding", response_model=UserResponse)
def complete_onboarding(
    body: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import traceback, sys
    try:
        required_domains: list[str] = current_user.interested_domains or []
        submitted_map = {item.domain: item.answers for item in body.domains_data}

        # Every domain the user selected must be present with all 4 non-empty answers
        missing = [d for d in required_domains if d not in submitted_map]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Onboarding incomplete — answers missing for: {', '.join(missing)}",
            )

        for domain in required_domains:
            answers = submitted_map[domain]
            if len(answers) < 4 or any(not str(v).strip() for v in answers.values()):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Incomplete answers for domain: {domain} — all 4 questions must be answered",
                )

        # Remove existing onboarding rows for this user before inserting fresh ones
        db.query(UserOnboarding).filter(UserOnboarding.id == current_user.id).delete()

        all_answers: dict = {}
        for domain in required_domains:
            answers = submitted_map[domain]
            av = list(answers.values())
            db.add(UserOnboarding(
                id        = current_user.id,
                full_name = current_user.full_name,
                domain    = domain,
                answer_1  = av[0] if len(av) > 0 else "",
                answer_2  = av[1] if len(av) > 1 else "",
                answer_3  = av[2] if len(av) > 2 else "",
                answer_4  = av[3] if len(av) > 3 else "",
            ))
            all_answers[domain] = answers

        current_user.onboarding_completed = True
        current_user.onboarding_answers   = all_answers
        db.commit()
        db.refresh(current_user)
        return current_user
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}") from exc


@router.get("/onboarding-profile", response_model=OnboardingProfileResponse)
def get_onboarding_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(UserOnboarding)
        .filter(UserOnboarding.id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Onboarding not completed yet")
    return profile


@router.post("/sync-onboarding")
def sync_onboarding(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Back-fills user_onboarding rows for every user who has onboarding_completed=True
    but whose per-domain rows are missing or out of date.  Safe to call multiple times.
    """
    import traceback, sys
    try:
        count = sync_onboarding_rows(db)
        return {"synced_rows": count}
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}") from exc
