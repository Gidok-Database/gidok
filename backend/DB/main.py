from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from signup import router as signup_router
from login import router as login_router

app = FastAPI()

# 템플릿 폴더 등록
templates = Jinja2Templates(directory="front")

# 라우터에 templates 객체 넘기기
app.include_router(signup_router)
app.include_router(login_router)
