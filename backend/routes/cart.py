from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/cart", tags=["Cart"])

class CartItemPayload(BaseModel):
    food_id: int
    quantity: Optional[int] = None
    delta: Optional[int] = None

def serialize_cart_item(item: models.CartItem) -> dict:
    food = item.food
    return {
        "id": food.id,
        "food_id": food.id,
        "name": food.name,
        "price": food.price,
        "image": food.image_url or "",
        "isVeg": bool(food.is_veg),
        "category": food.category,
        "prepTime": food.prep_time or "20-25 mins",
        "itemType": food.item_type or "kitchen",
        "mealSlot": food.meal_slot or "all_day",
        "stockQuantity": food.stock_quantity,
        "isAvailable": bool(food.is_available),
        "quantity": item.quantity
    }

@router.get("/{user_id}")
def get_user_cart(user_id: int, db: Session = Depends(get_db)):
    """Fetch all cart items for a specific logged-in user from MySQL."""
    items = (
        db.query(models.CartItem)
        .filter(models.CartItem.user_id == user_id)
        .order_by(models.CartItem.id.asc())
        .all()
    )
    return [serialize_cart_item(item) for item in items if item.food]

@router.post("/{user_id}")
def update_user_cart_item(user_id: int, payload: CartItemPayload, db: Session = Depends(get_db)):
    """Add, increment, or set quantity for an item in the user's cart in MySQL."""
    food = db.query(models.FoodItem).filter(models.FoodItem.id == payload.food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    cart_item = (
        db.query(models.CartItem)
        .filter(models.CartItem.user_id == user_id, models.CartItem.food_id == payload.food_id)
        .first()
    )

    if payload.delta is not None:
        if cart_item:
            new_qty = cart_item.quantity + payload.delta
            if new_qty <= 0:
                db.delete(cart_item)
            else:
                cart_item.quantity = new_qty
        else:
            if payload.delta > 0:
                cart_item = models.CartItem(user_id=user_id, food_id=payload.food_id, quantity=payload.delta)
                db.add(cart_item)
    elif payload.quantity is not None:
        if payload.quantity <= 0:
            if cart_item:
                db.delete(cart_item)
        else:
            if cart_item:
                cart_item.quantity = payload.quantity
            else:
                cart_item = models.CartItem(user_id=user_id, food_id=payload.food_id, quantity=payload.quantity)
                db.add(cart_item)
    else:
        # Default increment by 1
        if cart_item:
            cart_item.quantity += 1
        else:
            cart_item = models.CartItem(user_id=user_id, food_id=payload.food_id, quantity=1)
            db.add(cart_item)

    db.commit()

    # Return refreshed cart list
    items = db.query(models.CartItem).filter(models.CartItem.user_id == user_id).all()
    return [serialize_cart_item(it) for it in items if it.food]

@router.delete("/{user_id}/{food_id}")
def remove_cart_item(user_id: int, food_id: int, db: Session = Depends(get_db)):
    """Remove a specific dish from user's cart in MySQL."""
    cart_item = (
        db.query(models.CartItem)
        .filter(models.CartItem.user_id == user_id, models.CartItem.food_id == food_id)
        .first()
    )
    if cart_item:
        db.delete(cart_item)
        db.commit()
    return {"success": True, "message": "Item removed from cart"}

@router.delete("/{user_id}")
def clear_user_cart(user_id: int, db: Session = Depends(get_db)):
    """Clear all cart items for a specific user in MySQL."""
    db.query(models.CartItem).filter(models.CartItem.user_id == user_id).delete()
    db.commit()
    return {"success": True, "message": "Cart cleared successfully"}

