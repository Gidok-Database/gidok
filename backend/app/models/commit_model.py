import hashlib
from datetime import datetime, timezone

from psycopg2.extensions import cursor
from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from models.project_model import ProjectService
from models.user_model import UserModel, UserService
from db import get_connection

class CommitForm(BaseModel):
    old_start: int
    old_end: int
    page: int
    docs: str
    title: Optional[str] = None
    desc: Optional[str] = None



class Commit:
    def __init__(self, form: CommitForm, project: "ProjectService", 
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
            form.docs,
            str(datetime.now(timezone.utc))
        ])

        self.hash = hashlib.sha256(hash_source.encode()).hexdigest()

    def create_commit(self):
        def _get_parent_commit(cursor: cursor):
            cursor.execute(
                """\
                    SELECT c.id, c.max_page_number FROM commits c
                    WHERE mode = 'develop'
                      and project_id = %s
                      and NOT EXISTS (
                            SELECT 1 FROM commits child
                            WHERE child.parent_id = id
                              and mode = 'develop'
                        )
                    LIMIT 1
                """,
                (self.project.project._id,)
            )
            return cursor.fetchone()
        
        conn = get_connection()
        try:
            cur = conn.cursor()
            
            parent = _get_parent_commit(cur)
            if parent == None and self.page == 1:
                self.parent_id = None
                self.max_page = 1
            elif parent["max_page_number"] + 1 >= self.page and self.page > 0:
                self.parent_id = parent["id"]
                self.max_page = max(parent["max_page_number"], self.page)
            else:
                return None

            params = [self.hash,
                      self.project.project._id,
                      self.user._id,
                      self.parent_id,
                      self.title,
                      self.desc,
                      self.max_page,
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
                    max_page_number,
                    start_block_index,
                    end_block_index)
                VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s
                )
                RETURNING id, date
                """,
                params
            )
            self._id, self.date = cur.fetchone()
            for i, block in enumerate(self.blocks):
                self._insert_block(block, i, cur)
            self.project.insert_page(self.page, self, cur)
            conn.commit()
        except:
            conn.rollback()
            return None
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

    @classmethod
    def get_commit(cls, *, project: "ProjectService", 
                   mode: Optional[str] = None,
                   hash: Optional[str] = None,
                   id: Optional[int] = None,
                   cursor: Optional[cursor] = None):
        def from_row(row, cur) -> "Commit":
            commit: Commit = cls.__new__(cls)
            commit.project = project
            commit.user = UserService.get_user_by_id(row["user_id"], cur)
            commit._id = row["id"]
            commit.title = row["title"]
            commit.desc = row["description"]
            commit.hash = row["commit_sha256"]
            commit.mode = row["mode"]
            commit.status = row["status"]
            commit.parent_id = row["parent_id"]
            commit.old_start = row["start_block_index"]
            commit.old_end = row["end_block_index"]
            commit.date = row["date"]
            commit.max_page = row["max_page_number"]
            commit.blocks, commit.page = Commit.get_blocks_and_page_number(commit, cur)
            
            return commit
         
        if cursor is None:
            conn = get_connection()
            cur = conn.cursor()
            should_close = True
        else:
            cur = cursor
            should_close = False

        try:
            commit_data = None
            if id != None:
                cur.execute(
                    """\
                        SELECT * FROM commits
                        WHERE id = %s
                    """,
                    (id,)
                )
                commit_data = cur.fetchone()
                if commit_data == None:
                    return None
            elif hash != None:
                cur.execute(
                    """\
                    SELECT * From commits
                    WHERE commit_sha256 = %s
                      and project_id = %s
                    """,
                    (hash, project.project._id)
                )
                commit_data = cur.fetchone()
                if commit_data == None:
                    return None
            elif mode == "release" or mode == "develop":
                cur.execute(
                    """\
                        SELECT * FROM commits c
                        WHERE mode = %s
                          and project_id = %s
                          and NOT EXISTS (
                                SELECT 1 FROM commits child
                                WHERE child.parent_id = id
                                  and mode = %s
                            )
                        LIMIT 1
                    """,
                    (mode, project.project._id, mode)
                )
                commit_data = cur.fetchone()
                if commit_data == None:
                    return None
            else:
                return None
            
            return from_row(commit_data, cur)
        finally:
            if should_close:
                conn.close()

    @staticmethod
    def get_blocks_and_page_number(commit: "Commit", cursor: cursor):
        cursor.execute(
            """\
                SELECT content, page_number FROM blocks
                WHERE project_id = %s
                  and commit_id = %s
                ORDER BY block_index ASC
            """,
            (commit.project.project._id, commit._id)
        )
        rows = cursor.fetchall()
        
        blocks = [row[0] for row in rows]

        return blocks, rows[0][1]