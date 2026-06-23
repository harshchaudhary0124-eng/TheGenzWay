from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base


class UserOnboarding(Base):
    __tablename__ = "user_onboarding"

    id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    domain: Mapped[str] = mapped_column(String(100), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    answer_1: Mapped[str] = mapped_column(String(500), nullable=False)
    answer_2: Mapped[str] = mapped_column(String(500), nullable=False)
    answer_3: Mapped[str] = mapped_column(String(500), nullable=False)
    answer_4: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
