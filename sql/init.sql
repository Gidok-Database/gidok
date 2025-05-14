-- Create dev and app users with passwords from environment variables
-- These should be provided by the container or script via psql -v or envsubst preprocessing
-- Example use with psql: psql -v dev_pass='mydevpass' -v app_pass='myapppass' -f init.sql
-- ${APP}

-- Create roles for app and dev access
CREATE USER app WITH PASSWORD 'yourAppPassword';
GRANT CONNECT ON DATABASE gidok TO app;
GRANT USAGE ON SCHEMA public TO app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app;


CREATE USER dev WITH PASSWORD 'yourDevPassword';
GRANT CONNECT ON DATABASE gidok TO dev;
GRANT USAGE, CREATE ON SCHEMA public TO dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dev;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO dev;
ALTER DEFAULT PRIVILEGES FOR ROLE dev IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dev;
ALTER DEFAULT PRIVILEGES FOR ROLE dev IN SCHEMA public
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO dev;

ALTER DEFAULT PRIVILEGES FOR ROLE dev IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app;

ALTER DEFAULT PRIVILEGES FOR ROLE dev IN SCHEMA public
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app;

SET SESSION AUTHORIZATION dev;


-- After setup, revoke dev access and restrict future access to app only (for production safety)
-- ${DISABLE_DEV}

-- users table: stores registered user information
-- Columns:
--   id           : Unique identifier for each user
--   name         : Display name of the user
--   email        : Optional email address
--   phone        : Optional phone number (fixed length)
--   userid       : Unique login ID for the user
--   password     : Hashed password string (bcrypt hash, always 60 characters)
--   organization : Organization the user belongs to
--   description  : Free-form user description or bio
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(40) NOT NULL,
    "email" VARCHAR(120),
    "phone" CHAR(15),
    "userid" VARCHAR(50) NOT NULL UNIQUE,
    "password" CHAR(60) NOT NULL,
    "organization" VARCHAR(64),
    "description" TEXT
);

-- Projects table: stores project metadata
-- Columns:
--   id           : Unique project identifier
--   name         : Project name
--   organization : Name of the team or organization that owns the project
--   description  : Project summary or notes
--   path         : File system or workspace path
CREATE TABLE "projects" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100),
    "organization" VARCHAR(64),
    "description" TEXT,
    "path" TEXT
);

-- Enum for user authorization roles in a project
-- 'viewer': Can only read project content (no write/commit access)
-- 'member': Can read and write, create commits, but not merge
-- 'admin' : Full access — can read/write, commit, and merge commits
CREATE TYPE auth_role AS ENUM ('admin', 'member', 'viewer');

-- Auth table: project membership and role assignment
--   project_id : Reference to the project the user is in
--   user_id    : Reference to the participating user
--   role       : Authorization level (viewer, member, admin)
--                Controls access such as view/edit/merge
CREATE TABLE "auth" (
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" auth_role NOT NULL DEFAULT 'viewer',

    PRIMARY KEY ("user_id", "project_id"),
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
);


-- Enum for project mode types
-- 'release': Finalized published state
-- 'develop': Shared staging area for development
-- 'local'  : Private user-level workspace
CREATE TYPE project_mode AS ENUM ('release', 'develop', 'local');

-- Enum for commit status types
-- 'normal': Standard commit representing a local or intermediate change
-- 'push'   : Commit intended to be shared with collaborators (pushed to public mode)
-- 'merge'  : Commit that merges other commits (e.g., integrating changes from local to develop)
-- NOTE: This system does not use explicit branching
-- Commits exist in linear timelines within each mode.
-- Specifically, 'release' and 'develop' modes follow a linear commit structure,
-- with 'merge' commits representing controlled transitions (e.g., from develop to release).
CREATE TYPE commit_status AS ENUM ('normal', 'push', 'merge');

-- Commits table: records metadata and mode of a commit
-- Commits table: records a single snapshot of changes in a project
-- Columns:
--   id              : Unique identifier for the commit
--   commit_sha256   : Unique hash representing the content snapshot
--   project_id      : Associated project this commit belongs to
--   user_id         : Author of the commit
--   parent_id       : Parent commit
--   date            : Timestamp when the commit was created
--   title           : Short title or summary of the commit
--   description     : Detailed message describing changes
--   status          : Enum (default/push/merge) describing commit role/state
--   mode            : Enum (release/develop/local) indicating context for this commit
CREATE TABLE "commits" (
    "id" SERIAL PRIMARY KEY,
    "commit_sha256" CHAR(64) NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "status" commit_status NOT NULL DEFAULT 'normal',
    "mode" project_mode NOT NULL DEFAULT 'local',
    "start_block_index" INTEGER NOT NULL,
    "end_block_index" INTEGER Not NULL,

    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("parent_id") REFERENCES "commits"("id") ON DELETE SET NULL
);

-- Blocks table: content blocks grouped by page and index
-- Columns:
--   project_id        : The project this block belongs to
--   page_number       : Which page the block appears on
--   block_index       : Order of the block within the page
--   content           : The actual text or content of the block
--   commit_id         : Reference to the commit operation that created or modified this block
-- Each block is linked to a commit_id entry
CREATE TABLE "blocks" (
    "project_id" INTEGER NOT NULL,
    "page_number" INTEGER NOT NULL,
    "block_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "commit_id" INTEGER NOT NULL,

    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
    FOREIGN KEY ("commit_id") REFERENCES "commits"("id") ON DELETE CASCADE
);

-- Pages table: content pages grouped by page
-- Columns:
--   project_id        : The project this block belongs to
--   page_number       : Which page the block appears on
--   content           : The actual text or content of the block
--   commit_id : Reference to the commit operation that created or modified this block
-- Each block is linked to a commit_content entry
CREATE TABLE "pages" (
    "project_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "commit_id" INTEGER NOT NULL,

    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
    FOREIGN KEY ("commit_id") REFERENCES "commits"("id") ON DELETE CASCADE
)