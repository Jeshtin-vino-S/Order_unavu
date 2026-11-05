from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

@router.get("/{user_id}", response_model=List[int])
def get_user_wishlist(user_id: int, db: Session = Depends(get_db)):
    """Fetch array of food IDs in user's wishlist from MySQL."""
    items = (
        db.query(models.WishlistItem.food_id)
        .filter(models.WishlistItem.user_id == user_id)
        .all()
    )
    return [r[0] for r in items]

@router.post("/{user_id}/toggle/{food_id}")
def toggle_wishlist_item(user_id: int, food_id: int, db: Session = Depends(get_db)):
    """Toggle a food item in user's wishlist in MySQL."""
    food = db.query(models.FoodItem).filter(models.FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    existing = (
        db.query(models.WishlistItem)
        .filter(models.WishlistItem.user_id == user_id, models.WishlistItem.food_id == food_id)
        .first()
    )

    in_wishlist = False
    if existing:
        db.delete(existing)
        in_wishlist = False
    else:
        new_item = models.WishlistItem(user_id=user_id, food_id=food_id)
        db.add(new_item)
        in_wishlist = True

    db.commit()

    all_items = (
        db.query(models.WishlistItem.food_id)
        .filter(models.WishlistItem.user_id == user_id)
        .all()
    )
    return {
        "success": True,
        "in_wishlist": in_wishlist,
        "wishlist": [r[0] for r in all_items]
    }

@router.delete("/{user_id}/{food_id}")
def remove_from_wishlist(user_id: int, food_id: int, db: Session = Depends(get_db)):
    """Remove a food item from user's wishlist in MySQL."""
    item = (
        db.query(models.WishlistItem)
        .filter(models.WishlistItem.user_id == user_id, models.WishlistItem.food_id == food_id)
        .first()
    )
    if item:
        db.delete(item)
        db.commit()
    return {"success": True, "message": "Item removed from wishlist"}

