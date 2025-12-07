# search_posts.py

import os
from datetime import datetime
from dotenv import load_dotenv
import httpx
from pydantic import BaseModel, TypeAdapter

load_dotenv()

SANDBOX_API_URL = os.environ.get("SANDBOX_API_URL")


# Example: `from:TwitterDev has:media -is:retweet`
class SearchQuery(BaseModel):
    query: str


class Post(BaseModel):
    id: str
    text: str
    created_at: datetime


PostList = TypeAdapter(list[Post])


def search_posts(query: str) -> list[Post]:
    """Search posts via the API with pydantic validation.

    Intended to be used in a single combined run inside the sandbox: fetch posts once, then interpret them in chat.
    When summarizing what you found for the user, match the active persona from the system prompt:
    - In "Stock Noob" mode, keep the takeaway simple and story-like (e.g., what the author is broadly saying).
    - In "Quant Pro" / "Quant Pro Heavy" modes, feel free to mention patterns over time, event alignment, or other richer context.
    """
    validated_query = SearchQuery(query=query)

    with httpx.Client(timeout=120.0) as client:
        response = client.post(
            f"{SANDBOX_API_URL}/api/functions/searchPosts",
            json={"query": validated_query.query},
        )
        response.raise_for_status()

    return PostList.validate_python(response.json())
