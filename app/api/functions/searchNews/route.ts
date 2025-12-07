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
  const { query } = schema.parse(await request.json());

  const searchEffect = Effect.tryPromise(() =>
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
    })
  ).pipe(
    Effect.retry({
      schedule: Schedule.exponential("100 millis", 2).pipe(
        Schedule.compose(Schedule.recurs(3))
      ),
    }),
    Effect.timeout("60 seconds")
  );

  const result = await Effect.runPromise(searchEffect);

  return NextResponse.json(result.data ?? []);
}
