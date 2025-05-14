from pydantic import BaseModel, PrivateAttr
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from models.commit_model import Commit
from psycopg2.extensions import cursor
from models.user_model import UserModel
from db import get_connection

class ProjectModel(BaseModel):
    _id: int = PrivateAttr()
    name: str
    org: Optional[str] = None
    desc: Optional[str] = None
    _path: Optional[str] = PrivateAttr(None)


class ProjectService:
    def __init__(self, project: ProjectModel):
        self.project = project


    @classmethod
    def create_project(cls, name, org = None, desc = None):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """\
                INSERT INTO projects (name, organization, description) 
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (name, org, desc)
            )
            project_id = cur.fetchone()[0]
            conn.commit()
        except:
            return None
        finally:
            conn.close()
        project_model = ProjectModel(name=name, org=org, desc=desc)
        project_model._id = project_id
        return cls(project_model)
    

    def add_admin(self, user_id):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """\
                INSERT INTO auth (project_id, user_id, role)
                VALUES (%s, %s, 'admin')
                """,
                (self.project._id, user_id)
            )
            conn.commit()
        except:
            return False
        finally:
            conn.close()
        
        return True
    
    def get_user_auth_level(self, user: UserModel):
        auth_level = {"admin": 0, "member": 1, "viewer": 2}
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """\
                SELECT role FROM auth
                WHERE project_id = %s and user_id = %s
                """,
                (self.project._id, user._id)
            )
            role = cur.fetchone()
            conn.commit()
        except:
            return None
        finally:
            conn.close()

        if role:
            level = auth_level[role[0]]
            print(role)
            print(role[0])
        else:
            level = 3
        return level

    @classmethod
    def get_project(cls, project_id):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """\
                SELECT * FROM projects
                WHERE id = %s
                """,
                (project_id,)
            )
            project = cur.fetchone()
            conn.commit()
        except:
            return None
        finally:
            conn.close()
        project_model = ProjectModel(name=project["name"], 
                                     org=project["organization"], 
                                     desc=project["description"])
        project_model._id = project["id"]
        return cls(project_model)

    def view_project(self, page: int, cursor: Optional[cursor] = None):
        if cursor == None:
            conn = get_connection()
        
        try:
            if cursor == None:
                cur = conn.cursor()
            else:
                cur = cursor
            cur.executemany
        finally:
            if cursor == None:
                cur.close()
        return ""

    def update_page(self, commit: "Commit", cursor: cursor):
        old: str = self.view_project(commit.page, cursor=cursor)
        old_blocks = old.split('\n')
        new_blocks = old_blocks[:commit.old_start] +\
                     commit.blocks +\
                     old_blocks[commit.old_end:]
        cursor.execute(
            """\
            UPDATE pagesss
            SET content = %s,
                commit_id = %s
            WHERE project_id = %s 
              and commit_id = (
                SELECT id FROM commits
                WHERE user_id = %s 
                  and project_id = %s
                  and mode = %s
                ORDER BY date DESC
                OFFSET 1
                LIMIT 1
              )
              and page_number = %s
            """,
            ("\n".join(new_blocks),
             self.project._id,
             commit._id,
             commit.user._id,
             self.project._id,
             commit.mode,
             commit.page
            )
        )