from fastapi import APIRouter, Depends

from middlewares.auth import verify_token
from models.user_model import UserModel
from models.project_model import ProjectService
from models.commit_model import CommitCreateForm, CommitPatchForm, Commit

router = APIRouter()

@router.post("/{project_id}")
def create_commit(project_id: int, commit_form: CommitCreateForm,
                  user: UserModel = Depends(verify_token)):
    project = ProjectService.get_project(project_id)

    if project.get_user_auth_level(user) >= 2:
        return {"msg": "error"}
    if commit_form.page <= 0:
        return {"msg": "error"}

    commit = Commit(commit_form, project, user)
    hash = commit.create_commit()
    if not hash:
        return {"msg": "error"}
        
    return {
        "msg": "success",
        "hash": hash
    }

@router.patch("/{project_id}")
def patch_commit(project_id: int, commit_form: CommitPatchForm,
                 user: UserModel = Depends(verify_token)):
    project = ProjectService.get_project(project_id)
    auth_level = project.get_user_auth_level(user)

    if commit_form.cmd == "push":
        hash = Commit.push_commit(commit_form.hash, 
                                  project, user)
        if not hash:
            return {"msg": "커밋을 푸쉬하지 못 했습니다."}
        else:
            return {"msg": "커밋을 성공적으로 푸쉬했습니다."}
    elif commit_form.cmd == "merge":
        if auth_level != 0:
            return {"msg": "merge는 프로젝트의 관리자만 할 수 있습니다."}
        hash = Commit.merge_commit(commit_form.hash,
                                   project)
        if not hash:
            return {"msg": "커밋을 병합하지 못 했습니다."}
        else:
            return {"msg": "커밋을 성공적으로 병합했습니다."}
    elif commit_form.cmd == "promote":
        if auth_level != 0:
            return {"msg": "promote는 프로젝트의 관리자만 할 수 있습니다."}
        if Commit.promote_commit(project):
            return {"msg": "release mode로 승격했습니다."}
        else:
            return {"msg": "release mode로 승격하지 못 했습니다."}
    else:
        return {"msg": "cmd값은 push, merge, promote 중 하나입니다."}