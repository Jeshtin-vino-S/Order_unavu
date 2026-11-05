import logging
import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

logger = logging.getLogger("order_unavu_db")

def ensure_database_exists():
    """Connect to MySQL without a specific database and create DB_NAME if it doesn't exist."""
    # If a full cloud DATABASE_URL is set or remote host, attempt check gracefully
    try:
        connect_kwargs = {
            "host": settings.DB_HOST,
            "port": int(settings.DB_PORT),
            "user": settings.DB_USER,
            "password": settings.DB_PASSWORD
        }
        if settings.DB_SSL or (settings.DB_HOST and settings.DB_HOST not in ("localhost", "127.0.0.1")):
            connect_kwargs["ssl"] = {"check_hostname": False}

        conn = pymysql.connect(**connect_kwargs)
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` "
                    f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
                )
            conn.commit()
            logger.info(f"Verified/Created MySQL Database: `{settings.DB_NAME}`")
        finally:
            conn.close()
    except Exception as e:
        if settings.DB_HOST in ("localhost", "127.0.0.1"):
            logger.error(f"Failed to verify/create database '{settings.DB_NAME}': {e}")
            raise e
        else:
            logger.warning(f"Note: Cloud MySQL DB check skipped/existing: {e}")

# SQLAlchemy Engine (lazy connection)
DATABASE_URL = settings.get_database_url()

engine_connect_args = {}
if settings.DB_SSL or (settings.DB_HOST and settings.DB_HOST not in ("localhost", "127.0.0.1")):
    engine_connect_args["ssl"] = {"check_hostname": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=engine_connect_args,
    pool_recycle=3600,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def run_migrations():
    """Ensure any newly added columns exist in existing MySQL tables."""
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            # Check is_admin column in users table
            res = conn.execute(
                text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_admin'"),
                {"db_name": settings.DB_NAME}
            ).fetchone()
            if not res:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;"))
                conn.commit()
                logger.info("Migrated schema: Added 'is_admin' column to users table.")

            # Check profile_image column in users table
            res_profile_img = conn.execute(
                text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_image'"),
                {"db_name": settings.DB_NAME}
            ).fetchone()
            if not res_profile_img:
                conn.execute(text("ALTER TABLE users ADD COLUMN profile_image LONGTEXT DEFAULT NULL;"))
                conn.commit()
                logger.info("Migrated schema: Added 'profile_image' column to users table.")

            # Check item_type column in food_items table
            res_item_type = conn.execute(
                text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = 'food_items' AND COLUMN_NAME = 'item_type'"),
                {"db_name": settings.DB_NAME}
            ).fetchone()
            if not res_item_type:
                conn.execute(text("ALTER TABLE food_items ADD COLUMN item_type VARCHAR(20) DEFAULT 'kitchen';"))
                conn.commit()
                logger.info("Migrated schema: Added 'item_type' column to food_items table.")

            # Check meal_slot column in food_items table
            res_meal_slot = conn.execute(
                text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = 'food_items' AND COLUMN_NAME = 'meal_slot'"),
                {"db_name": settings.DB_NAME}
            ).fetchone()
            if not res_meal_slot:
                conn.execute(text("ALTER TABLE food_items ADD COLUMN meal_slot VARCHAR(30) DEFAULT 'all_day';"))
                conn.commit()
                logger.info("Migrated schema: Added 'meal_slot' column to food_items table.")

            # Check stock_quantity column in food_items table
            res_stock = conn.execute(
                text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = 'food_items' AND COLUMN_NAME = 'stock_quantity'"),
                {"db_name": settings.DB_NAME}
            ).fetchone()
            if not res_stock:
                conn.execute(text("ALTER TABLE food_items ADD COLUMN stock_quantity INT DEFAULT NULL;"))
                conn.commit()
                logger.info("Migrated schema: Added 'stock_quantity' column to food_items table.")

            # Backfill existing categories if they are still unclassified
            conn.execute(text("""
                UPDATE food_items 
                SET item_type = 'inventory', meal_slot = 'all_day', stock_quantity = 30 
                WHERE (category IN ('Drinks', 'Snacks') OR LOWER(name) LIKE '%drink%' OR LOWER(name) LIKE '%soda%' OR LOWER(name) LIKE '%bovonto%') 
                AND (item_type = 'kitchen' OR stock_quantity IS NULL);
            """))
            conn.execute(text("""
                UPDATE food_items 
                SET item_type = 'kitchen', meal_slot = 'lunch' 
                WHERE category IN ('Biryani', 'Meals', 'South Indian', 'Starters') AND meal_slot = 'all_day';
            """))
            conn.execute(text("""
                UPDATE food_items 
                SET item_type = 'kitchen', meal_slot = 'breakfast' 
                WHERE category IN ('Tiffin') AND meal_slot = 'all_day';
            """))

            # Create cart_items table if not exists
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS cart_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    food_id INT NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_cart_user (user_id),
                    INDEX idx_cart_food (food_id),
                    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    CONSTRAINT fk_cart_food FOREIGN KEY (food_id) REFERENCES food_items(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """))

            # Create wishlist_items table if not exists
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS wishlist_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    food_id INT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_wishlist_user (user_id),
                    INDEX idx_wishlist_food (food_id),
                    UNIQUE KEY uq_user_food (user_id, food_id),
                    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    CONSTRAINT fk_wishlist_food FOREIGN KEY (food_id) REFERENCES food_items(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """))
            conn.commit()
            logger.info("Migrated schema: cart_items and wishlist_items tables verified.")
    except Exception as e:
        logger.warning(f"Schema migration warning: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
