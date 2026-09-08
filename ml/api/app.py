from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import sys
import os

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from inference.predictor import OrangeLeafPredictor
from inference.image_quality import check_image_quality

app = FastAPI(title="Orange Leaf Disease ML API")
predictor = OrangeLeafPredictor()

@app.get("/api/health")
async def health_check():
    return {"status": "running", "model_loaded": predictor.model is not None}

@app.post("/api/predict")
async def predict(image: UploadFile = File(...)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    image_bytes = await image.read()
    
    # 1. Image Quality Check
    is_good, quality_msg = check_image_quality(image_bytes)
    if not is_good:
        return JSONResponse(status_code=400, content={
            "success": False,
            "message": quality_msg
        })
        
    # 2. Prediction
    result = predictor.predict(image_bytes, threshold=0.70)
    
    if not result["success"]:
        return JSONResponse(status_code=500, content=result)
        
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
