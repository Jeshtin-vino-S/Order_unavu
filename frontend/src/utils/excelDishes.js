export const DEFAULT_DISH_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80";

/**
 * Category-based authentic food image helper when Excel does not contain images.
 */
export const getCategoryFoodImage = (category, isVeg) => {
  const c = (category || "").toLowerCase();
  if (c.includes("biryani")) {
    return isVeg
      ? "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500"
      : "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500";
  }
  if (c.includes("beverage") || c.includes("coffee") || c.includes("tea") || c.includes("drink")) {
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500";
  }
  if (c.includes("tiffin") || c.includes("dosa") || c.includes("idli") || c.includes("parotta") || c.includes("poori")) {
    return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500";
  }
  if (c.includes("snack") || c.includes("mixture") || c.includes("sweet") || c.includes("dessert")) {
    return "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500";
  }
  if (c.includes("starter")) {
    return isVeg
      ? "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500"
      : "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500";
  }
  return "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500";
};

/**
 * Generate and download an authentic Excel template (.xlsx) for bulk uploading dishes.
 * Exclusively contains dish details (no image column required).
 */
export const downloadDishesTemplateXLSX = async () => {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const data = [
    [
      "name", "category", "price", "is_veg",
      "item_type", "meal_slot", "stock_quantity",
      "prep_time", "description"
    ],
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
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 34 }, // name
    { wch: 16 }, // category
    { wch: 12 }, // price
    { wch: 10 }, // is_veg
    { wch: 14 }, // item_type
    { wch: 14 }, // meal_slot
    { wch: 16 }, // stock_quantity
    { wch: 15 }, // prep_time
    { wch: 55 }  // description
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Dishes Template");
  XLSX.writeFile(wb, "OrderUnavu_Dishes_Template.xlsx");
};

/**
 * Parse an Excel (.xlsx / .xls) or CSV file in the browser, validate rows, and return items.
 * If image is not provided, defaults to the active Hero section image.
 */
export const parseDishesExcelFile = async (file, fallbackHeroImage = '') => {
  const XLSX = await import('xlsx');
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const validItems = [];
  const errors = [];

  jsonRows.forEach((r, idx) => {
    // Normalize keys to lowercase trimmed
    const normalized = {};
    Object.keys(r).forEach(k => {
      const cleanKey = k.trim().toLowerCase().replace(/\s+/g, '_');
      normalized[cleanKey] = r[k];
    });

    const name = String(normalized.name || normalized.dish_name || "").trim();
    if (!name) return; // skip empty rows

    const category = String(normalized.category || "South Indian").trim();

    const rawPrice = normalized.price ?? normalized.unit_price;
    const priceNum = parseFloat(String(rawPrice).replace(/[^\d.]/g, ''));
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.push(`Row ${idx + 2} ("${name}"): Invalid or missing price (${rawPrice}).`);
      return;
    }

    const rawVeg = normalized.is_veg ?? normalized.veg ?? normalized.diet;
    let is_veg = true;
    if (rawVeg !== undefined && rawVeg !== "") {
      const vStr = String(rawVeg).trim().toLowerCase();
      is_veg = ["true", "1", "yes", "veg", "vegetarian", "pure veg", "y"].includes(vStr);
    }

    let item_type = String(normalized.item_type || normalized.type || "kitchen").trim().toLowerCase();
    if (!["kitchen", "inventory"].includes(item_type)) item_type = "kitchen";

    let meal_slot = String(normalized.meal_slot || normalized.slot || normalized.timing || "all_day").trim().toLowerCase();
    if (!["breakfast", "lunch", "dinner", "all_day"].includes(meal_slot)) meal_slot = "all_day";

    let stock_quantity = null;
    const rawStock = normalized.stock_quantity ?? normalized.stock;
    if (rawStock !== undefined && rawStock !== "" && rawStock !== null) {
      const sNum = parseInt(String(rawStock).replace(/[^\d]/g, ''), 10);
      if (!isNaN(sNum)) stock_quantity = sNum;
    }

    const prep_time = String(normalized.prep_time || "15-20 mins").trim();
    const description = String(normalized.description || "").trim() || null;
    
    // Dish details only: use uploaded image or hero section fallback image
    const rawImage = String(normalized.image_url || normalized.image || "").trim();
    const image_url = rawImage || DEFAULT_DISH_FALLBACK_IMAGE;

    validItems.push({
      name,
      category,
      price: priceNum,
      is_veg,
      item_type,
      meal_slot,
      stock_quantity,
      prep_time,
      description,
      image_url,
      is_available: true,
      rating: 4.5
    });
  });

  return { validItems, errors, totalRows: jsonRows.length };
};
