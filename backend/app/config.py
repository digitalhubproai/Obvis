from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    openrouter_api_key: str
    openrouter_model: str = "qwen/qwen3.6-plus:free"
    openrouter_vision_model: str = "qwen/qwen3.6-plus:free"
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 10
    allowed_extensions: str = "pdf,jpg,jpeg,png,webp,tiff,tif,bmp,gif"
    allowed_origins: str = "http://localhost:3000"
    rate_limit_per_minute: int = 60

    class Config:
        env_file = ".env"

settings = Settings()

ALLOWED_EXTENSIONS = set(settings.allowed_extensions.split(","))
