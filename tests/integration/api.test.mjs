import assert from "node:assert/strict";
import { test } from "node:test";

const baseUrl = process.env.ARENA_BASE_URL ?? "http://127.0.0.1:3000";
const tournamentUrl = `${baseUrl}/api/tournaments/northern-circuit-2026`;

async function createSession(role) {
  const response = await fetch(`${baseUrl}/api/demo/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie);
  return cookie;
}

test("publishes one durable event and replays an idempotent result", async () => {
  const sessionCookie = await createSession("operator");
  const beforeResponse = await fetch(`${tournamentUrl}/snapshot`);
  assert.equal(beforeResponse.status, 200);
  const before = await beforeResponse.json();
  const key = crypto.randomUUID();
  const result = {
    matchId: "upper-final",
    homeScore: 13,
    awayScore: 12,
    expectedVersion: before.version,
  };

  const publish = () =>
    fetch(`${tournamentUrl}/results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
        "Idempotency-Key": key,
      },
      body: JSON.stringify(result),
    });

  const firstResponse = await publish();
  assert.equal(firstResponse.status, 200);
  const first = await firstResponse.json();
  assert.equal(first.version, before.version + 1);

  const replayResponse = await publish();
  assert.equal(replayResponse.status, 200);
  assert.deepEqual(await replayResponse.json(), first);

  const afterResponse = await fetch(`${tournamentUrl}/snapshot`);
  const after = await afterResponse.json();
  assert.equal(after.version, first.version);
  assert.equal(after.data.match.awayScore, 12);

  const streamResponse = await fetch(`${tournamentUrl}/events?after=${before.version}`);
  assert.equal(streamResponse.status, 200);
  const reader = streamResponse.body.getReader();
  const chunk = await reader.read();
  await reader.cancel();
  const eventText = new TextDecoder().decode(chunk.value);
  assert.match(eventText, /event: match\.result_published/);
  assert.match(eventText, new RegExp(`id: ${first.version}`));
});

test("enforces viewer permissions at the API boundary", async () => {
  const sessionCookie = await createSession("viewer");
  const snapshot = await (await fetch(`${tournamentUrl}/snapshot`)).json();
  const response = await fetch(`${tournamentUrl}/results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      matchId: "upper-final",
      homeScore: 13,
      awayScore: 13,
      expectedVersion: snapshot.version,
    }),
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden" });
});
