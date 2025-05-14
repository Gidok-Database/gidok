import hashlib

from psycopg2.extensions import cursor
from pydantic import BaseModel
from typing import Optional

from models.user_model import UserModel
from models.project_model import ProjectService
from db import get_connection

class CommitForm(BaseModel):
    old_start: int
    old_end: int
    page: int
    docs: str
    title: Optional[str] = None
    desc: Optional[str] = None



class Commit:
    def __init__(self, form: CommitForm, project: ProjectService, 
                 user: UserModel):
        
        self.project = project
        self.user = user
        self.blocks = form.docs.split("\n")
        self.title = form.title
        self.desc = form.desc
        self.page = form.page
        self.old_start = form.old_start
        self.old_end = form.old_end
        self.mode = "local"
        self.status = "normal"
        hash_source = "\n".join([
            str(self.project.project._id),
            str(self.user._id),
            form.title or "",
            form.desc or "",
            f"{form.old_start}-{form.old_end}-{form.page}",
            form.docs
        ])

        self.hash = hashlib.sha256(hash_source.encode()).hexdigest()

    def create_commit(self):
        conn = get_connection()
        try:
            cur = conn.cursor()
            params = [self.hash,
                      self.project.project._id,
                      self.user._id,
                      self.user._id,
                      self.project.project._id,
                      self.title,
                      self.desc,
                      self.old_start,
                      self.old_end]
            cur.execute(
                """\
                INSERT INTO commits (
                    commit_sha256, 
                    project_id, 
                    user_id,
                    parent_id,
                    title,
                    description,
                    start_block_index,
                    end_block_index)
                VALUES (
                    %s, %s, %s,
                    (
                        SELECT id FROM commits 
                        WHERE user_id = %s 
                          and project_id = %s
                          and mode = 'local'
                        ORDER BY date DESC
                        LIMIT 1
                    ),
                    %s, %s, %s, %s
                )
                RETURNING id, date, parent_id
                """,
                params
            )
            self._id, self.date, self.parent_id = cur.fetchone()
            for i, block in enumerate(self.blocks):
                self._insert_block(block, i, cur)
            
            self.project.update_page(self, cur)
            conn.commit()
        except:
            conn.rollback()
            return False
        finally:
            conn.close()
        return self.hash
    
    def _insert_block(self, block: str, index: int, cursor: cursor):
        cursor.execute(
            """\
            INSERT INTO blocks (
                project_id,
                page_number,
                block_index,
                content,
                commit_id
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (self.project.project._id,
             self.page,
             index,
             block,
             self._id
             )
        )

    