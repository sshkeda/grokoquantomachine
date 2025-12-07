from app.api.chat.workDir.search_posts import search_posts


result = search_posts('from:elonmusk "grok 4.20"')
print(f"Found {len(result)} posts")
for post in result:
    print("--------------------------------")
    print(post.id)
    print(post.text)
