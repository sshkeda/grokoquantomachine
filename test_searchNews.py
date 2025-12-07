from app.api.chat.workDir.search_news import search_news


result = search_news("crypto")
print(f"Found {len(result)} news stories")
for news in result:
    print("--------------------------------")
    print(news.name)
    print(news.summary)
