import hashlib
from datetime import datetime, timezone, date

from fastapi import HTTPException, status
from psycopg2.extensions import cursor
from pydantic import BaseModel
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from models.project_model import ProjectService
from models.user_model import UserModel, UserService
from db import get_connection

class CommitCreateForm(BaseModel):
    old_start: int
    old_end: int
    page: int
    docs: str
    title: Optional[str] = None
    desc: Optional[str] = None

class CommitPatchForm(BaseModel):
    hash: str
    cmd: str


class Commit:
    def __init__(self, form: CommitCreateForm, project: "ProjectService", 
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
                    WHERE (mode = 'develop' or mode = 'release')
                      and project_id = %s
                      and NOT EXISTS (
                            SELECT 1 FROM commits child
                            WHERE child.parent_id = c.id
                              and (mode = 'develop' or mode = 'release')
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
                self.max_page = 1,
                parent_max_page = None
            elif parent["max_page_number"] + 1 >= self.page and self.page > 0:
                self.parent_id = parent["id"]
                self.max_page = max(parent["max_page_number"], self.page)
                parent_max_page = parent["max_page_number"]
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="페이지는 한 번에 하나씩만 추가할 수 있습니다.",
                )
                
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
                
            self.project.insert_page(self.page, self, parent_max_page,cur)
            conn.commit()
        except HTTPException as e:
            conn.rollback()
            raise e
        except Exception as e:
            print(e)
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="서버 에러",
            )
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
                        WHERE (c.mode = %s or c.mode = 'release')
                          and project_id = %s
                          and NOT EXISTS (
                                SELECT 1 FROM commits child
                                WHERE child.parent_id = c.id
                                  and (child.mode = %s or child.mode = 'release')
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
    
    @staticmethod
    def push_commit(hash: str, project: "ProjectService", user: UserModel):
        conn = get_connection()
        try:
            cur = conn.cursor()
            commit: Commit = Commit.get_commit(hash=hash,project=project,cursor=cur)
            if not commit or commit.user != user \
              or commit.mode != "local" or commit.status != "normal":
                return None
            
            cur.execute(
                """\
                    UPDATE commits
                    SET status = 'push'
                    WHERE id = %s
                """,
                (commit._id,)
            )
            conn.commit()
        except:
            return None
        finally:
            conn.close()

        return commit.hash
    
    @staticmethod
    def merge_commit(hash: str, project: "ProjectService"):
        conn = get_connection()
        try:
            cur = conn.cursor()
            commit: Commit = Commit.get_commit(hash=hash,project=project,cursor=cur)
            if not commit or commit.mode != "local" or commit.status != "push":
                return None
            
            cur.execute(
                """\
                    UPDATE commits
                    SET status = 'merge',
                        mode = 'develop'
                    WHERE id = %s
                """,
                (commit._id, )
            )
            cur.execute(
                """\
                    DELETE FROM commits
                    WHERE project_id = %s
                      and mode = 'local'
                      and ((start_block_index < %s and end_block_index > %s)
                        or (start_block_index < %s and end_block_index > %s))
                """,
                (project.project._id, 
                 commit.old_start, 
                 commit.old_start,
                 commit.old_end,
                 commit.old_end)
            )
            old_len = commit.old_end - commit.old_start
            new_len = len(commit.blocks)
            
            cur.execute(
                """\
                    UPDATE commits
                    SET start_block_index = start_block_index + %s,
                        end_block_index = end_block_index + %s
                    WHERE %s <= start_block_index
                """,
                (new_len-old_len, new_len-old_len, commit.old_end)
            )
            
            cur.execute(
                """\
                    UPDATE commits
                    SET parent_id = %s,
                        max_page_number = GREATEST(max_page_number, %s)
                    WHERE project_id = %s
                      and mode = 'local'
                """,
                (commit._id, commit.max_page, project.project._id)
            )

            project.update_page(commit, cur)
            conn.commit()
        except Exception as e:
            print(e)
            return None
        finally:
            conn.close()

        return commit.hash
        
    @staticmethod
    def promote_commit(project: "ProjectService"):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """\
                    UPDATE commits
                    SET mode = 'release'
                    WHERE mode = 'develop'
                      and project_id = %s
                """,
                (project.project._id,)
            )
            conn.commit()
        except:
            return False
        finally:
            conn.close()

        return True
        
    @staticmethod
    def search_without_chain(project: "ProjectService",
                             user_id: Optional[str],
                             status: Optional[str],
                             mode: Optional[str],
                             title: Optional[str],
                             start_date: Optional[date],
                             end_date: Optional[date],
                             start: int, 
                             end:int):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """\
                    SELECT c.commit_sha256,
                           u.userid,
                           u.name,
                           c.date,
                           c.title,
                           c.description,
                           c.status,
                           c.mode,
                           c.max_page_number,
                           p.commit_sha256
                    FROM commits c
                    JOIN users u ON u.id = c.user_id
                    LEFT JOIN commits p ON p.id = c.parent_id
                    WHERE c.project_id = %s
                      and (%s IS NULL or u.userid = %s)
                      and (%s IS NULL or c.status = %s)
                      and (%s IS NULL or c.mode = %s)
                      and (%s IS NULL or c.title LIKE %s)
                      and (%s IS NULL or c.date BETWEEN %s AND %s)
                    LIMIT %s OFFSET %s
                """,
                (project.project._id,
                 user_id, user_id,
                 status, status,
                 mode, mode,
                 title, f"%{title}%",
                 start_date, start_date, end_date,
                 end-start, start
                 )
            )
            rows = cur.fetchall()
        finally:
            conn.close()
        
        return rows
        
    @staticmethod
    def search_with_chain(project: "ProjectService",
                          start_hash: Optional[str],
                          mode: Optional[str],
                          start: int,
                          end: int):
        conn = get_connection()
        try:
            cur = conn.cursor()
            
            cur.execute(
                """\
                    WITH RECURSIVE commit_chain AS (
                        SELECT curr_commit.*,
                               curr_parent.commit_sha256 AS parent_sha256, 
                               0 AS depth
                        FROM commits curr_commit
                        LEFT JOIN commits curr_parent 
                            ON curr_parent.id = curr_commit.parent_id
                        WHERE curr_commit.project_id = %s
                          and (%s IS NULL or curr_commit.commit_sha256 = %s)
                          and (%s is NULL or (
                                (curr_commit.mode = %s or curr_commit.mode = 'release')
                                and NOT EXISTS(
                                    SELECT 1 FROM commits child
                                    WHERE child.parent_id = curr_commit.id
                                    and (child.mode = %s or child.mode = 'release')
                                ))
                              )
                        UNION ALL

                        SELECT 
                            prev_commit.*,
                            prev_parent.commit_sha256 AS parent_sha256, 
                            chain.depth + 1
                        FROM commits prev_commit
                        LEFT JOIN commits prev_parent 
                            ON prev_parent.id = prev_commit.parent_id
                        INNER JOIN commit_chain chain
                            ON chain.parent_id = prev_commit.id
                        WHERE chain.depth < %s
                    )

                    SELECT 
                        cc.commit_sha256,
                        u.userid,
                        u.name,
                        cc.date,
                        cc.title,
                        cc.description,
                        cc.status,
                        cc.mode,
                        cc.max_page_number,
                        cc.parent_sha256
                    FROM commit_chain cc
                    JOIN users u ON u.id = cc.user_id
                    ORDER BY depth ASC
                    OFFSET %s
                """,
                (project.project._id, 
                 start_hash, start_hash,
                 mode, mode, mode,
                 end,
                 start
                 )
            )
            rows = cur.fetchall()
        finally:
            conn.close()
        
        return rows
