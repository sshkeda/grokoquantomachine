# searchPosts.py

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
    """Search posts via the API with pydantic validation. Use in a single combined run and keep any user-facing summary simple."""
    validated_query = SearchQuery(query=query)

    with httpx.Client() as client:
        response = client.post(
            f"{SANDBOX_API_URL}/api/functions/searchPosts",
            json={"query": validated_query.query},
        )
        response.raise_for_status()

    return PostList.validate_python(response.json())
