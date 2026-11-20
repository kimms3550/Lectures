import express from "express";
import { fileURLToPath } from "node:url";
import { buildingNames, rooms } from "./rooms.js";

export const app = express();

app.use((req, res, next) => {
  res.on("finish", () => console.log(`${req.method} ${req.originalUrl} → ${res.statusCode}`));
  next();
});

app.get("/api/rooms", (req, res) => {
  const { building, minFree = "0" } = req.query;
  if (building !== undefined &&
      (typeof building !== "string" || !Object.hasOwn(buildingNames, building))) {
    return res.status(400).json({ error: "building에는 ENG 또는 SCI 한 개를 지정하세요." });
  }
  if (typeof minFree !== "string" || !/^\d+$/.test(minFree) ||
      !Number.isSafeInteger(Number(minFree))) {
    return res.status(400).json({ error: "minFree에는 0 이상의 안전한 정수 한 개를 지정하세요." });
  }

  const minimum = Number(minFree);
  const items = rooms
    .filter(room => (!building || room.building === building) && room.freeSeats >= minimum)
    .map(({ id, name, building, buildingName, capacity, freeSeats }) =>
      ({ id, name, building, buildingName, capacity, freeSeats }));
  res.json({ count: items.length, items });
});

app.get("/api/rooms/:id", (req, res) => {
  const room = rooms.find(item => item.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: "해당 실습실을 찾을 수 없습니다." });
  }
  res.json(room);
});

const publicDir = fileURLToPath(new URL("./public/", import.meta.url));
app.use(express.static(publicDir));
app.use((req, res) => res.status(404).json({ error: "요청한 경로를 찾을 수 없습니다." }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error.message);
  const status = error.status || 500;
  res.status(status).json({ error: status === 400 ? "요청 형식을 확인하세요." : "요청을 처리할 수 없습니다." });
});
