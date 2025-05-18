from fastapi import APIRouter, Depends
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
    if user == None:
        return JSONResponse(
            status_code=400,
            content={"msg": "로그인이 필요합니다."}
        )

    project = ProjectService.create_project(project_form.name,
                                            project_form.org,
                                            project_form.desc)
    if not project:
        return JSONResponse(
            status_code=400,
            content={"msg": "프로젝트 생성 실패"}
        )
    
    if not project.add_admin(user._id):
        return JSONResponse(
            status_code=400,
            content={"msg": "관리자 권한 할당 실패"}
        )

    
    return {"msg": "프로젝트 생성 성공", 
            "project_id": project.project._id}

@router.get("/search")
def search_project(name: str = "", start: int = 0, end: int = 10, 
                   order: str = "ASC", role: Optional[str] = None, userid: Optional[str] = None):
    
    if order not in ["ASC", "DESC"]:
        return {"msg": "error"}
    if role not in [None, "admin", "member", "viewer"]:
        return {"msg": "error"}
    if role and not userid:
        return {"msg": "error"}
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
        return JSONResponse(
            status_code=400,
            content={"msg": "로그인이 필요합니다."}
        )
    project = ProjectService.get_project(project_id)
    auth_level = project.get_user_auth_level(user)
    
    if auth_level >= 3 \
       or (auth_level == 2 and mode != "release"):
        return {"msg": "페이지가 없거나 권한이 없음"}
    
    
    if hash:
        commit = Commit.get_commit(hash=hash, project=project)
    else:
        commit = None
    
    page = project.get_page(mode=mode, page=page, user=user, commit=commit)
    if page == None:
        return {"msg": "페이지가 없거나 권한이 없음"}

    return {"docs":page}

@router.patch("/{project_id}")
def edit(project_id: int, role: str, userid: str, 
         current_user: UserModel = Depends(get_current_user)):
    if current_user == None:
        return {"msg": "로그인이 필요합니다."}
    if role not in ["admin", "member", "viewer"]:
        return {"msg": "error"}
    
    project = ProjectService.get_project(project_id)
    auth_level = project.get_user_auth_level(current_user)
    
    if auth_level != 0:
        return {"msg": "권한이 없음"}
    
    user = UserService.get_user(userid)
    if not user:
        return {"msg": "유저가 없음"}
    
    if not project.add_user_role(user, role):
        return {"msg": "error"}

    return {"msg": "success"}
    