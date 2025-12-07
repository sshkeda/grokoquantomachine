import { Client, PostPaginator } from "@xdevplatform/xdk";
import { Effect, Schedule } from "effect";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";

type Tweet = NonNullable<
  Awaited<ReturnType<typeof client.posts.searchAll>>
>["data"]; // xai please let me import this :)
// also what is a Tweet lol

const client = new Client({ bearerToken: env.X_API_KEY });

const schema = z.object({
  query: z.string(),
});

const MAX_PAGES = 10;

export async function POST(request: Request) {
  const { query } = schema.parse(await request.json());

  const searchEffect = Effect.gen(function* () {
    const paginator = new PostPaginator(async (paginationToken) => {
      const { data } = await Effect.runPromise(
        Effect.tryPromise(() =>
          client.posts.searchAll(query, {
            paginationToken,
            tweetFields: ["created_at"],
          })
        ).pipe(
          Effect.retry({
            schedule: Schedule.exponential("100 millis", 2).pipe(
              Schedule.compose(Schedule.recurs(3))
            ),
          })
        )
      );
      return {
        data: data ?? [],
      };
    });

    for (let i = 0; i < MAX_PAGES && !paginator.done; i++) {
      yield* Effect.promise(() => paginator.fetchNext());
    }

    return paginator.posts as Tweet;
  }).pipe(Effect.timeout("60 seconds"));

  const result = await Effect.runPromise(searchEffect);

  return NextResponse.json(result ?? []);
}
