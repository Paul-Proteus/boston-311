"""FastAPI application entry point for the Boston 311 backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .data import get_dataframe
from .routers import requests as requests_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load the CSV into memory on startup so the first request is fast.
    get_dataframe()
    yield


app = FastAPI(
    title="Boston 311 API",
    description="REST API for Boston 311 service request data.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(requests_router.router, prefix="/api", tags=["requests"])
