"""Add PestTrap and FieldSensor tables

Revision ID: 2026_09_13_0003
Revises: 2026_09_01_0002
Create Date: 2026-09-13 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = '2026_09_13_0003'
down_revision: Union[str, None] = '2026_09_01_0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum creation is handled conditionally based on DB, but for raw Alembic we map directly or use sa.Enum
    op.create_table(
        'field_sensors',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('sensor_type', sa.String(length=50), nullable=False),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=True),
        sa.Column('status', sa.String(length=50), server_default="ACTIVE", nullable=False),
        sa.Column('source_device_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('ix_sensor_farm_zone', 'field_sensors', ['farm_id', 'zone_id'])

    op.create_table(
        'field_sensor_readings',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('sensor_id', sa.String(length=36), sa.ForeignKey('field_sensors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('sensor_type', sa.String(length=50), nullable=False),
        sa.Column('measurement', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('quality_status', sa.String(length=50), server_default="VALID", nullable=False),
        sa.Column('freshness', sa.String(length=50), server_default="CURRENT", nullable=False),
        sa.Column('source', sa.String(length=50), server_default="API", nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('ix_reading_sensor_time', 'field_sensor_readings', ['sensor_id', 'timestamp'])
    op.create_index('ix_reading_farm_zone_time', 'field_sensor_readings', ['farm_id', 'zone_id', 'timestamp'])

    op.create_table(
        'pest_traps',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('trap_type', sa.String(length=50), nullable=False),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=True),
        sa.Column('status', sa.String(length=50), server_default="ACTIVE", nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('ix_trap_farm_zone', 'pest_traps', ['farm_id', 'zone_id'])

    op.create_table(
        'pest_trap_observations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('trap_id', sa.String(length=36), sa.ForeignKey('pest_traps.id', ondelete='CASCADE'), nullable=False),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('pest_name', sa.String(length=150), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('observation_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('observer_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('quality_status', sa.String(length=50), server_default="VALID", nullable=False),
        sa.Column('source', sa.String(length=50), server_default="MANUAL", nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('ix_trapobs_trap_time', 'pest_trap_observations', ['trap_id', 'observation_time'])
    op.create_index('ix_trapobs_farm_zone_time', 'pest_trap_observations', ['farm_id', 'zone_id', 'observation_time'])


def downgrade() -> None:
    op.drop_table('pest_trap_observations')
    op.drop_table('pest_traps')
    op.drop_table('field_sensor_readings')
    op.drop_table('field_sensors')
