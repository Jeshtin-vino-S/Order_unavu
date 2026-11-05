import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file explicitly from backend folder
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE, override=True)

class Settings:
    # Database Settings (Local or Free Live Cloud DB like TiDB Cloud / Aiven)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "order_unavu_db")
    DB_SSL: bool = os.getenv("DB_SSL", "false").lower() in ("true", "1", "yes")

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
