import psycopg2
from psycopg2.extras import DictCursor

from config import DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT

def get_connection():
    return psycopg2.connect(dbname=DB_NAME, 
                            user=DB_USER, 
                            password=DB_PASSWORD,
                            host=DB_HOST,
                            port=DB_PORT,
                            cursor_factory=DictCursor)
