import bcrypt

from psycopg2.extensions import cursor
from pydantic import BaseModel, PrivateAttr
from typing import Optional
from db import get_connection


class UserModel(BaseModel):
    _id: int = PrivateAttr()
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    userid: str
    password: str
    password2: Optional[str] = None 
    org: Optional[str] = None
    desc: Optional[str] = None


class TokenModel(BaseModel):
    access_token: str
    token_type: str
    user_id: str


class UserService:
    def __init__(self, user: UserModel):
        self.user = user
        
    @staticmethod
    def create_user(userid: str, password: str, name: str,
                    phone: Optional[str] = None, email: Optional[str] = None,
                    org: Optional[str] = None, desc: Optional[str] = None):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """\
                INSERT INTO users (name, userid, password, phone, email, organization, description)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, 
                (name, userid, 
                 bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(), 
                 phone, email, org, desc)
            )
            conn.commit()
        except Exception as e:
            # todo: raise
            print(e)
            return False
        finally:
            conn.close()
        return True

    @staticmethod
    def login_user(userid: str, password: str):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT * FROM  users WHERE userid = %s",
                (userid,)
            )
            user = cur.fetchone()
        except Exception as e:
            # todo: raise
            print(e)
            return None
        finally:
            conn.close()
        if not user or not bcrypt.checkpw(password.encode(), user["password"].encode()):
            return None
        
        return user["userid"]

    @staticmethod
    def get_user(user_id):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT * FROM  users WHERE userid = %s",
                (user_id,)
            )
            user = cur.fetchone()
        except:
            # todo: raise
            return None
        finally:
            conn.close()
        if not user:
            return None
        user_model = UserModel(
            name = user["name"],
            userid = user["userid"],
            password = ""
        )
        user_model._id = user["id"]
        return user_model    

    @staticmethod
    def get_user_by_id(id, cursor: cursor):
        cursor.execute(
            "SELECT * FROM  users WHERE id = %s",
            (id,)
        )
        user = cursor.fetchone()
        
        if not user:
            return None
        user_model = UserModel(
            name = user["name"],
            userid = user["userid"],
            password = ""
        )
        user_model._id = id
        return user_model   
