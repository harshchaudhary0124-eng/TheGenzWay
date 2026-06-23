from pydantic import BaseModel, EmailStr, field_validator
from typing import Any, Dict, List
from datetime import datetime


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    qualification: str
    interested_domains: List[str]
    country: str
    city: str

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("interested_domains")
    @classmethod
    def domains_not_empty(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("Select at least one domain")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DomainAnswers(BaseModel):
    domain: str
    answers: Dict[str, str]


class OnboardingRequest(BaseModel):
    domains_data: List[DomainAnswers]


class OnboardingProfileResponse(BaseModel):
    id: int
    domain: str
    full_name: str
    answer_1: str
    answer_2: str
    answer_3: str
    answer_4: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    qualification: str
    interested_domains: List[str]
    country: str
    city: str
    profile_slug: str
    onboarding_completed: bool
    onboarding_answers: Dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}
