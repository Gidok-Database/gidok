from pydantic import BaseModel, PrivateAttr
from typing import Optional, TYPE_CHECKING

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

    def get_page(self, *, page: int, 
                 mode: Optional[str] = None, 
                 user: Optional[UserModel] = None,
                 commit: Optional[Commit] = None, 
                 cursor: Optional[cursor] = None):
        if cursor == None:
            conn = get_connection()
        
        try:
            if cursor == None:
                cur = conn.cursor()
            else:
                cur = cursor

            if commit == None and (mode == "release" or mode == "develop"):
                commit = Commit.get_commit(mode=mode, project=self)
                if commit == None:
                    return ""
            elif commit == None and mode == "local" and user != None:
                commit = Commit.get_commit(mode=mode, user= user, project=self)
                if commit == None:
                    return ""
            else:
                return None                
            cur.execute(
                """\
                    SELECT content FROM pages
                    WHERE project_id = %s
                      and page_number = %s
                      and commit_id = %s
                """,
                (self.project._id, page, commit._id)
            )
            content = cur.fetchone()
            if content:
                return content[0]

            cur.execute(
                """\
                    WITH RECURSIVE commit_chain AS (
                        SELECT c.*, 0 AS depth
                        FROM commits c
                        WHERE c.id = %s
                        UNION ALL
                        SELECT parent.*, child.depth + 1
                        FROM commits parent
                        INNER JOIN commit_chain child 
                        ON child.parent_id = parent.id
                        WHERE NOT EXISTS(
                            SELECT 1 FROM pages p
                            WHERE p.project_id = %s
                              and p.page_number = %s
                              and p.commit_id != parent.id
                        )
                    )
                    SELECT * FROM commit_chain
                    ORDER BY depth DESC
                """,
                (commit._id, self.project._id, page)
            )
            commit_list = cur.fetchall()
            print(commit_list)
        finally:
            if cursor == None:
                conn.close()
        return ""

    def insert_page(self, page: int, commit: Commit, cursor: cursor):
        if page == 0:
            pass
        else:
            if commit.parent_id == None:
                blocks = commit.blocks
            else:
                parent = Commit.get_commit(commit.parent_id)
                parent_page = self.get_page(commit=parent, 
                                            page=commit.page, 
                                            cursor=cursor)
                parent_blocks = parent_page.split("\n")
                blocks = parent_blocks[:commit.old_start]+\
                        commit.blocks+\
                        parent_blocks[commit.old_end:]
            cursor.execute(
                """\
                    INSERT INTO pages (
                        project_id,
                        content,
                        page_number,
                        commit_id
                    )
                    VALUES (%s, %s, %s, %s)
                """,
                (self.project._id,
                "\n".join(blocks),
                commit.page,
                commit._id)
            )

    def update_page(self, commit: Commit, cursor: cursor):
        #old: str = self.get_page(page=commit.page, commit=, cursor=cursor)
        old = ""
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