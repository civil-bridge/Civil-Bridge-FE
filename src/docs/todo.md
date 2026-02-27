# API 연동 TODO 및 작업 계획

`src/docs/API_SPEC.md`와 현재 프로젝트의 패키지/구조(`src/`) 상태를 비교하여 작성된, 앞으로 진행해야 할 통신 계층 개발 및 UI 연동 작업 목록입니다. 현재 UI 컴포넌트들만 구성되어 있으며, 통신 요청(HTTP/WebSocket)에 대한 클라이언트 설정 및 타입 정의 등이 모두 비어있는 상태입니다.

---

## 1. 기반 설정 및 패키지 설치
현재 프로젝트(`package.json` 기준)에는 API 통신을 위한 라이브러리가 포함되어 있지 않습니다.
- [ ] **의존성 패키지 설치**
  - [ ] `axios`: HTTP API 통신을 위한 클라이언트
  - [ ] `@stomp/stompjs` 및 `sockjs-client`: WebSocket 및 STOMP 채팅 서버 통신 유지율/편의성을 높이기 위한 라이브러리
  - [ ] `@tanstack/react-query` (권장): 서버 데이터와 UI 상태의 동기화, 캐싱, 페이지네이션 처리를 위한 전역 서버 상태 관리 도구
- [ ] **환경 변수 파일 설정**
  - [ ] `.env.local`, `.env.production` 파일 생성
  - [ ] 백엔드 서버 URL 및 소켓 URL 등록 (`VITE_API_BASE_URL` 등)

## 2. API 클라이언트 & 인터셉터 구성 (`src/api/axios.ts` 등)
- [ ] **공통 Axios 인스턴스 초기화**
  - [ ] `baseURL` 및 요청 `Timeout` 설정
  - [ ] `Content-Type: application/json` 기본 헤더 설정
- [ ] **Request Interceptor 설정**
  - [ ] 인증이 필요한 요청의 경우, 로컬 스토리지 등에 저장된 `accessToken`을 불러와 `Authorization: Bearer {accessToken}` 형태로 자동 주입
- [ ] **Response Interceptor 설정**
  - [ ] 전역 예외 처리 및 공통 응답 포맷 리턴(`response.data.data` 바로 접근 등)
  - [ ] 토큰 만료에 따른 `401` 에러 발생 시, Refresh Token API(`POST /api/auth/refresh`)를 호출하여 `accessToken`를 갱신
  - [ ] 갱신 성공 시 원래 실패했던 Request 자동 재시도
  - [ ] Refresh Token마저 만료된 경우 전역 로그아웃 처리 후 로그인 페이지로 리다이렉트

## 3. 타입(Type/Interface) 정의 (`src/types/`)
API 문서 8장의 Enum과 Request/Response 명세들을 타입으로 정의합니다.
- [ ] **공통 타입 정의 (`src/types/common.ts`)**
  - [ ] 기본 응답 구조 `ApiResponse<T>`
  - [ ] 페이지네이션 공통 구조
  - [ ] 전역 Enum 정의 (`AccessLevel`, `SubmitStatus`, `MessageType`, `Role`)
- [ ] **도메인 단위 타입 분리**
  - [ ] `src/types/auth.ts`: 로그인, 리프레시 토큰 DTO
  - [ ] `src/types/user.ts`: 회원가입, 내 정보
  - [ ] `src/types/room.ts`: 논의방 생성, 조회, 입장 DTO
  - [ ] `src/types/proposal.ts`: 제안서 생성/수정, 잠금, 동의 등 모든 속성 DTO
  - [ ] `src/types/message.ts`: 지난 채팅 기록 DTO (커서 페이징 응답용) 및 소켓 통신용 Message DTO

## 4. 도메인별 API 호출 함수 구현 (`src/api/`)
Axios를 활용하여 각 API 에ンド포인트와 1:1 대응되는 비동기 함수들을 설계합니다.
- [ ] `src/api/auth.ts`: `login`, `logout`, `refreshToken` (API 2-1 ~ 2-3)
- [ ] `src/api/user.ts`: `signup`, `sendEmailVerification`, `verifyEmail` (API 3-1 ~ 3-3)
- [ ] `src/api/room.ts`: `createRoom`, `getTotalRooms`, `getMyJoinedRooms`, `joinRoom`, `leaveRoom` (API 4-1 ~ 4-5)
- [ ] `src/api/proposal.ts`: 
  - `createProposal`, `getProposal`, `getProposalsByRoom`, `updateProposal`
  - 제안서 락 관련: `getLockStatus`, `startEditing`, `finishEditing`
  - 투표 관련: `startVoting`, `endVoting`, `consentProposal`, `getConsenters` (API 5-1 ~ 5-11)
- [ ] `src/api/message.ts`: `getMessagesByRoom` (커서 기반 페이징) (API 6-1)

## 5. WebSocket (STOMP) 실시간 채팅 구현 (`src/hooks/useChat.ts` 등)
- [ ] STOMP 클라이언트 커스텀 훅 설계 (`useChat` 등)
- [ ] `ws://{서버주소}/gyeonggi_partners-chat` 웹소켓/SockJS 연결 로직
- [ ] 채팅방에 해당되는 토픽 구독 로직 구현 (`/topic/room.{roomId}`)
- [ ] 입장 시 `JOIN` 메시지 전송 로직 구현 (`SEND /app/chat.addUser`)
- [ ] 실시간 채팅 텍스트 `CHAT` 발송 로직 구현 (`SEND /app/chat.sendMessage`)
- [ ] 구독 도중 메세지를 받았을 때, 로컬의 메세지 리스트(상태)를 업데이트

## 6. UI(View) 연동 및 글로벌 상태 연결
각 로직이 구현되면 실제 페이지 컴포넌트의 더미 데이터를 제거하고 연동합니다.
- [ ] [ ] 로그인 상태 및 유저 정보 전역 상태 관리 (Context API 혹은 Zustand 등)
- [ ] [ ] 회원가입 화면: 이메일 전송/인증 절차 흐름 제어 및 폼 서브밋 연동
- [ ] [ ] 로그인 화면: 로그인 요청 후 Access/Refresh 토큰 저장 및 메인화면 리다이렉트
- [ ] [ ] 메인 화면(논의방 리스트): `getTotalRooms`, `getMyJoinedRooms`와 페이지네이션 연결
- [ ] [ ] 논의방 화면(채팅 뷰): 
  - 이전 메시지 무한 스크롤(`getMessagesByRoom` 커서 페이징)
  - STOMP를 활용한 실시간 채팅 표시 및 전송 기능
- [ ] [ ] 논의방 화면(제안서 뷰):
  - 제안서 편집 시 락(Lock) 점유 및 반환 로직 처리 연동
  - 상태별(`SUBMITTABLE`, `VOTING` 등) 화면 분기 로직(생성 폼 노출, 투표 비율, 남은 시간 노출 등) 연동
