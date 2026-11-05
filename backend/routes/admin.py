import hashlib
import hmac
import time
import secrets
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from config import settings
import models
import schemas
from storage import delete_uploaded_file

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

def hash_password(password: str) -> str:
    """Hash password securely using SHA-256 with project salt loaded strictly from .env."""
    return hashlib.sha256((password + settings.PASSWORD_SALT).encode("utf-8")).hexdigest()

def generate_admin_token(user_id: int) -> str:
    """Generate a dynamic cryptographically secure admin token using JWT_SECRET_KEY from .env."""
    raw = f"{user_id}:{time.time()}:{secrets.token_hex(16)}"
    sig = hmac.new(settings.JWT_SECRET_KEY.encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"adm_{user_id}_{sig[:32]}"


def ensure_db_admin_exists(db: Session) -> models.User:
    """Verify admin user exists in MySQL DB; if missing, seed default admin from .env settings."""
    admin = db.query(models.User).filter(models.User.is_admin == True).first()
    if not admin:
        default_pwd_hash = hash_password(settings.ADMIN_DEFAULT_PASSWORD)
        admin = models.User(
            name=settings.ADMIN_DEFAULT_NAME,
            phone=settings.ADMIN_DEFAULT_USERNAME,
            email=settings.ADMIN_DEFAULT_EMAIL,
            password_hash=default_pwd_hash,
            is_admin=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    return admin


@router.post("/login")
def admin_login(creds: schemas.AdminLogin, db: Session = Depends(get_db)):
    """
    Authenticate Admin strictly against MySQL database credentials.
    Zero hardcoded values: compares hashed password against DB record.
    """
    # Ensure database has at least one admin account
    ensure_db_admin_exists(db)

    # Lookup admin in DB by phone/username or email
    user = db.query(models.User).filter(
        (models.User.phone == creds.username.strip()) | (models.User.email == creds.username.strip().lower()),
        models.User.is_admin == True
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account not found in database. Access denied."
        )

    # Verify hashed password with project salt from .env
    entered_hash = hash_password(creds.password.strip())
    if user.password_hash != entered_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin password. Access denied."
        )

    # Generate secure dynamic session token
    token = generate_admin_token(user.id)

    return {
        "success": True,
        "message": "Admin authenticated successfully from database",
        "token": token,
        "admin": {
            "id": user.id,
            "name": user.name,
            "username": user.phone,
            "email": user.email,
            "role": "Super Admin"
        }
    }


@router.put("/change-password")
def change_admin_password(payload: schemas.AdminPasswordChange, db: Session = Depends(get_db)):
    """
    Admin updates their password.
    Validates current password against MySQL DB and saves new hashed password.
    """
    user = db.query(models.User).filter(
        (models.User.phone == payload.username.strip()) | (models.User.email == payload.username.strip().lower()),
        models.User.is_admin == True
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Admin user not found in database")

    # Verify current password
    current_hash = hash_password(payload.current_password.strip())
    if user.password_hash != current_hash:
        raise HTTPException(status_code=400, detail="Current password does not match. Please verify and try again.")

    if len(payload.new_password.strip()) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long.")

    # Hash new password with salt from .env
    user.password_hash = hash_password(payload.new_password.strip())
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Admin password updated successfully in database. Please use the new password on next login."
    }


@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    """Get high-level dashboard metrics directly from MySQL tables."""
    total_foods = db.query(func.count(models.FoodItem.id)).scalar() or 0
    total_orders = db.query(func.count(models.Order.id)).scalar() or 0
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    pending_orders = db.query(func.count(models.Order.id)).filter(models.Order.status == "Pending").scalar() or 0
    total_revenue = db.query(func.sum(models.Order.total_amount)).filter(models.Order.status != "Cancelled").scalar() or 0.0

    return {
        "total_foods": total_foods,
        "total_orders": total_orders,
        "total_users": total_users,
        "pending_orders": pending_orders,
        "total_revenue": round(float(total_revenue), 2)
    }


@router.get("/users", response_model=List[schemas.AdminUserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """List all registered website users with their order count."""
    users = db.query(models.User).order_by(models.User.id.desc()).all()
    results = []

    for u in users:
        order_count = db.query(func.count(models.Order.id)).filter(models.Order.customer_phone == u.phone).scalar() or 0
        results.append(
            schemas.AdminUserResponse(
                id=u.id,
                name=u.name,
                phone=u.phone,
                email=u.email,
                is_admin=bool(u.is_admin),
                orders_count=order_count,
                created_at=u.created_at
            )
        )
    return results


@router.get("/settings/hero-image")
def get_hero_image(db: Session = Depends(get_db)):
    """Fetch active right-side Hero Section image URL strictly from database (zero fallbacks)."""
    setting = db.query(models.SiteSetting).filter(models.SiteSetting.key == "hero_image").first()
    image_url = setting.value if setting and setting.value else ""
    return {"hero_image": image_url}


@router.put("/settings/hero-image")
def update_hero_image(payload: schemas.SiteSettingUpdate, db: Session = Depends(get_db)):
    """Admin updates the Hero Section right-side food image URL."""
    if not payload.image_url.strip():
        raise HTTPException(status_code=400, detail="Image URL cannot be empty")

    setting = db.query(models.SiteSetting).filter(models.SiteSetting.key == "hero_image").first()
    if not setting:
        setting = models.SiteSetting(key="hero_image", value=payload.image_url.strip())
        db.add(setting)
    else:
        setting.value = payload.image_url.strip()

    db.commit()
    db.refresh(setting)
    return {"success": True, "hero_image": setting.value}


@router.delete("/settings/hero-image")
def delete_hero_image(db: Session = Depends(get_db)):
    """Admin removes the custom hero image, deleting the physical file from uploads/ and clearing the DB setting."""
    setting = db.query(models.SiteSetting).filter(models.SiteSetting.key == "hero_image").first()
    if setting and setting.value:
        delete_uploaded_file(setting.value)
        setting.value = ""
        db.commit()
    return {"success": True, "hero_image": ""}


@router.post("/settings/hero-image/upload")
async def upload_hero_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Admin uploads a hero food image directly from their device. Saved to uploads/ and DB."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only valid image files (JPG, PNG, WEBP, etc.) are allowed.")

    upload_dir = Path(__file__).resolve().parent.parent / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower()
    if not ext:
        ext = ".jpg"

    safe_filename = f"hero_{int(time.time())}_{secrets.token_hex(4)}{ext}"
    dest_path = upload_dir / safe_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"{settings.BACKEND_BASE_URL}/uploads/{safe_filename}"

    setting = db.query(models.SiteSetting).filter(models.SiteSetting.key == "hero_image").first()
    if not setting:
        setting = models.SiteSetting(key="hero_image", value=image_url)
        db.add(setting)
    else:
        # Delete previous uploaded hero photo from uploads/ if it existed
        if setting.value and setting.value != image_url:
            delete_uploaded_file(setting.value)
        setting.value = image_url

    db.commit()
    db.refresh(setting)

    return {"success": True, "hero_image": image_url, "filename": safe_filename}


@router.delete("/uploaded-image")
def remove_uploaded_image(image_url: str):
    """Explicitly remove any uploaded image file from backend/uploads/ folder."""
    deleted = delete_uploaded_file(image_url)
    return {"success": True, "deleted": deleted}


@router.post("/upload-dish-image")
async def upload_dish_image(file: UploadFile = File(...)):
    """Upload dish photo directly from device."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only valid image files are allowed.")

    upload_dir = Path(__file__).resolve().parent.parent / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower()
    if not ext:
        ext = ".jpg"

    safe_filename = f"dish_{int(time.time())}_{secrets.token_hex(4)}{ext}"
    dest_path = upload_dir / safe_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"success": True, "image_url": f"{settings.BACKEND_BASE_URL}/uploads/{safe_filename}"}
