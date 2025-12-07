# searchPosts.py

import os
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
    created_at: str


PostList = TypeAdapter(list[Post])


def search_posts(query: str) -> list[Post]:
    """Search posts via the API with pydantic validation."""
    validated_query = SearchQuery(query=query)

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{SANDBOX_API_URL}/api/functions/searchPosts",
            json={"query": validated_query.query},
        )
        response.raise_for_status()

    return PostList.validate_python(response.json())
