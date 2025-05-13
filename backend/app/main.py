from fastapi import FastAPI
from routes import login

app = FastAPI(root_path="/api")

app.include_router(login.router, prefix="/user")