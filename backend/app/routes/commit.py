from fastapi import APIRouter, Depends

from middlewares.auth import verify_token
from models.user_model import UserModel
from models.project_model import ProjectService
from models.commit_model import CommitForm, Commit

router = APIRouter()

@router.post("/{project_id}")
def create_commit(project_id: int, commmit_form: CommitForm,
                  user: UserModel = Depends(verify_token)):
    project = ProjectService.get_project(project_id)

    if project.get_user_auth_level(user) >= 2:
        return {"msg": "error"}
    
    commit = Commit()
    hash = commit.create_commit()

    return {
        "msg": "success",
        "hash": hash
    }