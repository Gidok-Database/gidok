from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse
from typing import Optional

from middlewares.auth import verify_token
from models.user_model import UserModel
from models.project_model import ProjectModel, ProjectService
from models.commit_model import Commit

router = APIRouter()

@router.post("/")
async def create(project_form: ProjectModel, 
                 user: UserModel = Depends(verify_token)):
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

@router.get("/{project_id}")
def view(project_id: int, page: int, mode: Optional[str] = None,
         hash: Optional[str] = None,
         user: UserModel = Depends(verify_token)):
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