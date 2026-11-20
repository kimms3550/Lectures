const form = document.querySelector("#filters");
const result = document.querySelector("#result");
const requestLine = document.querySelector("#request");
const table = document.querySelector("#rooms");
const body = table.querySelector("tbody");
const template = document.querySelector("#row");
const button = form.querySelector("button");

function addRow(room) {
  const row = template.content.cloneNode(true);
  row.querySelector(".room-name").textContent = room.name;
  row.querySelector("small").textContent = room.id;
  row.querySelector(".building").textContent = room.buildingName;
  const seats = row.querySelector(".seats");
  seats.textContent = `${room.freeSeats} / ${room.capacity}`;
  seats.classList.toggle("full", room.freeSeats === 0);
  const link = row.querySelector("a");
  link.href = `/api/rooms/${encodeURIComponent(room.id)}`;
  link.setAttribute("aria-label", `${room.name} 상세 JSON 보기`);
  body.append(row);
}

async function loadRooms() {
  const query = new URLSearchParams(new FormData(form));
  if (!query.get("building")) query.delete("building");
  const url = `/api/rooms?${query}`;
  button.disabled = true;
  table.hidden = true;
  body.replaceChildren();
  result.textContent = "조회 중…";
  requestLine.textContent = `GET ${url}`;
  try {
    const response = await fetch(url);
    requestLine.textContent += ` → HTTP ${response.status}`;
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    data.items.forEach(addRow);
    table.hidden = data.count === 0;
    result.textContent = data.count ? `실습실 ${data.count}곳` : "조건에 맞는 실습실이 없습니다.";
  } catch (error) {
    result.textContent = `조회 실패 · ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  loadRooms();
});
loadRooms();
