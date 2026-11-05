from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
import models
import schemas
from storage import delete_uploaded_file

router = APIRouter(prefix="/api/foods", tags=["Foods"])

@router.get("", response_model=List[schemas.FoodItemResponse])
def get_all_foods(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name or description"),
    is_veg: Optional[bool] = Query(None, description="Filter veg/non-veg"),
    sort_by: Optional[str] = Query(None, description="Sort: price_asc, price_desc, rating"),
    include_all: bool = Query(False, description="Include unavailable items (for admin)"),
    db: Session = Depends(get_db)
):
    """Fetch food items with category, search and veg filters."""
    query = db.query(models.FoodItem)
    if not include_all:
        query = query.filter(models.FoodItem.is_available == True)

    if category and category.lower() != "all":
        query = query.filter(models.FoodItem.category.ilike(f"%{category}%"))

    if is_veg is not None:
        query = query.filter(models.FoodItem.is_veg == is_veg)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.FoodItem.name.ilike(search_pattern),
                models.FoodItem.description.ilike(search_pattern)
            )
        )

    if sort_by == "price_asc":
        query = query.order_by(models.FoodItem.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(models.FoodItem.price.desc())
    elif sort_by == "rating":
        query = query.order_by(models.FoodItem.rating.desc())
    else:
        query = query.order_by(models.FoodItem.id.asc())

    return query.all()


@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """Fetch unique categories."""
    records = db.query(models.FoodItem.category).distinct().all()
    categories = [r[0] for r in records if r[0]]
    return ["All"] + categories


@router.get("/{food_id}", response_model=schemas.FoodItemResponse)
def get_food_by_id(food_id: int, db: Session = Depends(get_db)):
    """Fetch a single food item by ID."""
    food = db.query(models.FoodItem).filter(models.FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    return food


HERO_SECTION_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"


@router.post("", response_model=schemas.FoodItemResponse, status_code=status.HTTP_201_CREATED)
def create_food(food_in: schemas.FoodItemCreate, db: Session = Depends(get_db)):
    """Add a new food item (admin). Falls back to hero section fallback image if image_url is not provided."""
    food_data = food_in.dict()
    if not food_data.get("image_url"):
        food_data["image_url"] = HERO_SECTION_FALLBACK_IMAGE
    elif "localhost:8000" in food_data["image_url"]:
        food_data["image_url"] = food_data["image_url"].replace("http://localhost:8000", "")
    new_food = models.FoodItem(**food_data)
    db.add(new_food)
    db.commit()
    db.refresh(new_food)
    return new_food


@router.put("/{food_id}", response_model=schemas.FoodItemResponse)
def update_food(food_id: int, food_update: schemas.FoodItemUpdate, db: Session = Depends(get_db)):
    """Update an existing food item. If dish image is changed or removed, clean up old file from uploads/."""
    food = db.query(models.FoodItem).filter(models.FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    update_data = food_update.dict(exclude_unset=True)

    if "image_url" in update_data:
        new_img = update_data.get("image_url")
        if new_img and "localhost:8000" in new_img:
            new_img = new_img.replace("http://localhost:8000", "")
            update_data["image_url"] = new_img
        old_img = food.image_url
        if old_img and old_img != new_img:
            delete_uploaded_file(old_img)

    for key, value in update_data.items():
        setattr(food, key, value)

    db.commit()
    db.refresh(food)
    return food


@router.patch("/{food_id}/toggle-availability", response_model=schemas.FoodItemResponse)
def toggle_food_availability(food_id: int, db: Session = Depends(get_db)):
    """Quick 1-tap toggle between Available and Sold Out for the day."""
    food = db.query(models.FoodItem).filter(models.FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    food.is_available = not food.is_available
    db.commit()
    db.refresh(food)
    return food


@router.delete("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food(food_id: int, db: Session = Depends(get_db)):
    """Delete a food item, removing its uploaded photo from uploads/ folder if present."""
    food = db.query(models.FoodItem).filter(models.FoodItem.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    if food.image_url:
        delete_uploaded_file(food.image_url)

    db.delete(food)
    db.commit()
    return None


def get_hero_fallback_image(db: Session) -> str:
    """Fetch active right-side Hero Section image URL strictly from database settings to use as fallback."""
    setting = db.query(models.SiteSetting).filter(models.SiteSetting.key == "hero_image").first()
    return setting.value if setting and setting.value else ""


@router.get("/excel-template")
def download_excel_template():
    """Generate and stream a pre-formatted Excel template for adding dishes. Contains dish details only (no image column)."""
    import io
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Dishes Template"

    headers = [
        "name", "category", "price", "is_veg",
        "item_type", "meal_slot", "stock_quantity",
        "prep_time", "description"
    ]
    ws.append(headers)

    header_fill = PatternFill(start_color="C2410C", end_color="C2410C", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    align_center = Alignment(horizontal="center", vertical="center")

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = align_center

    sample_rows = [
        [
            "Kumbakonam Degree Filter Coffee", "Beverages", 45, "TRUE",
            "kitchen", "all_day", "", "5-10 mins",
            "Traditional Kumbakonam filter coffee made from freshly roasted beans and hot milk."
        ],
        [
            "Ambur Special Chicken Biryani", "Biryani", 240, "FALSE",
            "kitchen", "lunch", "", "20-25 mins",
            "Fragrant seeraga samba rice cooked with tender chicken and authentic spices."
        ],
        [
            "Ghee Podi Idli (3 Pcs)", "Tiffin", 95, "TRUE",
            "kitchen", "breakfast", "", "10-15 mins",
            "Steamed soft idlis tossed in pure aromatic ghee and spicy gun powder."
        ],
        [
            "Kumbakonam Kadke Mixture (250g)", "Snacks", 110, "TRUE",
            "inventory", "all_day", 40, "5 mins",
            "Crispy authentic Kumbakonam mixture prepared fresh with cashews and curry leaves."
        ]
    ]

    for row in sample_rows:
        ws.append(row)

    col_widths = {
        "A": 34, "B": 16, "C": 12, "D": 10,
        "E": 14, "F": 14, "G": 16, "H": 15,
        "I": 55
    }
    for col_letter, width in col_widths.items():
        ws.column_dimensions[col_letter].width = width

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    headers_resp = {
        "Content-Disposition": "attachment; filename=OrderUnavu_Dishes_Template.xlsx"
    }
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers_resp
    )


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def bulk_create_foods(foods_in: List[schemas.FoodItemCreate], db: Session = Depends(get_db)):
    """Add multiple food items in a single transaction (admin bulk upload). Falls back to hero section fallback image if omitted."""
    if not foods_in:
        raise HTTPException(status_code=400, detail="Dishes list cannot be empty")

    created = []
    for item in foods_in:
        data = item.dict()
        if not data.get("image_url"):
            data["image_url"] = HERO_SECTION_FALLBACK_IMAGE
        elif "localhost:8000" in data["image_url"]:
            data["image_url"] = data["image_url"].replace("http://localhost:8000", "")
        new_food = models.FoodItem(**data)
        db.add(new_food)
        created.append(new_food)

    db.commit()
    for item in created:
        db.refresh(item)

    return {
        "success": True,
        "count": len(created),
        "message": f"Successfully added {len(created)} dishes to the menu."
    }


@router.post("/upload-excel", status_code=status.HTTP_201_CREATED)
async def upload_excel_dishes(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload an Excel (.xlsx/.xls) or CSV file containing dishes and insert directly into DB."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    filename = file.filename.lower()
    if not (filename.endswith(".xlsx") or filename.endswith(".xls") or filename.endswith(".csv")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx, .xls) and CSV (.csv) files are supported")

    content = await file.read()
    rows = []

    if filename.endswith(".csv"):
        import csv
        import io
        text_stream = io.StringIO(content.decode("utf-8-sig", errors="replace"))
        reader = csv.DictReader(text_stream)
        for r in reader:
            rows.append({k.strip().lower().replace(" ", "_"): v for k, v in r.items() if k})
    else:
        import io
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet = wb.active
        headers = []
        for cell in sheet[1]:
            val = str(cell.value or "").strip().lower().replace(" ", "_")
            headers.append(val)

        for row in sheet.iter_rows(min_row=2, values_only=True):
            if not any(row):
                continue
            row_dict = {}
            for h, v in zip(headers, row):
                if h:
                    row_dict[h] = v
            rows.append(row_dict)

    if not rows:
        raise HTTPException(status_code=400, detail="The uploaded file contains no data rows")

    created_foods = []
    errors = []

    for idx, r in enumerate(rows, start=2):
        name = str(r.get("name") or r.get("dish_name") or "").strip()
        if not name:
            continue

        category = str(r.get("category") or "South Indian").strip()

        raw_price = r.get("price") or r.get("unit_price") or 0
        try:
            price = float(str(raw_price).replace("₹", "").replace("Rs.", "").replace("Rs", "").strip())
        except (ValueError, TypeError):
            errors.append(f"Row {idx} ({name}): Invalid price '{raw_price}'")
            continue

        raw_veg = r.get("is_veg") or r.get("veg") or r.get("diet")
        if raw_veg is not None:
            v_str = str(raw_veg).strip().lower()
            is_veg = v_str in ["true", "1", "yes", "veg", "vegetarian", "pure veg", "y"]
        else:
            is_veg = True

        item_type = str(r.get("item_type") or r.get("type") or "kitchen").strip().lower()
        if item_type not in ["kitchen", "inventory"]:
            item_type = "kitchen"

        meal_slot = str(r.get("meal_slot") or r.get("slot") or r.get("timing") or "all_day").strip().lower()
        if meal_slot not in ["breakfast", "lunch", "dinner", "all_day"]:
            meal_slot = "all_day"

        raw_stock = r.get("stock_quantity") or r.get("stock") or None
        stock_quantity = None
        if raw_stock is not None and str(raw_stock).strip() != "":
            try:
                stock_quantity = int(float(str(raw_stock).strip()))
            except (ValueError, TypeError):
                stock_quantity = None

        prep_time = str(r.get("prep_time") or "15-20 mins").strip()
        description = str(r.get("description") or "").strip() or None
        raw_img = str(r.get("image_url") or r.get("image") or "").strip()
        image_url = raw_img or HERO_SECTION_FALLBACK_IMAGE

        food_item = models.FoodItem(
            name=name,
            category=category,
            price=price,
            is_veg=is_veg,
            item_type=item_type,
            meal_slot=meal_slot,
            stock_quantity=stock_quantity,
            prep_time=prep_time,
            description=description,
            image_url=image_url,
            is_available=True,
            rating=4.5
        )
        db.add(food_item)
        created_foods.append(food_item)

    if not created_foods:
        raise HTTPException(
            status_code=400,
            detail=f"Could not import any dishes. Errors: {'; '.join(errors) if errors else 'No valid rows found'}"
        )

    db.commit()
    for f in created_foods:
        db.refresh(f)

    return {
        "success": True,
        "count": len(created_foods),
        "message": f"Successfully imported {len(created_foods)} dishes from Excel.",
        "warnings": errors if errors else None
    }


