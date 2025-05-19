from fastapi import Depends, HTTPException, Cookie
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from starlette import status
from jose import jwt, JWTError
from typing import Optional

from models.user_model import UserService
from config import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/get_token", 
                                     auto_error=False)

def get_current_user(
        session: Optional[str] = Cookie(None),
        token_oauth: Optional[str] = Depends(oauth2_scheme)
    ):
    if session:
        token = session
    elif token_oauth:
        token = token_oauth
    else:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError as e:
        print(e)
        return None
    else:
        user = UserService.get_user(user_id)
        
        if not user:
            return None
        
        return user

