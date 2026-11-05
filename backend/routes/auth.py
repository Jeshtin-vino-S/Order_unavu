import hashlib
import time
import shutil
import secrets
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from config import settings
import models
import schemas
from storage import delete_uploaded_file

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    """Hash password securely using SHA-256 with project salt strictly loaded from .env."""
    return hashlib.sha256((password + settings.PASSWORD_SALT).encode("utf-8")).hexdigest()

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    """Register a new customer account."""
    # Check if phone number is already registered
    existing_phone = db.query(models.User).filter(models.User.phone == user_in.phone.strip()).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number already registered. Please login."
        )

    # Check if email is already registered (if provided)
    if user_in.email:
        existing_email = db.query(models.User).filter(models.User.email == user_in.email.strip().lower()).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already registered. Please login."
            )

    new_user = models.User(
        name=user_in.name.strip(),
        phone=user_in.phone.strip(),
        email=user_in.email.strip().lower() if user_in.email else None,
        password_hash=hash_password(user_in.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login", response_model=schemas.UserResponse)
def login_user(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate customer with phone number and password."""
    user = db.query(models.User).filter(models.User.phone == login_in.phone.strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found with this mobile number. Please sign up."
        )

    if user.password_hash != hash_password(login_in.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
        )

    return user


@router.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...)):
    """Upload user profile picture directly from device and return public URL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only valid image files (JPG, PNG, WEBP) are allowed.")

    upload_dir = Path(__file__).resolve().parent.parent / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        ext = ".jpg"

    safe_filename = f"avatar_{int(time.time())}_{secrets.token_hex(4)}{ext}"
    dest_path = upload_dir / safe_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"success": True, "image_url": f"/uploads/{safe_filename}"}


@router.put("/profile/{user_id}", response_model=schemas.UserResponse)
def update_profile(
    user_id: int,
    profile_in: schemas.UserProfileUpdate,
    db: Session = Depends(get_db)
):
    """Update user personal profile details, profile picture, and password."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    # Name update
    if profile_in.name is not None and profile_in.name.strip():
        user.name = profile_in.name.strip()

    # Phone update
    if profile_in.phone is not None and profile_in.phone.strip():
        clean_phone = profile_in.phone.strip()
        if clean_phone != user.phone:
            existing = db.query(models.User).filter(models.User.phone == clean_phone, models.User.id != user_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="This mobile number is already in use by another account.")
            user.phone = clean_phone

    # Email update
    if profile_in.email is not None:
        clean_email = profile_in.email.strip().lower() if profile_in.email.strip() else None
        if clean_email and clean_email != user.email:
            existing_email = db.query(models.User).filter(models.User.email == clean_email, models.User.id != user_id).first()
            if existing_email:
                raise HTTPException(status_code=400, detail="This email address is already in use by another account.")
        user.email = clean_email

    # Profile picture update
    if profile_in.profile_image is not None:
        new_avatar = profile_in.profile_image.strip() if profile_in.profile_image.strip() else None
        if user.profile_image and user.profile_image != new_avatar:
            delete_uploaded_file(user.profile_image)
        user.profile_image = new_avatar

    # Password change
    if profile_in.new_password:
        if len(profile_in.new_password.strip()) < 4:
            raise HTTPException(status_code=400, detail="New password must be at least 4 characters.")
        if not profile_in.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to change password.")
        if user.password_hash != hash_password(profile_in.current_password):
            raise HTTPException(status_code=400, detail="Current password entered is incorrect.")
        user.password_hash = hash_password(profile_in.new_password.strip())

    db.commit()
    db.refresh(user)
    return user


@router.post("/change-password/{user_id}")
def change_user_password(
    user_id: int,
    pass_in: schemas.UserPasswordChange,
    db: Session = Depends(get_db)
):
    """Change user account password after strictly validating current password against DB."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    # Verify old/current password against stored password hash
    if user.password_hash != hash_password(pass_in.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect. Please check and try again."
        )

    if len(pass_in.new_password.strip()) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 4 characters long."
        )

    # Save new hashed password to database
    user.password_hash = hash_password(pass_in.new_password.strip())
    db.commit()
    return {"success": True, "message": "Password changed successfully!"}


