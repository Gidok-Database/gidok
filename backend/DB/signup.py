from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import Optional
import psycopg2

router = APIRouter()
templates = Jinja2Templates(directory="front")

@router.get("/signup", response_class=HTMLResponse)
async def signup_form(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@router.post("/signup")
async def signup(name: str = Form(...), userid: str = Form(...), password: str = Form(...), phone: str = Form(...), email: str = Form(...), organization: Optional[str] = Form(None), description: Optional[str] = Form(None)):
    conn = psycopg2.connect(
        host="localhost",
        dbname="signup_login_test",
        user="postgres",
        password="1234",
        port="5432"
    )
    cur = conn.cursor()
    cur.execute("INSERT INTO users (name, userid, password, phone, email, organization, description) VALUES (%s, %s, %s, %s, %s, %s, %s)", (name, userid, password, phone, email, organization, description))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "회원가입 성공"}
