export const buildingNames = { ENG: "공학관", SCI: "자연관" };

// 실습용 스냅샷. 빈 좌석 수는 정원과 사용 중인 좌석에서 계산한다.
export const rooms = [
  { id: "E101", name: "시스템 실습실", building: "ENG", capacity: 24, occupied: 20,
    equipment: ["Linux PC", "유선 LAN"] },
  { id: "E202", name: "네트워크 실습실", building: "ENG", capacity: 16, occupied: 16,
    equipment: ["라우터", "스위치"] },
  { id: "S201", name: "데이터 분석실", building: "SCI", capacity: 30, occupied: 18,
    equipment: ["분석용 워크스테이션", "듀얼 모니터"] },
  { id: "S305", name: "임베디드 실습실", building: "SCI", capacity: 12, occupied: 10,
    equipment: ["개발 보드", "오실로스코프"] }
].map(room => ({
  ...room,
  buildingName: buildingNames[room.building],
  freeSeats: room.capacity - room.occupied
}));
