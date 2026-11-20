# 실습실 빈자리 찾기

네 명이 함께 과제를 하려고 한다. 공학관에는 네 자리가 남은 실습실이 있을까? 이 질문을 HTTP 요청으로 표현하고, 서버가 돌려준 답을 브라우저의 표에 표시하는 실습이다. 강의 PDF 11~13쪽의 기본 HTTP 서버와 16~24쪽의 Express 서버에서 **같은 방 하나를 조회**해 보면 프레임워크가 대신 처리하는 일을 코드로 확인할 수 있다.

## 실행

Node.js 20 이상과 npm을 사용한다. 저장소를 처음 내려받을 때는 PowerShell에서 다음 명령을 실행한다.

```powershell
git clone https://github.com/kimms3550/Lectures.git
cd Lectures/node-room-lab
npm.cmd ci
npm.cmd start
```

이미 프로젝트 폴더에 패키지를 설치했다면 그 폴더에서 `npm.cmd start`로 실행한다. Windows에서 Visual Studio에 포함된 Node.js를 사용하려면 다음 두 줄을 먼저 실행해 현재 터미널 경로에 추가할 수 있다.

```powershell
$runtimeDir = 'C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs'
$env:Path = "$runtimeDir;$env:Path"
```

서버를 켠 채 브라우저에서 [실습 화면](http://127.0.0.1:1930)을 연다. `npm ci`는 `package-lock.json`에 기록된 버전으로 Express와 하위 패키지를 설치한다. 서버는 실행한 터미널에서 `Ctrl+C`로 종료한다.

## 1. 화면의 숫자를 손으로 검산하기

좌석 데이터는 [rooms.js](rooms.js)에 있는 고정된 실습용 스냅샷이다. 시스템은 모듈을 불러올 때 각 방의 `freeSeats = capacity - occupied`를 한 번 계산한다.

| ID | 건물 | 실습실 | 정원 | 사용 중 | 빈 좌석 |
| --- | --- | --- | ---: | ---: | ---: |
| E101 | 공학관(ENG) | 시스템 실습실 | 24 | 20 | 4 |
| E202 | 공학관(ENG) | 네트워크 실습실 | 16 | 16 | 0 |
| S201 | 자연관(SCI) | 데이터 분석실 | 30 | 18 | 12 |
| S305 | 자연관(SCI) | 임베디드 실습실 | 12 | 10 | 2 |

1. 첫 화면에는 네 곳이 표시된다. 최소 좌석 수의 기본값이 0이므로 만석인 E202도 조건을 만족한다.
2. **공학관**, **최소 빈 좌석 수 4**를 선택하고 **조회**를 누른다. E101 한 곳이 남는다. 화면에 표시된 요청 주소와 HTTP 상태를 확인한다.
3. E101의 **JSON 보기**를 연다. 상세 응답의 `capacity`와 `occupied`로 표의 4석을 검산하고, `equipment`에서 장비 목록을 확인한다.
4. 뒤로 돌아와 같은 건물에서 최소 좌석 수를 **5**로 바꿔 조회한다. 검색은 성공했지만 조건에 맞는 방은 0곳이다. 이때의 상태 코드가 왜 200인지 다음 단계에서 확인한다.

## 2. 요청 하나를 브라우저에서 서버까지 따라가기

브라우저 개발자 도구의 **Network**에서 **Fetch/XHR**를 선택한 뒤 4석 조건으로 다시 조회한다. 아래는 해당 요청의 경로와 그에 대한 목록 응답이다.

```http
GET /api/rooms?building=ENG&minFree=4 HTTP/1.1
Host: 127.0.0.1:1930
```

```json
{
  "count": 1,
  "items": [
    { "id": "E101", "name": "시스템 실습실", "building": "ENG", "buildingName": "공학관", "capacity": 24, "freeSeats": 4 }
  ]
}
```

1. **포트와 정적 파일** · [server.js](server.js)의 `listen(1930, ...)`이 로컬 주소에서 요청을 기다린다. 처음 `/`에 접속하면 `express.static`이 [index.html](public/index.html)을 제공한다. 브라우저는 이 HTML이 참조한 CSS와 JavaScript를 각각 추가로 요청한다.
2. **클라이언트** · [client.js](public/client.js)의 `loadRooms()`는 폼 값을 `URLSearchParams`로 인코딩해 `fetch`로 보낸다. 검색할 때는 표 데이터만 다시 받는다. 상대 경로 `/api/rooms`를 사용하므로 요청은 화면을 제공한 서버의 같은 포트로 간다.
3. **라우팅과 검증** · [app.js](app.js)의 `app.get("/api/rooms", ...)`가 목록 요청을 받는다. URL에 적은 `4`는 `req.query.minFree`에서 문자열 `"4"`가 된다. 핸들러는 입력 전체가 숫자로 구성됐는지와 안전한 정수 범위를 확인한다. 예를 들어 `parseInt("4석")`은 4를 반환하므로 그것만 쓰면 잘못된 입력도 검색 조건으로 통과한다.
4. **검색과 직렬화** · `filter`는 건물이 일치하고 `freeSeats >= minimum`인 방을 고른다. `map`은 표에 쓸 필드만 남긴다. `res.json({ count, items })`가 객체를 JSON으로 직렬화하고 응답을 끝낸다. 목록을 한 번 훑으므로 방이 n개일 때 검색 시간은 O(n)이다.
5. **결과 표시** · 브라우저는 `response.json()`으로 본문을 읽고 `response.ok`로 성공과 실패를 구분한다. HTTP 404 응답도 `fetch`의 Promise가 정상적으로 반환될 수 있기 때문이다. 서버 터미널의 `GET … → 200` 로그와 Network 탭의 상태를 대조해 보자.

### 경로 매개변수와 쿼리 문자열

| 요청 | 서버에서 읽는 값 | 의미 |
| --- | --- | --- |
| `GET /api/rooms/E101` | `req.params.id`가 `"E101"` | 특정 실습실 하나를 지정한다. 상세 응답에는 장비와 사용 중인 좌석 수도 들어간다. |
| `GET /api/rooms?building=ENG&minFree=4` | `req.query.building`, `req.query.minFree` | 실습실 목록에 검색 조건을 건다. 두 조건은 각각 생략할 수 있다. |

## 3. 기본 HTTP와 Express 비교하기

두 번째 PowerShell에서 같은 폴더로 이동한다. 필요하면 위의 Node.js 경로 설정도 그 터미널에 적용한다. Express 서버를 켜 둔 채 아래 명령으로 기본 HTTP 서버를 실행한다.

```powershell
npm.cmd run start:http
```

브라우저 탭 두 개에서 [기본 HTTP의 E101](http://127.0.0.1:1931/api/rooms/E101)과 [Express의 E101](http://127.0.0.1:1930/api/rooms/E101)을 연다. 두 서버는 같은 데이터를 사용하고 별도 포트에서 동작한다. 기본 서버의 실습 범위는 상세 조회 한 개다.

| 같은 요청을 처리하는 단계 | [basic-http.js](basic-http.js), 포트 1931 | [app.js](app.js), 포트 1930 |
| --- | --- | --- |
| 요청 받기 | `http.createServer(callback)`에 요청 이벤트 콜백을 등록한다. | `app.get("/api/rooms/:id", callback)`에 메서드와 경로를 등록한다. |
| 방 찾기 | `req.url`에서 경로를 꺼내 각 방의 상세 경로와 비교한다. | Express가 추출한 `req.params.id`로 방을 찾는다. |
| 응답 보내기 | `statusCode`, `setHeader`, `JSON.stringify`, `end`를 직접 사용한다. | `res.json(room)`이 JSON 헤더, 직렬화, 응답 종료를 처리한다. 실패는 `res.status(404).json(...)`으로 보낸다. |

두 구현에서 모두 실패 분기를 따라가 보자. Express 코드의 `return res.status(404).json(...)`에서 응답을 보내는 쪽은 `json()`이고, `return`은 그 아래의 성공 응답까지 실행되는 일을 막는다.

## 4. 상태 코드를 실험으로 구분하기

Express 서버가 실행 중일 때 다른 PowerShell에서 아래 명령을 한 줄씩 실행한다. `-i` 옵션은 상태 줄, 헤더, 본문을 함께 보여 준다.

```powershell
curl.exe -i "http://127.0.0.1:1930/api/rooms?building=ENG&minFree=5"
curl.exe -i "http://127.0.0.1:1930/api/rooms?minFree=-1"
curl.exe -i "http://127.0.0.1:1930/api/rooms/X999"
```

| 요청의 의미 | 예상 상태 | 본문에서 관찰할 것 |
| --- | --- | --- |
| 공학관에서 5석 이상 검색 | 200 OK | 존재하는 목록을 정상적으로 검색했으므로 `{"count":0,"items":[]}`가 온다. |
| 최소 빈 좌석 수에 음수 전달 | 400 Bad Request | 조건이 유효하지 않아 검색을 시작하기 전에 `error`를 돌려준다. |
| X999를 직접 지정 | 404 Not Found | 지정한 방이 데이터에 없어 `error`를 돌려준다. |

## 5. 한 줄을 바꾸고 테스트로 확인하기

프로젝트 폴더에서 `npm.cmd test`를 실행한다. [테스트](test/api.test.js)는 운영체제가 배정한 임시 포트에 앱을 띄우고 실제 HTTP 요청을 보내므로 1930 서버와 함께 실행할 수 있다. 목록, 필터의 경계값, 빈 결과, 잘못된 입력, 상세 응답, 404, 정적 파일 제공을 점검한다.

**연습 문제** · [app.js](app.js)의 필터에서 `>=`를 `>`로 바꾸면 어떤 테스트가 실패할지 먼저 적어 보자. 기본 목록에서는 빈 좌석 0인 E202가, 공학관 4석 검색에서는 빈 좌석 4인 E101이 빠진다. 테스트를 실행해 두 실패를 확인한 뒤 `>=`로 복원하고 다시 실행한다. 이미 실행 중인 브라우저용 서버에도 수정한 코드를 반영하려면 그 서버를 재시작한다.

라우트 등록과 요청·응답 객체의 다른 메서드는 Express API에서 확인할 수 있다. [Express 5.x 공식 문서](https://expressjs.com/en/5x/api/)
