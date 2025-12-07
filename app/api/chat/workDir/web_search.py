# web_search.py

import os
from dotenv import load_dotenv
import httpx
from pydantic import BaseModel

load_dotenv()

SANDBOX_API_URL = os.environ.get("SANDBOX_API_URL")


class Source(BaseModel):
    url: str
    title: str | None = None


class WebSearchResult(BaseModel):
    text: str
    sources: list[Source]


def web_search(query: str) -> WebSearchResult:
    """Search the web via xAI's web search tool. Returns a WebSearchResult with text summary and sources."""
    with httpx.Client(timeout=120.0) as client:
        response = client.post(
            f"{SANDBOX_API_URL}/api/functions/webSearch",
            json={"query": query},
        )
        response.raise_for_status()

    return WebSearchResult.model_validate(response.json())
