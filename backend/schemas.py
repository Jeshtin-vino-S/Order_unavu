from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

# --- User Schemas ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, example="Karthik")
    phone: str = Field(..., min_length=10, example="9876543210")
    email: Optional[str] = Field(None, example="karthik@example.com")
    password: str = Field(..., min_length=4, example="secret123")

class UserLogin(BaseModel):
    phone: str = Field(..., min_length=10, example="9876543210")
    password: str = Field(..., min_length=4, example="secret123")

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    profile_image: Optional[str] = None
    is_admin: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    profile_image: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class UserPasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1, example="current123")
    new_password: str = Field(..., min_length=4, example="newPass456")

class AdminLogin(BaseModel):
    username: str = Field(..., example="admin")
    password: str = Field(..., example="admin123")

class AdminPasswordChange(BaseModel):
    username: str = Field(..., example="admin")
    current_password: str = Field(..., example="admin123")
    new_password: str = Field(..., min_length=4, example="newAdminPass456")

class AdminUserResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    is_admin: bool = False
    orders_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SiteSettingUpdate(BaseModel):
    image_url: str = Field(..., example="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800")

class SiteSettingResponse(BaseModel):
    key: str
    value: str



# --- FoodItem Schemas ---
class FoodItemBase(BaseModel):
    name: str = Field(..., example="Ambur Chicken Biryani")
    description: Optional[str] = Field(None, example="Aromatic seeraga samba rice cooked with tender chicken and authentic spices.")
    price: float = Field(..., gt=0, example=240.0)
    category: str = Field(..., example="Biryani")
    image_url: Optional[str] = Field(None, example="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500")
    is_veg: bool = Field(False, example=False)
    rating: float = Field(4.5, ge=1.0, le=5.0, example=4.7)
    prep_time: str = Field("20-25 mins", example="20-25 mins")
    is_available: bool = Field(True, example=True)
    item_type: str = Field("kitchen", example="kitchen") # 'kitchen' or 'inventory'
    meal_slot: str = Field("all_day", example="lunch") # 'breakfast', 'lunch', 'dinner', 'all_day'
    stock_quantity: Optional[int] = Field(None, example=20)

class FoodItemCreate(FoodItemBase):
    pass

class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_veg: Optional[bool] = None
    rating: Optional[float] = None
    prep_time: Optional[str] = None
    is_available: Optional[bool] = None
    item_type: Optional[str] = None
    meal_slot: Optional[str] = None
    stock_quantity: Optional[int] = None

class FoodItemResponse(FoodItemBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- OrderItem Schemas ---
class OrderItemCreate(BaseModel):
    food_id: int
    quantity: int = Field(..., ge=1)

class OrderItemResponse(BaseModel):
    id: int
    food_id: int
    food_name: str
    quantity: int
    price: float

    class Config:
        from_attributes = True


# --- Order Schemas ---
class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, example="Karthik")
    customer_phone: str = Field(..., min_length=10, example="9876543210")
    delivery_address: str = Field(..., min_length=5, example="No. 12, Gandhi Nagar, Chennai")
    payment_method: str = Field("Cash on Delivery", example="Cash on Delivery")
    items: List[OrderItemCreate] = Field(..., min_items=1)

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., example="Preparing") # Pending, Preparing, On the Way, Delivered, Cancelled

class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    delivery_address: str
    total_amount: float
    payment_method: str
    status: str
    created_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
