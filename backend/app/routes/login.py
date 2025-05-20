from datetime import timedelta, datetime, timezone

from fastapi import APIRouter, Form, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from jose import jwt
from typing import Optional

from middlewares.get_user import get_current_user
from models.user_model import UserModel, UserService, TokenModel
from config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 일치하지 않습니다",
        )

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="session", path="/")
    return {"msg": "로그아웃 완료"}

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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 일치하지 않습니다",
        )

@router.post("/signup")
async def signup(user: UserModel):
    if not user.userid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID를 입력해주세요",
        )
    
    if not user.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이름을 입력해주세요",
        )
    
    if not user.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호를 입력해주세요",
        )
    
    if not user.password2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호를 입력해주세요",
        )
    
    if not user.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="전화번호를 입력해주세요",
        )
    
    if not user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이메일을 입력해주세요",
        )
    
    if not user.password == user.password2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호가 일치하지 않습니다",
        )

    if UserService.create_user(user.userid, user.password, user.name,
                               user.phone, user.email, user.org, user.desc):
        return {"msg": "회원가입 성공"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="회원가입 실패",
        )
        
    
@router.get("/")
def search_user(user_id: Optional[str] = None, 
                user_name: Optional[str] = None, 
                user_email: Optional[str] = None, 
                start: int = 0,
                end: int = 10,
                order: str = "ASC"):
    if order not in ["ASC", "DESC"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="정렬 방식이 잘못되었습니다.",
        )
    columns = ["name", "userid", "email", "organization", "description"]
    users = [
        dict(zip(columns, row))
        for row in UserService.search_user(user_id=user_id, user_name=user_name,
                                user_email=user_email, start=start,
                                end=end, order=order)
    ]
    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="검색하신 유저를 찾을 수 없습니다.",
        )
    
    return users

@router.get("/me")
def validation_me(user: UserModel = Depends(get_current_user)):
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
        )
    
    return {"userid": user.userid, "name": user.name}