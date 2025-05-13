from datetime import timedelta, datetime, timezone

from fastapi import APIRouter, Form, Depends
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from typing import Optional

from models.user_model import User, Token
from config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM
from db import get_connection

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE userid = %s AND password = %s", (form_data.username, form_data.password))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user:
        data = {
            "uid":user["id"],
            "name":user["name"],
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        access_token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "userid": user["id"]
        }
    else:
        return {"message": "아이디 또는 비밀번호가 일치하지 않습니다"}


@router.post("/signup")
async def signup(user: User):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """\
        INSERT INTO users (name, userid, password, phone, email, organization, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, 
        (user.name, user.userid, user.password, user.phone, user.email, user.org, user.desc)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "회원가입 성공"}