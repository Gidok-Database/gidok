from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse
from typing import Optional

from middlewares.auth import verify_token
from models.user_model import UserModel
from models.project_model import ProjectModel, ProjectService

router = APIRouter()

@router.post("/create")
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

