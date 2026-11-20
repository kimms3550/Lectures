import assert from "node:assert/strict";
import { once } from "node:events";
import { after, test } from "node:test";
import { app } from "../app.js";

const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
after(() => new Promise(resolve => server.close(resolve)));

async function getJson(path, expectedStatus) {
  const response = await fetch(base + path);
  assert.equal(response.status, expectedStatus);
  assert.match(response.headers.get("content-type"), /application\/json/);
  return response.json();
}

test("기본 목록에는 만석인 방을 포함한 네 곳이 있다", async () => {
  const data = await getJson("/api/rooms", 200);
  assert.equal(data.count, 4);
  assert.deepEqual(data.items.map(room => room.freeSeats), [4, 0, 12, 2]);
});

test("두 조건을 동시에 적용하고 최소 좌석과 정확히 같은 방을 포함한다", async () => {
  const data = await getJson("/api/rooms?building=ENG&minFree=4", 200);
  assert.equal(data.count, 1);
  assert.deepEqual(data.items.map(room => room.id), ["E101"]);
});

test("조건을 만족하는 방이 없으면 빈 목록을 반환한다", async () => {
  assert.deepEqual(await getJson("/api/rooms?building=ENG&minFree=5", 200), { count: 0, items: [] });
});

test("잘못된 건물, 수치, 중복 조건에는 400과 오류 메시지를 반환한다", async () => {
  for (const query of ["building=ETC", "minFree=-1", "minFree=2.5", "minFree=2abc",
    "minFree=", "minFree=9007199254740992", "minFree=1&minFree=2", "building=ENG&building=SCI"]) {
    const data = await getJson(`/api/rooms?${query}`, 400);
    assert.ok(data.error);
  }
});

test("상세 조회 결과로 빈 좌석 수를 검산하고 장비를 확인할 수 있다", async () => {
  const room = await getJson("/api/rooms/E101", 200);
  assert.equal(room.id, "E101");
  assert.equal(room.freeSeats, room.capacity - room.occupied);
  assert.ok(room.equipment.includes("Linux PC"));
});

test("없는 실습실과 미등록 경로에는 404를 반환한다", async () => {
  for (const path of ["/api/rooms/X999", "/api/unknown"]) {
    assert.ok((await getJson(path, 404)).error);
  }
});

test("첫 화면과 브라우저가 불러오는 파일을 제공한다", async () => {
  for (const [path, type] of [["/", "text/html"], ["/client.js", "javascript"], ["/styles.css", "text/css"]]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("content-type").includes(type));
    assert.ok((await response.text()).length);
  }
});
