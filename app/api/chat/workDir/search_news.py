# search_news.py

import os
from datetime import datetime
from dotenv import load_dotenv
import httpx
from pydantic import BaseModel, TypeAdapter

load_dotenv()

SANDBOX_API_URL = os.environ.get("SANDBOX_API_URL")


class SearchQuery(BaseModel):
    query: str


class News(BaseModel):
    name: str
    summary: str | None = None
    hook: str | None = None
    category: str | None = None


NewsList = TypeAdapter(list[News])


def search_news(query: str) -> list[News]:
    """Search news via the API with pydantic validation.

    Retrieves a list of News stories matching the specified search query.
    When summarizing what you found for the user, match the active persona from the system prompt:
    - In "Stock Noob" mode, keep the takeaway simple and story-like (e.g., what the news broadly covers).
    - In "Quant Pro" / "Quant Pro Heavy" modes, provide detailed analysis including tickers, contexts, and timelines.
    """
    validated_query = SearchQuery(query=query)

    with httpx.Client(timeout=120.0) as client:
        response = client.post(
            f"{SANDBOX_API_URL}/api/functions/searchNews",
            json={"query": validated_query.query},
        )
        response.raise_for_status()

    return NewsList.validate_python(response.json())
