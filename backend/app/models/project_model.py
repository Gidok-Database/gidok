from pydantic import BaseModel, PrivateAttr
from typing import Optional

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
        
    def get_page(cls):
        pass
