import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("order_unavu")

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

def delete_uploaded_file(image_url: Optional[str]) -> bool:
    """
    Safely delete an uploaded image file from the backend/uploads directory if it exists.
    Handles full URLs (e.g. http://localhost:8000/uploads/dish_xxx.jpg) or relative paths.
    Prevents deletion of .gitkeep and path traversal.
    """
    if not image_url or not isinstance(image_url, str):
        return False

    clean_url = image_url.strip()
    if not clean_url:
        return False

    # Check if the URL points to our uploads folder
    if "/uploads/" in clean_url:
        filename = clean_url.split("/uploads/")[-1].strip()
    elif clean_url.startswith("uploads/"):
        filename = clean_url[len("uploads/"):].strip()
    else:
        # Not a local uploads file (e.g. external unsplash URL)
        return False

    # Remove any query params or hash fragments
    filename = filename.split("?")[0].split("#")[0]

    # Prevent directory traversal attacks
    safe_filename = Path(filename).name
    if not safe_filename or safe_filename == ".gitkeep":
        return False

    target_file = UPLOADS_DIR / safe_filename
    if target_file.exists() and target_file.is_file():
        try:
            target_file.unlink()
            logger.info(f"Successfully deleted uploaded file: {target_file}")
            return True
        except Exception as e:
            logger.error(f"Error deleting file {target_file}: {e}")
            return False

    return False

