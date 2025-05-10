from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import psycopg2

router = APIRouter()
templates = Jinja2Templates(directory="front")

@router.get("/login", response_class=HTMLResponse)
async def login_form(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login")
async def login(userid: str = Form(...), password: str = Form(...)):
    conn = psycopg2.connect(
        host="localhost",
        dbname="signup_login_test",
        user="postgres",
        password="1234",
        port="5432"
    )
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE userid = %s AND password = %s", (userid, password))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user:
        return {"message": "로그인 성공"}
    else:
        return {"message": "아이디 또는 비밀번호가 일치하지 않습니다"}
