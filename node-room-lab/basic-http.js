import http from "node:http";
import { rooms } from "./rooms.js";

// 비교할 기능을 상세 조회 하나로 줄여 HTTP 응답을 만드는 과정을 살펴본다.
const server = http.createServer((req, res) => {
  const [pathname] = req.url.split("?");
  const room = rooms.find(item => pathname === `/api/rooms/${item.id}`);
  const found = req.method === "GET" && room !== undefined;

  res.statusCode = found ? 200 : 404;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(found ? room : { error: "요청한 자료를 찾을 수 없습니다." }));
});

server.listen(1931, "127.0.0.1", () => {
  console.log("기본 HTTP 서버  http://127.0.0.1:1931/api/rooms/E101");
});
