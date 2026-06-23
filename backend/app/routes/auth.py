import re
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from ..services.auth import hash_password, verify_password, create_access_token, decode_access_token

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
