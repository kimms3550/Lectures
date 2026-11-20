import { app } from "./app.js";

app.listen(1930, "127.0.0.1", error => {
  if (error) {
    console.error("서버 시작 실패:", error.message);
    process.exitCode = 1;
    return;
  }
  console.log("실습실 좌석 조회  http://127.0.0.1:1930");
});
