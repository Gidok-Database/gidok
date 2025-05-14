from fastapi import FastAPI
from routes import login, project, commit

app = FastAPI(root_path="/api")

app.include_router(login.router, prefix="/user")
app.include_router(project.router, prefix="/project")
app.include_router(commit.router, prefix="/commit")