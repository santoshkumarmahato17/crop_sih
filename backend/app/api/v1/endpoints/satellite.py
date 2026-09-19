from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.repositories.farm import farm_repo
from app.spatial.satellite import satellite_imagery_service

router = APIRouter(prefix="/satellite", tags=["Satellite Field Imagery"])

@router.get(
    "/farm/{farm_id}/image",
    response_model=Dict[str, Any],
    summary="Get Satellite Imagery for Farm",
    description="Retrieves a clipped satellite imagery tile (True Color, NDVI, or NDWI) for the farm boundary."
)
async def get_farm_satellite_image(
    farm_id: str,
    layer: str = Query("true_color", description="Image layer to retrieve (true_color, ndvi, ndwi)"),
    date: Optional[str] = Query(None, description="Target date (YYYY-MM-DD). Defaults to today."),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    farm = await farm_repo.get(db, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")
        
    if not farm.boundary:
        raise HTTPException(status_code=400, detail="Farm has no spatial boundary defined.")
        
    try:
        return await satellite_imagery_service.get_farm_imagery(farm.boundary, layer=layer, date=date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching satellite imagery: {str(e)}")

@router.get(
    "/farm/{farm_id}/stats",
    response_model=Dict[str, Any],
    summary="Get Satellite NDVI Statistics for Farm",
    description="Retrieves NDVI statistics time series for the farm polygon over the specified period."
)
async def get_farm_satellite_stats(
    farm_id: str,
    days: int = Query(30, ge=7, le=365, description="Number of days to look back"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    farm = await farm_repo.get(db, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")
        
    if not farm.boundary:
        raise HTTPException(status_code=400, detail="Farm has no spatial boundary defined.")
        
    try:
        return await satellite_imagery_service.get_farm_statistics(farm.boundary, days_back=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching satellite statistics: {str(e)}")
