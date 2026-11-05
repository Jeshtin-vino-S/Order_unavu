import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, SessionLocal, ensure_database_exists, run_migrations
from config import settings
import models
from routes import foods, orders, auth, admin, cart, wishlist

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("order_unavu")

# Ensure uploads directory exists for image uploads
uploads_dir = Path(__file__).resolve().parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize MySQL tables
    logger.info("Initializing MySQL Database tables...")
    try:
        ensure_database_exists()
        Base.metadata.create_all(bind=engine)
        run_migrations()
        logger.info(f"MySQL tables verified on '{settings.DB_NAME}'.")

        # Verify admin user in database (from .env)
        db = SessionLocal()
        try:
            admin.ensure_db_admin_exists(db)
            logger.info("Admin user verified in MySQL database.")
        finally:
            db.close()
    except Exception as e:
        logger.critical(f"FATAL: MySQL Database connection failed: {e}")
        raise e

    yield
    # Shutdown logic (if any)
    logger.info("Order Unavu backend shutting down.")

app = FastAPI(
    title="Order Unavu API",
    description="Backend API for Order Unavu - Pure MySQL Food Ordering Platform",
    version="1.0.0",
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
    lifespan=lifespan
)

# CORS configuration strictly from .env
if "*" in settings.CORS_ORIGINS or not settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Static file serving for uploaded images
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include API Routers
app.include_router(foods.router)
app.include_router(orders.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(cart.router)
app.include_router(wishlist.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "MySQL",
        "service": "Order Unavu Backend"
    }

# Serve production React frontend if built (Single-Service Unified Deployment)
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Allow missing API and Uploads requests to return proper 404 instead of HTML
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            raise HTTPException(status_code=404, detail="Not Found")

        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)

        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(index_file)

        return {"status": "online", "app": "Order Unavu Unified Service"}
else:
    @app.get("/")
    def root():
        return {
            "status": "online",
            "app": "Order Unavu API",
            "database": f"MySQL ({settings.DB_NAME})",
            "version": "1.0.0",
            "endpoints": {
                "foods": "/api/foods",
                "categories": "/api/foods/categories",
                "orders": "/api/orders"
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=True
    )
