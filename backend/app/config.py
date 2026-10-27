from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Database settings come from environment variables, not from code.

    Inside Docker Compose, DB_HOST must be the MySQL *service name* (mysql).
    Do not use localhost when the backend runs in a container.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DB_HOST: str = "mysql"
    DB_PORT: int = 3306
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str


settings = Settings()
