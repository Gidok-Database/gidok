from fastapi import APIRouter, Form
from fastapi.responses import JSONResponse
from typing import Optional

from ..db import get_connection

router = APIRouter()

@router.post("/login")
async def login(userid: str = Form(...), password: str = Form(...)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE userid = %s AND password = %s", (userid, password))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user:
        return JSONResponse({"message": "로그인 성공"})
    else:
        return JSONResponse({"message": "아이디 또는 비밀번호가 일치하지 않습니다"})


@router.post("/signup")
async def signup(name: str = Form(...), userid: str = Form(...), password: str = Form(...), phone: str = Form(...), email: str = Form(...), organization: Optional[str] = Form(None), description: Optional[str] = Form(None)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (name, userid, password, phone, email, organization, description) VALUES (%s, %s, %s, %s, %s, %s, %s)", (name, userid, password, phone, email, organization, description))
    conn.commit()
    cur.close()
    conn.close()
    return JSONResponse({"message": "회원가입 성공"})