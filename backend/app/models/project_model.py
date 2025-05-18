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

    @staticmethod
    def search_project(name: str, start:int, end:int, order: str,
                       role: Optional[str], userid: Optional[str]):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""\
                    SELECT p.id, p.name, p.organization, p.description
                    FROM projects p
                    JOIN auth a ON p.id = a.project_id
                    JOIN users u ON u.id = a.user_id
                    WHERE p.name LIKE %s
                      and (%s IS NULL or a.role = %s)
                      and (%s IS NULL or u.userid=%s)
                    ORDER BY p.name {order}
                    LIMIT %s OFFSET %s
                """,
                (f"%{name}%", role, role,
                 userid, userid,
                 end-start, start)
            )
            projects = cur.fetchall()
            conn.commit()
        finally:
            conn.close()
        return projects
        

    def get_page(self, *, page: int,
                 user: Optional[UserModel] = None,
                 mode: Optional[str] = None,
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
                commit = Commit.get_commit(mode=mode, project=self, cursor=cur)
                if commit == None:
                    return ""

            if commit == None \
                or commit.max_page < page\
                or (
                    user != None
                    and commit.status == "normal"
                    and commit.user != user
                ):
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
            elif commit.mode == 'local' and commit.page != page:
                cur.execute(
                    """\
                        SELECT content FROM pages
                        WHERE project_id = %s
                          and page_number = %s
                          and commit_id = %s
                    """,
                    (self.project._id, page, commit.parent_id)
                )
                content = cur.fetchone()
                if content:
                    return content[0]
                else:
                    return None

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
                              and p.commit_id = parent.id
                        )
                    )
                    SELECT * FROM commit_chain
                    ORDER BY depth DESC
                """,
                (commit._id, self.project._id, page)
            )
            rows = cur.fetchall()
            if not rows:
                return None
            cur.execute(
                """\
                    SELECT content FROM pages
                    WHERE commit_id = %s
                """,
                (rows[0]["parent_id"],)
            )
            content = cur.fetchone()
            if not content:
                return None
            content_blocks = content[0].split('\n')
            
            for row in rows:
                cur.execute(
                    """\
                        SELECT content, page_number FROM blocks
                        WHERE project_id = %s
                          and commit_id = %s
                        ORDER BY block_index ASC
                    """,
                    (self.project._id, row['id'])
                )
                block_rows = cur.fetchall()
                if block_rows[0][1] != page:
                    continue
                blcoks = [block_ros[0] for block_ros in block_rows]
                content_blocks = content_blocks[:row["start_block_index"]]+\
                                blcoks+\
                                content_blocks[row["end_block_index"]:]
            content = "\n".join(content_blocks)
            cur.execute(
                """\
                    INSERT INTO pages (
                        project_id,
                        content,
                        page_number,
                        commit_id
                    )
                    VALUES (%s, %s, %s, %s)
                """,
                (self.project._id, content, page, commit._id)
            )
            conn.commit()
        finally:
            if cursor == None:
                conn.close()
        return content

    def insert_page(self, page: int, commit: Commit, parent_max_page: int, cursor: cursor):
        if page == 0:
            pass
        else:
            if commit.parent_id == None or page > parent_max_page:
                blocks = commit.blocks
            else:
                parent = Commit.get_commit(id=commit.parent_id, project=self,cursor=cursor)
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
        
        cursor.execute(
            """\
                DELETE FROM pages
                WHERE (
                    SELECT mode FROM commits
                    WHERE id = commit_id
                ) = 'local'
            """
        )
        cursor.execute(
            """\
                SELECT * FROM commits
                WHERE id = %s
            """,(commit.parent_id,)
        )
        parent = cursor.fetchone()
        
        if parent == None:
            return
        elif parent["mode"] == "release":
            cursor.execute(
                """\
                    INSERT INTO pages (
                        project_id,
                        content,
                        page_number,
                        commit_id
                    ) 
                    SELECT project_id, 
                           content, 
                           page_number,
                           %s
                    FROM pages
                    WHERE commit_id = %s
                      and page_number != %s
                """,
                (commit._id, commit.parent_id, commit.page)
            )
        else:
            cursor.execute(
                """\
                    UPDATE pages
                    SET commit_id = %s
                    WHERE commit_id = %s
                      and page_number != %s
                """,
                (commit._id, commit.parent_id, commit.page)
            )
        