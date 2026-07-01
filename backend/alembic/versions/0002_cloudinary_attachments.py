"""Move forum attachments from local-disk paths to Cloudinary identifiers.

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-30

Media storage moved from the local ``backend/uploads/`` directory to Cloudinary.
Attachments now persist the Cloudinary ``public_id`` (for management/deletion)
and the ``secure_url`` (the HTTPS link served to the client) instead of a path
relative to the old ``/uploads`` static mount.

* ``stored_path``  -> renamed to ``secure_url`` and widened to 1024 chars.
* ``cloudinary_public_id`` added.

Any rows that predate Cloudinary keep their old relative path in ``secure_url``
(harmless — they simply won't resolve) and get an empty ``cloudinary_public_id``.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # New Cloudinary public_id. server_default="" backfills any existing rows so
    # the NOT NULL constraint holds; the default is dropped immediately after.
    op.add_column(
        "forum_attachments",
        sa.Column("cloudinary_public_id", sa.String(255), nullable=False, server_default=""),
    )
    op.alter_column("forum_attachments", "cloudinary_public_id", server_default=None)

    # stored_path -> secure_url (now an absolute https Cloudinary URL).
    op.alter_column(
        "forum_attachments",
        "stored_path",
        new_column_name="secure_url",
        type_=sa.String(1024),
        existing_type=sa.String(512),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "forum_attachments",
        "secure_url",
        new_column_name="stored_path",
        type_=sa.String(512),
        existing_type=sa.String(1024),
        existing_nullable=False,
    )
    op.drop_column("forum_attachments", "cloudinary_public_id")
