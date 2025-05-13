from pydantic import BaseModel, PrivateAttr
from typing import Optional


class User(BaseModel):
    _id: int = PrivateAttr()
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    userid: str
    password: str
    org: Optional[str] = None
    desc: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    userid: int