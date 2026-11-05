# 🍲 Order Unavu - Authentic Kumbakonam Food Ordering Platform

A modern, production-ready Fullstack Food Ordering Web Application featuring **React 18 + Vite** on the frontend, **FastAPI + SQLAlchemy** on the backend, and **Pure MySQL (TiDB Cloud / Local MySQL)** as the database engine.

> *"Order pannunga, saapdunga."* — Fresh South Indian vegetarian & non-vegetarian delicacies delivered hot.

---

## 🌟 Key Features

* **Pure MySQL Architecture**: Zero SQLite or mock data fallbacks. Strictly connected to live MySQL (TiDB Cloud Serverless).
* **Single-Service Fullstack Deployment**: Frontend (React SPA) and Backend (FastAPI API) can be built and deployed together on a **single web service** (e.g. Render.com) under one domain and port.
* **Authentication & User Management**:
  * Phone/Email authentication with SHA-256 salted hashing and JWT tokens.
  * Personal profile management with custom profile avatar photo uploads.
  * Secure password change with verification against current password in DB.
* **Menu & Dish Catalog**:
  * Real-time category filtering (Biryani, Tiffin, Meals, Starters, Beverages, etc.).
  * Diet filtering (Pure Veg & Non-Veg indicators).
  * Meal slot badges (Morning Tiffin 7-11 AM, Lunch 12-3:30 PM, Dinner 7-10:30 PM, Packaged Inventory).
  * Out-of-stock and real-time inventory quantity badges.
* **Wishlist & Cart Synchronization**:
  * Authenticated user-scoped cart and wishlist persisted directly in MySQL tables (`cart_items`, `wishlist_items`).
  * 1-Click **"Move to Cart"** from wishlist: adds to cart and immediately unlinks/deletes from the wishlist in DB and state.
* **Checkout & Live PDF Receipts**:
  * Delivery address input, coupon code verification, live delivery fee & tax calculation.
  * Order confirmation and detailed order summary page.
  * Instant downloadable PDF invoice/receipt generated dynamically via `jsPDF`.
* **Admin Management Portal**:
  * Real-time dashboard with revenue, order statistics, and customer metrics.
  * Dish management: Add, edit, delete, toggle availability (Available / Sold Out).
  * Bulk dish import via Excel (`.xlsx` / `.xls` / `.csv`) spreadsheet with auto-downloadable pre-formatted template.
  * Visual food image cropping tool with 16:10 / 1:1 aspect ratio selectors.
  * Hero Section banner custom upload with visual editor and **🗑️ Remove Photo** option.
  * Complete physical file cleanup: deleting or replacing images automatically removes files from `backend/uploads/` on disk.

---

## 🏗️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Context API, Lucide/Custom Icons, jsPDF, SheetJS (XLSX) |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy 2.0, PyMySQL, Pydantic v2, Python-Multipart |
| **Database** | MySQL 8.0+ / TiDB Cloud Serverless (5GB Free Forever) |
| **Deployment** | Render.com (Unified Single-Service Web App) |

---

## 📁 Project Structure

```text
ORDER_UNAVU/
├── README.md                 # Complete project documentation
├── .gitignore                # Production git ignore (secrets & uploads protected)
├── run_all.bat               # 1-Click launcher for both servers locally
│
├── backend/                  # FastAPI Python Backend
│   ├── main.py               # FastAPI entrypoint & static React SPA mounting
│   ├── database.py           # SQLAlchemy engine, session & auto-migrations
│   ├── models.py             # MySQL ORM models (User, FoodItem, Order, CartItem, etc.)
│   ├── schemas.py            # Pydantic request & response validation schemas
│   ├── config.py             # Centralized settings loader from .env
│   ├── storage.py            # Physical file deletion & upload cleanup helper
│   ├── requirements.txt      # Python dependencies
│   ├── run.bat               # 1-Click backend launcher
│   ├── .env.example          # Template for backend environment variables
│   ├── routes/
│   │   ├── admin.py          # Admin login, hero banner, image upload & delete
│   │   ├── auth.py           # User login, registration, avatar upload & profile
│   │   ├── cart.py           # User-scoped cart persistence in MySQL
│   │   ├── foods.py          # Food catalog, filtering, bulk Excel upload
│   │   ├── orders.py         # Order placement, status tracking & customer orders
│   │   └── wishlist.py       # User-scoped wishlist operations & DB remove
│   └── uploads/              # Local uploaded images directory (.gitkeep)
│
└── frontend/                 # React 18 + Vite Frontend
    ├── index.html            # Main HTML document
    ├── vite.config.js        # Vite configuration
    ├── package.json          # Node dependencies & build scripts
    ├── run.bat               # 1-Click frontend launcher
    ├── .env.example          # Template for frontend environment variables
    ├── public/
    │   ├── _redirects        # Single Page App routing rewrite for production hosts
    │   └── logos/            # Order Unavu official brand assets
    └── src/
        ├── App.jsx           # Root React routing component
        ├── main.jsx          # React DOM entry point
        ├── index.css         # Clean custom typography, design system & CSS vars
        ├── components/
        │   ├── AdminPortal.jsx       # Complete administrative dashboard & tools
        │   ├── CartCheckout.jsx      # Slide-out cart & checkout drawer
        │   ├── DishCard.jsx          # Responsive food item card
        │   ├── Footer.jsx            # Brand footer & info
        │   ├── Home.jsx              # Landing page hero banner & highlights
        │   ├── Icons.jsx             # SVG icons system
        │   ├── ImageCropperModal.jsx # Visual canvas image cropper
        │   ├── MenuPage.jsx          # Comprehensive food catalog & filters
        │   ├── Modals.jsx            # Sign-in & registration dialogs
        │   ├── Navbar.jsx            # Navigation bar with badges & user menu
        │   ├── OrderConfirmation.jsx # Post-order celebration & next steps
        │   ├── OrderDetailsPage.jsx  # Orders list & PDF receipt generator
        │   ├── ProductDetailsPage.jsx# Single dish deep view
        │   ├── ProfilePage.jsx       # User profile & password reset
        │   └── WishlistPage.jsx      # Saved items & 1-click Move to Cart
        ├── config/
        │   └── api.js                # Dynamic API Base URL resolver
        ├── context/
        │   └── CartContext.jsx       # Global application state & MySQL sync
        └── utils/
            ├── excelDishes.js        # Bulk Excel generator & client parser
            └── generateReceipt.js    # Clean jsPDF invoice template
```

---

## 💻 Local Development Setup

### Prerequisites
* Python 3.10+
* Node.js 18+ & npm
* MySQL Server (Local MySQL / XAMPP / TiDB Cloud)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` (or copy from `backend/.env.example`):
```env
DATABASE_URL=mysql+pymysql://<username>:<password>@<host>:4000/<database_name>
DB_SSL=true
SERVER_HOST=127.0.0.1
SERVER_PORT=8000
BACKEND_BASE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
PASSWORD_SALT=your_secure_salt_here
JWT_SECRET_KEY=your_jwt_secret_token_here
ADMIN_DEFAULT_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=your_admin_password
```

Start backend:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Quick 1-Click Launch (Windows)
Double-click `run_all.bat` in the project root to start both backend and frontend simultaneously.

