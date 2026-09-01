"""Add symptom-based crop disease diagnosis tables

Revision ID: 2026_09_01_0002
Revises: 2026_08_31_0001
Create Date: 2026-09-01 09:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2026_09_01_0002'
down_revision: Union[str, None] = '2026_08_31_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. diagnosis_analyses table
    op.create_table(
        'diagnosis_analyses',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_id', sa.String(length=36), sa.ForeignKey('crops.id', ondelete='SET NULL'), nullable=True),
        sa.Column('crop_type', sa.String(length=100), nullable=False),
        sa.Column('growth_stage', sa.String(length=100), nullable=False),
        sa.Column('plant_parts', sa.JSON(), nullable=False),
        sa.Column('severity', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'SEVERE', name='symptomseverity'), nullable=False),
        sa.Column('distribution', sa.String(length=100), nullable=False),
        sa.Column('symptom_start_date', sa.String(length=100), nullable=True),
        sa.Column('farmer_notes', sa.Text(), nullable=True),
        sa.Column('recent_pesticide_fungicide', sa.String(length=200), nullable=True),
        sa.Column('recent_fertilizer', sa.String(length=200), nullable=True),
        sa.Column('recent_irrigation', sa.String(length=200), nullable=True),
        sa.Column('recent_rainfall', sa.String(length=200), nullable=True),
        sa.Column('visible_insects', sa.String(length=200), nullable=True),
        sa.Column('recent_unusual_weather', sa.String(length=200), nullable=True),
        sa.Column('other_observations', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('AI_SUSPECTED', 'EXPERT_CONFIRMED', 'EXPERT_REJECTED', 'INSUFFICIENT_EVIDENCE', 'LOW_CONFIDENCE', name='diagnosisstatus'), nullable=False),
        sa.Column('ai_confidence', sa.Float(), nullable=False),
        sa.Column('ai_model_name', sa.String(length=100), nullable=False),
        sa.Column('ai_model_version', sa.String(length=50), nullable=False),
        sa.Column('is_prototype', sa.Boolean(), nullable=False),
        sa.Column('primary_condition', sa.String(length=200), nullable=False),
        sa.Column('possible_conditions', sa.JSON(), nullable=False),
        sa.Column('reasoning_points', sa.JSON(), nullable=False),
        sa.Column('zone_status_snapshot', sa.JSON(), nullable=False),
        sa.Column('historical_comparison', sa.JSON(), nullable=False),
        sa.Column('neighboring_zone_analysis', sa.JSON(), nullable=False),
        sa.Column('recommendations', sa.JSON(), nullable=False),
        sa.Column('follow_up_monitoring', sa.JSON(), nullable=False),
        sa.Column('validation_status', sa.Enum('NOT_REQUESTED', 'PENDING', 'CONFIRMED', 'REJECTED', 'UNCERTAIN', 'LAB_REFERRAL', name='validationrequeststatus'), nullable=False),
        sa.Column('expert_user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('expert_notes', sa.Text(), nullable=True),
        sa.Column('revised_diagnosis', sa.String(length=200), nullable=True),
        sa.Column('validated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_diagnosis_analyses_id', 'diagnosis_analyses', ['id'])
    op.create_index('ix_diagnosis_analyses_user_id', 'diagnosis_analyses', ['user_id'])
    op.create_index('ix_diagnosis_analyses_farm_id', 'diagnosis_analyses', ['farm_id'])
    op.create_index('ix_diagnosis_analyses_zone_id', 'diagnosis_analyses', ['zone_id'])

    # 2. diagnosis_symptoms table
    op.create_table(
        'diagnosis_symptoms',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('analysis_id', sa.String(length=36), sa.ForeignKey('diagnosis_analyses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('symptom_name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_diagnosis_symptoms_analysis_id', 'diagnosis_symptoms', ['analysis_id'])

    # 3. diagnosis_images table
    op.create_table(
        'diagnosis_images',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('analysis_id', sa.String(length=36), sa.ForeignKey('diagnosis_analyses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('image_url', sa.String(length=512), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('visual_abnormalities_detected', sa.Boolean(), nullable=False),
        sa.Column('affected_regions', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_diagnosis_images_analysis_id', 'diagnosis_images', ['analysis_id'])


def downgrade() -> None:
    op.drop_table('diagnosis_images')
    op.drop_table('diagnosis_symptoms')
    op.drop_table('diagnosis_analyses')
