import { Client } from "@xdevplatform/xdk";
import { Effect, Schedule } from "effect";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";

const client = new Client({ bearerToken: env.X_API_KEY });

const schema = z.object({
  query: z.string(),
});

export async function POST(request: Request) {
  try {
    const { query } = schema.parse(await request.json());

    const searchEffect = Effect.tryPromise({
      try: () =>
        client.news.search(query, {
          newsFields: [
            "category",
            "name",
            "summary",
            "hook",
            "keywords",
            "contexts",
            "updated_at",
          ],
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
      }),
      Effect.timeout("60 seconds")
    );

    const result = await Effect.runPromise(searchEffect);

    return NextResponse.json(result.data ?? []);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
