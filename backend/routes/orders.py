from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from config import settings
import models
import schemas

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Place a new food order with verified DB prices."""
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    total_amount = 0.0
    order_items_to_create = []

    for item in order_in.items:
        food = db.query(models.FoodItem).filter(models.FoodItem.id == item.food_id).first()
        if not food:
            raise HTTPException(status_code=404, detail=f"Food item with id {item.food_id} not found")
        if not food.is_available:
            raise HTTPException(status_code=400, detail=f"'{food.name}' is currently unavailable/sold out")

        # Inventory stock check for packaged items
        if food.item_type == "inventory" and food.stock_quantity is not None:
            if food.stock_quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Only {food.stock_quantity} left in stock for '{food.name}'")
            food.stock_quantity -= item.quantity
            if food.stock_quantity <= 0:
                food.is_available = False

        item_total = food.price * item.quantity
        total_amount += item_total

        order_items_to_create.append(
            models.OrderItem(
                food_id=food.id,
                food_name=food.name,
                quantity=item.quantity,
                price=food.price
            )
        )

    # Dynamic calculation using .env settings (No hardcoding)
    delivery_fee = (
        0.0 if total_amount >= settings.FREE_DELIVERY_THRESHOLD
        else settings.DELIVERY_FEE
    )
    taxes = round(total_amount * settings.TAX_RATE, 2)
    final_total = round(total_amount + delivery_fee + taxes, 2)

    new_order = models.Order(
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        delivery_address=order_in.delivery_address,
        total_amount=final_total,
        payment_method=order_in.payment_method,
        status="Pending",
        items=order_items_to_create
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("", response_model=List[schemas.OrderResponse])
def get_orders(
    limit: int = 50,
    phone: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List recent orders with their items. Optionally filter by customer phone."""
    query = db.query(models.Order).options(joinedload(models.Order.items))
    if phone:
        clean_digits = "".join(filter(str.isdigit, phone))
        if len(clean_digits) >= 10:
            last10 = clean_digits[-10:]
            query = query.filter(models.Order.customer_phone.like(f"%{last10}%"))
        else:
            query = query.filter(models.Order.customer_phone.like(f"%{phone.strip()}%"))
    orders = (
        query
        .order_by(models.Order.created_at.desc())
        .limit(limit)
        .all()
    )
    return orders


@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    """Get single order details and live status."""
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update order delivery status by Admin (Pending, Preparing, On the Way, Delivered).
    Note: Admin cannot cancel an order; cancellation is strictly reserved for the customer.
    """
    admin_allowed_statuses = ["Pending", "Preparing", "On the Way", "Delivered"]
    if status_update.status not in admin_allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Admin cannot set status '{status_update.status}'. Allowed statuses: {', '.join(admin_allowed_statuses)}. Cancellation can only be done by customer."
        )

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "Cancelled":
        raise HTTPException(
            status_code=400,
            detail="This order was cancelled by the customer and cannot be modified."
        )

    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/cancel", response_model=schemas.OrderResponse)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    """User-initiated order cancellation. Restores inventory stock if packaged items."""
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "Delivered":
        raise HTTPException(status_code=400, detail="Cannot cancel an order that has already been delivered.")

    if order.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Order is already cancelled.")

    if order.status == "On the Way":
        raise HTTPException(
            status_code=400,
            detail="Order is already on the way for delivery and cannot be cancelled. Please contact support."
        )

    # Restores inventory stock for packaged items if cancelled
    for item in order.items:
        food = db.query(models.FoodItem).filter(models.FoodItem.id == item.food_id).first()
        if food and food.item_type == "inventory" and food.stock_quantity is not None:
            food.stock_quantity += item.quantity
            if food.stock_quantity > 0:
                food.is_available = True

    order.status = "Cancelled"
    db.commit()
    db.refresh(order)
    return order
