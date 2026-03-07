# 비로그인 사용자 메인 페이지 접근 허용 (설계 계획서)

현재 로그인한 사용자만 이용할 수 있던 메인 페이지 트래픽 구조를 개선하여, 로그인하지 않은 사람도 실시간 논의방 목록을 열람할 수 있도록 변경합니다. 이 문서는 해당 기능 구현을 위한 뷰/컴포넌트 및 API, 벡엔드 인증 정책(Security) 변경 계획을 담고 있습니다.

## 1. 개요 및 요구사항
- **기본 접속 경로 변경**: 인증되지 않은 사용자도 사이트 접속(`/`) 시 로그인 화면이 아닌 **메인 페이지**가 노출되록 수정. (최근 반영했던 기본 페이지 로그인 리다이렉트를 롤백)
- **제한적 열람 권한 부여**: 비회원은 메인 페이지의 '실시간 방 목록(all)'탭만 열람 가능. 단, **방 내부로 입장하는 것은 불가** (클릭 시 로그인 유도 메시지).
- **비회원 UI 제약 사항 (권한 분리)**:
  - 내가 참여중인 토의실 (Joined) 탭 비활성화 또는 클릭 시 "로그인이 필요합니다" 노출
  - [마이룸] 네비게이션 탭 안보임
  - [새로운 토의방 만들기] 버튼 클릭 시 "로그인 먼저 해주세요" 알럿 노출
  - 헤더부: 비로그인 시 우측 상단에 **[로그인/회원가입]** 버튼 배치, 로그인 유저 시에는 기존처럼 **["OOO님 환영합니다"]** 텍스트 및 [로그아웃] 버튼 노출.

---

## 2. Frontend 변경 계획 설계

### 2-1. Router 및 Page 제어 (`App.tsx` & 컴포넌트)
1. **ProtectedRoute 해제/변경**:
   - 기존에 메인 페이지(`/`)를 래핑하고 있던 인증 가드(`ProtectedRoute` 혹은 유사한 리다이렉트 로직)를 제거. 메인 페이지는 Public Route로 전환.
2. **`Header.tsx` 수정**:
   - `isAuthenticated` (인증 상태) 스토어 값을 구독.
   - `isAuthenticated === false`일 경우: 우측 섹션에 '로그인', '회원가입' 버튼 렌더링. 마이룸(My Room) 탭 숨김 처리.
   - `isAuthenticated === true`일 경우: 기존 UI 유지 (`"OOO님 환영합니다"`, 로그아웃).
3. **`MainPage.tsx` 및 `RoomListSection.tsx` 수정**:
   - '내가 참여 중인 토의실' 탭은 렌더링을 막거나 클릭 시 "로그인 후 이용 가능합니다." 문구 표시.
   - 배너의 [논의방 만들기] 버튼 클릭 이벤트에 `if (!isAuthenticated)` 검사를 추가하여 `alert("로그인 먼저 해주세요.")` 처리.
4. **`RoomCard.tsx` 수정**:
   - 카드를 클릭하여 방 입장(`/room/:id`)을 시도할 때 `isAuthenticated` 를 검사.
   - 비인증 시 `alert("로그인이 필요한 서비스입니다.")` 띄우고 페이지 이동 차단.

### 2-2. API 연동 (`src/api/room.ts`)
- `getTotalRooms` API는 이제 헤더에 **Authorization(Bearer 토큰) 없이** 요청을 보낼 수 있어야 함. (또는 토큰이 없으면 안 보내도록 axios 인터셉터/인스턴스 설정 확인 필요)

---

## 3. Backend (Spring Boot) 변경 계획 설계

프론트엔드에서 비로그인 상태로 메인 방 목록 API(`getTotalRooms`)를 호출할 수 있도록, 백엔드의 인증 관련 **필터 체인 관문(SecurityConfig)을 개방**해야 합니다.

### 3-1. `SecurityConfig.java` 수정
Spring Security를 사용하는 경우 `SecurityFilterChain` 빈 설정에서 메인 방 목록 조회 API 경로를 **`permitAll()`**에 추가해야 합니다.

```java
// 예시: API 경로가 GET /api/rooms 인 경우
http.authorizeHttpRequests(auth -> auth
    // ... 기존 회원가입, 로그인 경로는 이미 permitAll 처리되어 있음 ...
    .requestMatchers(HttpMethod.GET, "/api/rooms").permitAll() // 방 목록 조회 전체 개방
    // 그 외 방 생성이나 수정, 입장 등의 로직은 인증 필수 유지!
    .requestMatchers("/api/rooms/**").authenticated() 
    .anyRequest().authenticated()
);
```

### 3-2. API 컨트롤러 (`RoomController.java`) 검토
메인 방 목록 조회를 담당하는 엔드포인트(예: `getTotalRooms()`) 내부 로직에서 만약 **로그인한 유저 정보(`@AuthenticationPrincipal` 등)**를 필수(`required = true`)로 받고 있다면 이를 **선택(Optional)**으로 처리하거나 아예 사용하지 않도록 수정해야 합니다. 
- 비회원이 조회할 때는 로그인 유저의 정보가 넘어오지 않으므로, 이 부분을 처리하지 않으면 `NullPointerException`이나 인증 에러가 백엔드에서 터질 수 있습니다.

### 3-3. 프론트엔드 연동 주의 (CORS / axios)
일반적으로 `permitAll()` 경로라도 서버 설정에 따라 헤더에 빈 토큰 `Bearer null` 이나 `undefined` 가 담겨 들어가면 필터 단에서 파싱 에러(Jwt Parsing Error)를 내뱉는 경우가 종종 있습니다. 프론트엔드에서 토큰이 없을 땐 헤더 자체를 생략하게 하거나, 백엔드 Jwt Filter에서 잘못된 포맷은 가볍게 무시하고 다음 체인으로 넘기는(비회원 취급) 방어 로직이 함께 필요합니다.

---

## 4. 진행 순서 요약
1. 백엔드 팀(혹은 작업자)이 `SecurityConfig.java` 및 컨트롤러를 수정하여 방 목록 API를 비회원도(토큰 없이) 호출 가능하도록 배포.
2. 프론트엔드 `App.tsx`에서 메인 페이지 Private 라우팅 해제.
3. 프론트엔드 `Header` 컴포넌트 우측 상단 '로그인/회원가입' vs '님 환영합니다' 분기 처리.
4. 컴포넌트 곳곳(방 입장, 방 만들기 버튼 등) 클릭 시 인증 스토어 상태(`isAuthenticated`) 확인 후 가드(Alert창) 및 방어 로직 추가.
