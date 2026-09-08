from PIL import Image, ImageStat
import io

def check_image_quality(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()  # verify integrity
    except Exception:
        return False, "Invalid image format or corrupted image."
    
    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        
        # Check resolution
        if width < 100 or height < 100:
            return False, "Image resolution is too low. Please capture a clearer image."
            
        # Check brightness/darkness using grayscale
        grayscale_img = img.convert("L")
        stat = ImageStat.Stat(grayscale_img)
        mean_brightness = stat.mean[0]
        
        if mean_brightness < 20:
            return False, "Image is too dark. Please capture an image with better lighting."
        if mean_brightness > 240:
            return False, "Image is too bright. Please capture an image with less glare."
            
        return True, "Image is acceptable."
    except Exception as e:
        return False, f"Error processing image: {str(e)}"
