"""multilingual engine defaults

Revision ID: 2026_09_13_0004
Revises: 2026_09_13_0003
Create Date: 2026-09-13 18:55:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2026_09_13_0004'
down_revision = '2026_09_13_0003'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Update default language for existing users
    op.execute("UPDATE users SET preferred_language = 'mr-IN' WHERE role = 'FARMER'")
    op.execute("UPDATE users SET preferred_language = 'en-IN' WHERE role IN ('AGRICULTURAL_OFFICER', 'EXPERT', 'ADMIN')")

def downgrade() -> None:
    op.execute("UPDATE users SET preferred_language = 'en' WHERE role = 'FARMER'")
    op.execute("UPDATE users SET preferred_language = 'en' WHERE role IN ('AGRICULTURAL_OFFICER', 'EXPERT', 'ADMIN')")
