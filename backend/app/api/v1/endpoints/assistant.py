from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.assistant.engine import assistant_engine
from app.db.session import get_db
from app.models.auth import User
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantToolInfo,
)

router = APIRouter(tags=["Agricultural AI Assistant"])


@router.post(
    "/assistant/chat",
    response_model=AssistantChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Query Agricultural AI Assistant",
    description="Multilingual (English / Tamil) grounded assistant answering queries with authorized backend telemetry.",
)
async def chat_with_assistant(
    request: AssistantChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AssistantChatResponse:
    text, tools, sources = await assistant_engine.answer_query(
        db=db,
        query=request.message,
        farm_id=request.farm_id,
        zone_id=request.zone_id,
        language=request.language,
        current_user=current_user,
    )
    return AssistantChatResponse(
        response_text=text,
        language=request.language,
        tools_used=tools,
        data_sources=sources,
    )


@router.get(
    "/assistant/tools",
    response_model=List[AssistantToolInfo],
    status_code=status.HTTP_200_OK,
    summary="List Registered AI Assistant Tools",
    description="Returns metadata of deterministic telemetry retrieval tools available to the assistant.",
)
async def list_assistant_tools(
    current_user: User = Depends(get_current_active_user),
) -> List[AssistantToolInfo]:
    return [
        AssistantToolInfo(
            name="get_farm_health",
            description="Retrieves overall farm vitality score and growth stage.",
            parameters=["farm_id"],
        ),
        AssistantToolInfo(
            name="get_zone_status",
            description="Retrieves specific zonal diagnostic metrics, anomalies, and CWSI water stress status.",
            parameters=["zone_code", "farm_id"],
        ),
        AssistantToolInfo(
            name="get_zone_history",
            description="Retrieves multi-scan temporal health trajectories and velocity.",
            parameters=["zone_id"],
        ),
        AssistantToolInfo(
            name="get_weather",
            description="Retrieves canopy microclimate and sporulation feasibility indices.",
            parameters=["farm_id"],
        ),
        AssistantToolInfo(
            name="get_risk",
            description="Retrieves explainable agronomic risk score point attributions.",
            parameters=["farm_id"],
        ),
        AssistantToolInfo(
            name="get_neighbor_risk",
            description="Retrieves privacy-anonymized regional spread risk contagion corridors.",
            parameters=["farm_id"],
        ),
        AssistantToolInfo(
            name="get_recommendations",
            description="Retrieves actionable IPM and precision irrigation field recommendations.",
            parameters=["farm_id"],
        ),
        AssistantToolInfo(
            name="get_monitoring_schedule",
            description="Retrieves next scheduled autonomous drone flight and flight parameters.",
            parameters=["farm_id"],
        ),
    ]
