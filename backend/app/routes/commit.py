from fastapi import APIRouter, Depends
from datetime import date
from typing import Optional

from middlewares.get_user import get_current_user
from models.user_model import UserModel
from models.project_model import ProjectService
from models.commit_model import CommitCreateForm, CommitPatchForm, Commit


router = APIRouter()

@router.post("/{project_id}")
def create_commit(project_id: int, commit_form: CommitCreateForm,
                  user: UserModel = Depends(get_current_user)):
    if user == None:
        return {"msg":"error"}
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
                 user: UserModel = Depends(get_current_user)):
    if user == None:
        return {"msg":"error"}
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
    
@router.get("/{project_id}/search")
def search(project_id: int,
           start_hash: Optional[str] = None,
           mode: Optional[str] = None, 
           status: Optional[str] = None, 
           user_id: Optional[str] = None, 
           title: Optional[str] = None,
           start_date: Optional[date] = None, 
           end_date: Optional[date] = None, 
           start:int = 0, end:int = 10,
           current_user: UserModel = Depends(get_current_user)):
    if current_user == None:
        return {"msg":"error"}
    project = ProjectService.get_project(project_id)
    auth_level = project.get_user_auth_level(current_user)
    if auth_level >= 2:
        return {"msg": "error"}

    if mode not in [None, "release", "develop", "local"]:
        return {"msg": "error"}
    if status not in [None, "normal", "push", "merge"]:
        return {"msg": "error"}

    columns = ["hash", "user_id", "user_name", "date",
               "title", "desc", "status", "mode", "max_page",
               "parent_hash"]

    if status == "normal":
        commits = [
            dict(zip(columns, row))
                for row in Commit.search_without_chain(
                    project,
                    current_user.userid,
                    status,
                    mode,
                    title,
                    start_date,
                    end_date,
                    start, 
                    end
                )
        ]
    elif (status == "push"
          or user_id
          or title
          or (start_date and end_date)):
        
        commits = [
            dict(zip(columns, row))
                for row in Commit.search_without_chain(
                    project,
                    user_id,
                    status,
                    mode,
                    title,
                    start_date,
                    end_date,
                    start,
                    end
                )
        ]
    elif mode or start_hash:
        commits = [
            dict(zip(columns, row))
                for row in Commit.search_with_chain(
                    project,
                    start_hash,
                    mode,
                    start,
                    end
                )
        ]
    else:
        return {"msg":"error"}
    
    return commits