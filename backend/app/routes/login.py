from datetime import timedelta, datetime, timezone

from fastapi import APIRouter, Form, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from jose import jwt
from typing import Optional

from middlewares.auth import verify_token
from models.user_model import UserModel, UserService, TokenModel
from config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM
from db import get_connection

router = APIRouter()

@router.post("/login")
async def login(
    response: Response, 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    userid = UserService.login_user(form_data.username, form_data.password)
    if userid:
        data = {
            "sub":userid,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        access_token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

        response.set_cookie(
            key="session",
            value= access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=1800,
            path="/"
        )
        return {"msg": "로그인 성공"}
    else:
        return JSONResponse(
            status_code=400,
            content={"msg": "아이디 또는 비밀번호가 일치하지 않습니다"}
        )
    
@router.post("/get_token", response_model=TokenModel)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    userid = UserService.login_user(form_data.username, form_data.password)
    if userid:
        data = {
            "sub":userid,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        access_token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

        return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": userid
        }
    else:
        return JSONResponse(
            status_code=400,
            content={"msg": "아이디 또는 비밀번호가 일치하지 않습니다"}
        )

@router.post("/signup")
async def signup(user: UserModel):
    if not user.password2:
        return JSONResponse(
            status_code=400,
            content={"msg": "두번째 패스워드를 입력해주세요"}
        )

    #todo: validation logic ex) password == password2

    if UserService.create_user(user.userid, user.password, user.name,
                               user.phone, user.email, user.org, user.desc):
        return {"msg": "회원가입 성공"}
    else:
        return JSONResponse(
            status_code=400,
            content={"msg": "회원가입 실패"}
        )