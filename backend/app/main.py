from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import login, project, commit

app = FastAPI(root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 또는 "*" 개발 중엔 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login.router, prefix="/user")
app.include_router(project.router, prefix="/project")
app.include_router(commit.router, prefix="/commit")