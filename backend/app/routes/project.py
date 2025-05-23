from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional

from middlewares.get_user import get_current_user
from models.user_model import UserModel, UserService
from models.project_model import ProjectModel, ProjectService
from models.commit_model import Commit

router = APIRouter()

@router.post("/")
async def create(project_form: ProjectModel, 
                 user: UserModel = Depends(get_current_user)):
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
        )

    if not project_form.name or project_form.name.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="프로젝트 이름(name)은 필수 항목입니다."
        )

    project = ProjectService.create_project(project_form.name,
                                            project_form.org,
                                            project_form.desc)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="프로젝트 생성에 실패 했습니다. 입력 값을 확인해 주세요."
        )
    
    project.add_admin(user._id)
    
    return {"detail": "프로젝트 생성을 성공했습니다.", 
            "project_id": project.project._id}

@router.get("/search")
def search_project(name: str = "", start: int = 0, end: int = 10, 
                   order: str = "ASC", role: Optional[str] = None, userid: Optional[str] = None):
    
    if order not in ["ASC", "DESC"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="order 값은 ASC 또는 DESC 값 중 하나여야 합니다.",
        )
    if role not in [None, "admin", "member", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="role 값은 admin, member, viewer 값 중 하나여야 합니다.",
        )
    if role and not userid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="order 값은 ASC 또는 DESC 값 중 하나여야 합니다.",
        )
    columns = ["id", "name", "organization", "description"]
    projects = [
        dict(zip(columns, row))
        for row in ProjectService.search_project(name=name, start=start,
                                end=end, order=order, role=role, userid=userid)
    ]

    return projects

@router.get("/{project_id}")
async def view(project_id: int, page: int, mode: Optional[str] = None,
         hash: Optional[str] = None,
         user: UserModel = Depends(get_current_user)):
    if user == None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
        )
    
    project = ProjectService.get_project(project_id)
    auth_level = project.get_user_auth_level(user)
    
    if auth_level >= 3 \
       or (auth_level == 2 and mode != "release"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="프로젝트를 읽을 권한이 없습니다.",
        )
    
    
    if hash:
        commit = Commit.get_commit(hash=hash, project=project)
    else:
        commit = None
    
    page = project.get_page(mode=mode, page=page, user=user, commit=commit)
    if page == None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="페이지를 갖고 오는데 실패 했습니다.",
        )

    return {"docs":page}

@router.patch("/{project_id}")
def edit(project_id: int, role: str, userid: str, 
         current_user: UserModel = Depends(get_current_user)):
    if current_user == None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
        )
    if role not in ["admin", "member", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="role 값은 admin, member, viewer 중 하나여야 합니다.",
        )
    
    project = ProjectService.get_project(project_id)
    auth_level = project.get_user_auth_level(current_user)
    
    if auth_level != 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="관리자만 가능합니다.",
        )
    
    user = UserService.get_user(userid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="해당 유저가 없습니다.",
        )
    
    if not project.add_user_role(user, role):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="권한 변경을 실패 했습니다.",
        )

    return {"detail": "유저 권한을 성공적으로 변경했습니다."}
    
@router.get("/{project_id}/users")
def get_user_info(project_id: int, 
                  user_id: Optional[str] = None,
                  user_name: str = "",
                  user: UserModel = Depends(get_current_user)):
    if user == None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
        )
    
    columns = ["userid", "name", "role"]
    users = [
        dict(zip(columns, row))
        for row in ProjectService.get_users(project_id, user_id,user_name)
    ]

    return users