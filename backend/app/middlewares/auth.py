from fastapi import Depends, HTTPException, Cookie
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from starlette import status
from jose import jwt, JWTError

from models.user_model import UserService
from config import SECRET_KEY, ALGORITHM
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/get_token")

def verify_token(
        token_cookie: str = Cookie(None),
        token_oauth: str = Depends(oauth2_scheme)
    ):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="로그인이 필요합니다.",
    )
    if token_cookie:
        token = token_cookie
    elif token_oauth:
        token = token_oauth
    else:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        print(e)
        raise credentials_exception
    else:
        user = UserService.get_user(user_id)
        
        if not user:
            raise credentials_exception
        
        return user

