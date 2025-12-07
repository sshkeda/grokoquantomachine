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
  try {
    const { query } = schema.parse(await request.json());

    const searchEffect = Effect.gen(function* () {
      const paginator = new PostPaginator(async (paginationToken) => {
        const { data } = await Effect.runPromise(
          Effect.tryPromise({
            try: () =>
              client.posts.searchAll(query, {
                paginationToken,
                tweetFields: ["created_at"],
              }),
            catch: (error) => {
              console.error(error);
              throw error;
            },
          }).pipe(
            Effect.retry({
              schedule: Schedule.exponential("1 second", 2).pipe(
                Schedule.compose(Schedule.recurs(10))
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
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
