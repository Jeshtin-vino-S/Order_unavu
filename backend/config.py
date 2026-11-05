import os
from urllib.parse import urlparse
from pathlib import Path
from dotenv import load_dotenv

# Load .env file explicitly from backend folder
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE, override=True)

# Parse DATABASE_URL if present to populate defaults
_raw_db_url = os.getenv("DATABASE_URL", "")
_parsed_db = None
if _raw_db_url:
    try:
        _parsed_db = urlparse(_raw_db_url.replace("mysql+pymysql://", "mysql://"))
    except Exception:
        pass

class Settings:
    # Database Settings (Local or Free Live Cloud DB like TiDB Cloud / Aiven)
    DATABASE_URL: str = _raw_db_url
    DB_HOST: str = os.getenv("DB_HOST", (_parsed_db.hostname if _parsed_db and _parsed_db.hostname else "localhost"))
    DB_PORT: str = os.getenv("DB_PORT", (str(_parsed_db.port) if _parsed_db and _parsed_db.port else "3306"))
    DB_USER: str = os.getenv("DB_USER", (_parsed_db.username if _parsed_db and _parsed_db.username else "root"))
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", (_parsed_db.password if _parsed_db and _parsed_db.password else ""))
    DB_NAME: str = os.getenv("DB_NAME", (_parsed_db.path.lstrip("/") if _parsed_db and _parsed_db.path else "order_unavu_db"))
    DB_SSL: bool = os.getenv("DB_SSL", "true" if _raw_db_url else "false").lower() in ("true", "1", "yes")

    # Server Settings
    SERVER_HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("PORT", os.getenv("SERVER_PORT", "8000")))
    BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
    ENABLE_DOCS: bool = os.getenv("ENABLE_DOCS", "false").lower() == "true"

    # CORS Settings
    CORS_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]

    # Business / Order Settings
    DELIVERY_FEE: float = float(os.getenv("DELIVERY_FEE", "35.0"))
    FREE_DELIVERY_THRESHOLD: float = float(os.getenv("FREE_DELIVERY_THRESHOLD", "500.0"))
    TAX_RATE: float = float(os.getenv("TAX_RATE", "0.05"))

    # Security Configuration
    PASSWORD_SALT: str = os.getenv("PASSWORD_SALT", "order_unavu_secure_salt_0000_kumbakonam_2026")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "order_unavu_jwt_secret_token_key_kumbakonam")

    # Default Admin Configuration for MySQL Database
    ADMIN_DEFAULT_USERNAME: str = os.getenv("ADMIN_DEFAULT_USERNAME", "admin")
    ADMIN_DEFAULT_PASSWORD: str = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin123")
    ADMIN_DEFAULT_EMAIL: str = os.getenv("ADMIN_DEFAULT_EMAIL", "admin@orderunavu.com")
    ADMIN_DEFAULT_NAME: str = os.getenv("ADMIN_DEFAULT_NAME", "System Admin")

    @classmethod
    def get_database_url(cls) -> str:
        # If full connection URL is provided (common in cloud providers)
        if cls.DATABASE_URL and cls.DATABASE_URL.strip():
            url = cls.DATABASE_URL.strip()
            if url.startswith("mysql://"):
                url = "mysql+pymysql://" + url[len("mysql://"):]
            return url

        # Validate that all required MySQL credentials are provided
        missing = []
        if not cls.DB_HOST:
            missing.append("DB_HOST")
        if not cls.DB_PORT:
            missing.append("DB_PORT")
        if not cls.DB_USER:
            missing.append("DB_USER")
        if not cls.DB_NAME:
            missing.append("DB_NAME")

        if missing:
            raise ValueError(
                f"Missing required MySQL environment variables in .env: {', '.join(missing)}"
            )

        # Build MySQL PyMySQL connection URL
        return (
            f"mysql+pymysql://{cls.DB_USER}:{cls.DB_PASSWORD}@"
            f"{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
        )

settings = Settings()
