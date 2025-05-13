import os

DB_USER = os.getenv("DB_USER", "app")
DB_PASSWORD = os.getenv("DB_PASSWORD", "yourAppPassword")
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "gidok")

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
SECRET_KEY = os.urandom(32).hex()
ALGORITHM = "HS256"