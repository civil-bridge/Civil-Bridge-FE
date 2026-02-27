# Civil Bridge API 명세서

> **버전**: 2026-02-25 기준 실제 구현된 엔드포인트 기준
> **Base URL**: `http://localhost:8080` (로컬), `https://api.civil-bridge.com` (운영)
> **API 문서(Swagger)**: `http://localhost:8080/swagger-ui.html`

---

## 목차

1. [공통 사항](#1-공통-사항)
2. [Auth API](#2-auth-api)
3. [User API](#3-user-api)
4. [Discussion Room API](#4-discussion-room-api)
5. [Proposal API](#5-proposal-api)
6. [Message API](#6-message-api)
7. [WebSocket (STOMP)](#7-websocket-stomp)
8. [Enum 정의](#8-enum-정의)

---

## 1. 공통 사항

### 인증 방식

인증이 필요한 엔드포인트는 HTTP 요청 헤더에 Bearer 토큰을 포함해야 합니다.

```
Authorization: Bearer {accessToken}
```

### 인증 불필요 엔드포인트 (Public)

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/auth/login` | POST | 로그인 |
| `/api/auth/refresh` | POST | 토큰 갱신 |
| `/api/users/signup` | POST | 회원가입 |
| `/api/users/email/send` | POST | 이메일 인증 코드 발송 |
| `/api/users/email/verify` | POST | 이메일 인증 확인 |
| `/swagger-ui/**` | GET | Swagger UI |
| `/v3/api-docs/**` | GET | OpenAPI 스펙 |
| `/actuator/health/**` | GET | 헬스 체크 |

### 공통 응답 포맷

모든 API는 아래 포맷으로 응답합니다.

```json
{
  "code": "SUCCESS",
  "message": "처리 결과 메시지",
  "data": { ... }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `code` | `string` | 결과 코드. 성공 시 `"SUCCESS"`, 실패 시 에러 코드 문자열 |
| `message` | `string` | 결과 메시지 |
| `data` | `object \| null` | 응답 데이터. 없을 경우 필드 자체가 생략됨 |

### 에러 응답 포맷

실패 시 `data` 필드는 생략되며, 에러 코드와 메시지만 반환됩니다.

```json
{
  "code": "USER_NOT_FOUND",
  "message": "사용자를 찾을 수 없습니다."
}
```

---

## 2. Auth API

### 2-1. 로그인

**`POST /api/auth/login`**
인증 불필요

#### Request Body

```json
{
  "loginId": "newuser123",
  "password": "password123!"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `loginId` | `string` | ✅ | 로그인 ID |
| `password` | `string` | ✅ | 비밀번호 |

#### Response Body (`data`)

```json
{
  "userId": 1,
  "nickname": "길동이",
  "email": "hong@example.com",
  "role": "USER",
  "grantType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `userId` | `number` | 사용자 ID |
| `nickname` | `string` | 닉네임 |
| `email` | `string` | 이메일 |
| `role` | `string` | 권한 (`USER`, `OFFICIAL`, `ADMIN`) |
| `grantType` | `string` | 토큰 타입 (항상 `"Bearer"`) |
| `accessToken` | `string` | Access Token (유효기간: 1시간) |
| `refreshToken` | `string` | Refresh Token (유효기간: 7일) |

---

### 2-2. 로그아웃

**`POST /api/auth/logout`**
인증 필요 (`Authorization: Bearer {accessToken}`)

#### Request Body

없음

#### Response Body

```json
{
  "code": "SUCCESS",
  "message": "로그아웃되었습니다."
}
```

---

### 2-3. Access Token 재발급

**`POST /api/auth/refresh`**
인증 불필요

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `refreshToken` | `string` | ✅ | 발급받은 Refresh Token |

#### Response Body (`data`)

```json
{
  "grantType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `grantType` | `string` | 토큰 타입 (항상 `"Bearer"`) |
| `accessToken` | `string` | 새로 발급된 Access Token |
| `refreshToken` | `string` | 새로 발급된 Refresh Token |

---

## 3. User API

### 3-1. 회원가입

**`POST /api/users/signup`**
인증 불필요

#### Request Body

```json
{
  "loginId": "newuser123",
  "password": "password123!",
  "name": "홍길동",
  "nickname": "길동이",
  "email": "hong@example.com",
  "phoneNumber": "010-1234-5678"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|-----------|
| `loginId` | `string` | ✅ | 6~20자, 영문/숫자만 허용 |
| `password` | `string` | ✅ | 8자 이상, 영문+숫자+특수문자(`@$!%*#?&`) 포함 |
| `name` | `string` | ✅ | 2~20자, 한글/영문만 허용 |
| `nickname` | `string` | ✅ | 2~15자, 한글/영문/숫자 허용 |
| `email` | `string` | ✅ | 이메일 형식, 최대 50자 |
| `phoneNumber` | `string` | ✅ | `010-XXXX-XXXX` 형식 |

#### Response Body (`data`)

```json
{
  "userId": 1,
  "nickname": "길동이",
  "email": "hong@example.com",
  "role": "USER"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `userId` | `number` | 생성된 사용자 ID |
| `nickname` | `string` | 닉네임 |
| `email` | `string` | 이메일 |
| `role` | `string` | 기본값: `"USER"` |

---

### 3-2. 이메일 인증 코드 발송

**`POST /api/users/email/send`**
인증 불필요

회원가입 전 이메일 인증에 사용합니다. 6자리 인증 코드를 이메일로 발송하며 유효시간은 5분입니다.

#### Request Body

```json
{
  "email": "user@example.com"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | `string` | ✅ | 인증 코드를 받을 이메일 주소 |

#### Response Body

```json
{
  "code": "SUCCESS",
  "message": "인증번호가 성공적으로 발송되었습니다."
}
```

---

### 3-3. 이메일 인증 확인

**`POST /api/users/email/verify`**
인증 불필요

#### Request Body

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | `string` | ✅ | 인증 코드를 받은 이메일 주소 |
| `code` | `string` | ✅ | 수신한 6자리 인증 코드 |

#### Response Body

```json
{
  "code": "SUCCESS",
  "message": "이메일 인증에 성공했습니다."
}
```

---

## 4. Discussion Room API

모든 논의방 API는 인증이 필요합니다.

### 4-1. 논의방 생성

**`POST /api/discussion-rooms/create`**
인증 필요

논의방을 생성합니다. 생성자는 자동으로 해당 방에 참여 처리됩니다.

#### Request Body

```json
{
  "title": "부천시 BJ로 인한 지역 상권문제",
  "description": "현재 부천시 BJ로 인한 상권 문제에 대해 논의합니다.",
  "city": "부천시",
  "district": "원미구",
  "accessLevel": "PUBLIC"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|-----------|
| `title` | `string` | ✅ | 최대 100자 |
| `description` | `string` | ❌ | 최대 255자 |
| `city` | `string` | ✅ | 경기도 내 시/군 이름 |
| `district` | `string` | ✅ | 구/동 이름 |
| `accessLevel` | `string` | ✅ | `PUBLIC` \| `OFFICIALS_ONLY` \| `USER_ONLY` |

#### Response

HTTP 201 Created

```json
{
  "code": "SUCCESS",
  "message": "논의방이 생성되었습니다.",
  "data": {
    "roomId": 1,
    "title": "부천시 BJ로 인한 지역 상권문제",
    "description": "현재 부천시 BJ로 인한 상권 문제에 대해 논의합니다.",
    "city": "부천시",
    "district": "원미구",
    "accessLevel": "PUBLIC",
    "currentUsers": 1,
    "memberNicknames": ["길동이"],
    "joinedAt": "2026-02-25T14:30:00"
  }
}
```

`data` 필드 상세:

| 필드 | 타입 | 설명 |
|------|------|------|
| `roomId` | `number` | 생성된 논의방 ID |
| `title` | `string` | 논의방 제목 |
| `description` | `string` | 논의방 설명 |
| `city` | `string` | 시/군 |
| `district` | `string` | 구/동 |
| `accessLevel` | `string` | 접근 범위 |
| `currentUsers` | `number` | 현재 참여 인원 수 |
| `memberNicknames` | `string[]` | 참여 중인 멤버 닉네임 목록 |
| `joinedAt` | `string` | 입장 시각 (ISO 8601) |

---

### 4-2. 전체 논의방 목록 조회

**`GET /api/discussion-rooms/retrieveTotal`**
인증 필요

전체 논의방을 최신순으로 조회합니다.

#### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `page` | `number` | ❌ | `1` | 페이지 번호 (1부터 시작) |
| `size` | `number` | ❌ | `15` | 페이지 크기 |

#### Response Body (`data`)

```json
{
  "rooms": [
    {
      "roomId": 1,
      "title": "부천시 BJ로 인한 지역 상권문제",
      "city": "부천시",
      "district": "원미구",
      "accessLevel": "PUBLIC",
      "currentUsers": 15,
      "createdAt": "2026-02-20T10:30:00"
    }
  ],
  "currentPage": 1,
  "pageSize": 15,
  "totalCount": 150,
  "totalPages": 10
}
```

`rooms[]` 항목 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `roomId` | `number` | 논의방 ID |
| `title` | `string` | 논의방 제목 |
| `city` | `string` | 시/군 |
| `district` | `string` | 구/동 |
| `accessLevel` | `string` | 접근 범위 |
| `currentUsers` | `number` | 현재 참여 인원 수 |
| `createdAt` | `string` | 생성 일시 (ISO 8601) |

페이지네이션 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `currentPage` | `number` | 현재 페이지 번호 |
| `pageSize` | `number` | 페이지 크기 |
| `totalCount` | `number` | 전체 논의방 수 |
| `totalPages` | `number` | 전체 페이지 수 |

---

### 4-3. 내가 참여한 논의방 목록 조회

**`GET /api/discussion-rooms/retrieveMyJoined`**
인증 필요

현재 로그인 사용자가 참여 중인 논의방을 최신 참여순으로 조회합니다.

#### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `page` | `number` | ❌ | `1` | 페이지 번호 (1부터 시작) |
| `size` | `number` | ❌ | `15` | 페이지 크기 |

#### Response Body (`data`)

`4-2. 전체 목록 조회`의 응답 포맷과 동일합니다.

---

### 4-4. 논의방 입장

**`POST /api/discussion-rooms/{roomId}/join`**
인증 필요

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `roomId` | `number` | 입장할 논의방 ID |

#### Request Body

없음

#### Response

HTTP 201 Created
`data` 필드는 `4-1. 논의방 생성` 응답의 `data` 와 동일한 구조입니다 (`JoinRoomRes`).

```json
{
  "code": "SUCCESS",
  "message": "논의방에 입장했습니다.",
  "data": {
    "roomId": 1,
    "title": "부천시 BJ로 인한 지역 상권문제",
    "description": "현재 부천시 BJ로 인한 상권 문제에 대해 논의합니다.",
    "city": "부천시",
    "district": "원미구",
    "accessLevel": "PUBLIC",
    "currentUsers": 16,
    "memberNicknames": ["길동이", "홍길동", "..."],
    "joinedAt": "2026-02-25T15:00:00"
  }
}
```

---

### 4-5. 논의방 나가기

**`DELETE /api/discussion-rooms/{roomId}/leave`**
인증 필요

마지막 멤버가 나가면 해당 방은 Soft Delete 처리됩니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `roomId` | `number` | 나갈 논의방 ID |

#### Request Body

없음

#### Response Body

```json
{
  "code": "SUCCESS",
  "message": "논의방 나가기에 성공하였습니다."
}
```

---

## 5. Proposal API

모든 제안서 API는 인증이 필요합니다.

### 5-1. 제안서 생성

**`POST /api/proposals`**
인증 필요

#### Request Body

```json
{
  "title": "수원시 영통구 교통 체증 해결 방안",
  "paragraph": "경기도 수원시 영통구의 교통 체증 문제를 해결하기 위한 제안입니다.",
  "image": "https://example.com/images/proposal.png",
  "solution": "버스 전용 차로 확대 및 신호 체계 개선",
  "expectedEffect": "출퇴근 시간 교통 체증 30% 감소 예상",
  "roomId": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | `string` | ❌ | 제안서 제목 |
| `paragraph` | `string` | ❌ | 본문 내용 |
| `image` | `string` | ❌ | 이미지 URL |
| `solution` | `string` | ❌ | 해결 방안 |
| `expectedEffect` | `string` | ❌ | 기대 효과 |
| `roomId` | `number` | ❌ | 연결할 논의방 ID |

#### Response Body (`data`)

`ProposalResponse` 구조 (하단 [공통 ProposalResponse 참조](#proposalresponse-구조))

---

### 5-2. 제안서 조회

**`GET /api/proposals/{proposalId}`**
인증 필요

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `proposalId` | `number` | 조회할 제안서 ID |

#### Response Body (`data`)

`ProposalResponse` 구조 참조

---

### 5-3. 논의방별 제안서 목록 조회

**`GET /api/proposals/rooms/{roomId}`**
인증 필요

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `roomId` | `number` | 논의방 ID |

#### Response Body (`data`)

`ProposalResponse[]` 배열

```json
[
  {
    "id": 1,
    "roomId": 1,
    "authorId": 5,
    "title": "수원시 영통구 교통 체증 해결 방안",
    "contents": { ... },
    "status": "SUBMITTABLE",
    "consents": [],
    "deadline": null,
    "createdAt": "2026-02-17T10:00:00",
    "updatedAt": "2026-02-17T10:00:00"
  }
]
```

---

### 5-4. 제안서 수정

**`PUT /api/proposals/{proposalId}`**
인증 필요

편집 락을 보유한 사용자만 수정할 수 있습니다. 수정 전 `5-6. 편집 시작`으로 락을 먼저 획득해야 합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `proposalId` | `number` | 수정할 제안서 ID |

#### Request Body

```json
{
  "title": "수원시 영통구 교통 체증 해결 방안 (수정)",
  "paragraph": "수정된 본문 내용",
  "image": "https://example.com/images/updated.png",
  "solution": "수정된 해결 방안",
  "expectedEffect": "수정된 기대 효과"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | `string` | ❌ | 수정할 제목 |
| `paragraph` | `string` | ❌ | 수정할 본문 |
| `image` | `string` | ❌ | 수정할 이미지 URL |
| `solution` | `string` | ❌ | 수정할 해결 방안 |
| `expectedEffect` | `string` | ❌ | 수정할 기대 효과 |

#### Response Body (`data`)

수정된 `ProposalResponse`

---

### 5-5. 편집 잠금 상태 확인

**`GET /api/proposals/{proposalId}/lock-status`**
인증 필요

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `proposalId` | `number` | 확인할 제안서 ID |

#### Response Body (`data`)

잠금 없는 경우:

```json
{
  "isLocked": false
}
```

잠금 있는 경우:

```json
{
  "isLocked": true,
  "lockOwnerId": 3,
  "lockOwnerNickname": "홍길동"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `isLocked` | `boolean` | 현재 잠금 여부 |
| `lockOwnerId` | `number \| null` | 잠금 보유자 ID (잠금 없으면 생략) |
| `lockOwnerNickname` | `string \| null` | 잠금 보유자 닉네임 (잠금 없으면 생략) |

---

### 5-6. 편집 시작 (락 획득)

**`POST /api/proposals/{proposalId}/start-editing`**
인증 필요

제안서 편집을 시작하며 편집 락을 획득합니다. 다른 사용자가 편집 중이면 실패합니다.
편집이 끝나면 반드시 `5-7. 편집 완료`를 호출하여 락을 해제해야 합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `proposalId` | `number` | 편집할 제안서 ID |

#### Request Body

없음

#### Response Body

```json
{
  "code": "SUCCESS",
  "message": "편집 시작."
}
```

---

### 5-7. 편집 완료 (락 해제)

**`POST /api/proposals/{proposalId}/finish-editing`**
인증 필요

편집을 완료하고 락을 해제합니다. 락을 보유한 사용자만 해제할 수 있습니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `proposalId` | `number` | 편집 완료할 제안서 ID |

#### Request Body

없음

#### Response Body

```json
{
  "code": "SUCCESS",
  "message": "편집 완료."
}
```

---

### 5-8. 투표 시작

**`POST /api/proposals/{proposalId}/start-voting`**
인증 필요

제안서에 대한 투표를 시작합니다. 기본 투표 기간은 3일입니다.
호출 후 제안서 상태가 `VOTING`으로 변경됩니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `proposalId` | `number` | 투표 시작할 제안서 ID |

#### Request Body

없음

#### Response Body (`data`)

투표 시작된 `ProposalResponse` (`status: "VOTING"`, `deadline` 값이 설정됨)

---

### 5-9. 투표 종료 (수동)

**`POST /api/proposals/{proposalId}/end-voting`**
인증 필요

진행 중인 투표를 수동으로 종료합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `proposalId` | `number` | 투표 종료할 제안서 ID |

#### Request Body

없음

#### Response Body (`data`)

투표 종료된 `ProposalResponse`

---

### 5-10. 제안서 동의 (투표)

**`POST /api/proposals/{proposalId}/consents`**
인증 필요

투표 중인 제안서에 동의합니다. 한 사용자는 한 제안서에 한 번만 동의할 수 있습니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `proposalId` | `number` | 동의할 제안서 ID |

#### Request Body

없음

#### Response Body

```json
{
  "code": "SUCCESS",
  "message": "제안서 동의 완료"
}
```

---

### 5-11. 동의자 목록 조회

**`GET /api/proposals/{proposalId}/consenters`**
인증 필요

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `proposalId` | `number` | 조회할 제안서 ID |

#### Response Body (`data`)

```json
{
  "totalConsents": 5,
  "consenters": [
    {
      "id": 1,
      "nickname": "홍길동"
    },
    {
      "id": 2,
      "nickname": "김철수"
    }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `totalConsents` | `number` | 총 동의 수 |
| `consenters` | `array` | 동의자 목록 |
| `consenters[].id` | `number` | 동의자 사용자 ID |
| `consenters[].nickname` | `string` | 동의자 닉네임 |

---

### ProposalResponse 구조

`5-1` ~ `5-9` 에서 공통으로 사용하는 제안서 응답 객체입니다.

```json
{
  "id": 1,
  "roomId": 1,
  "authorId": 5,
  "title": "수원시 영통구 교통 체증 해결 방안",
  "contents": {
    "paragraph": "경기도 수원시 영통구의 교통 체증 문제를 해결하기 위한 제안입니다.",
    "image": "https://example.com/images/proposal.png",
    "solution": "버스 전용 차로 확대 및 신호 체계 개선",
    "expectedEffect": "출퇴근 시간 교통 체증 30% 감소 예상"
  },
  "status": "SUBMITTABLE",
  "consents": [
    {
      "id": 1,
      "nickname": "홍길동"
    }
  ],
  "deadline": null,
  "createdAt": "2026-02-17T10:00:00",
  "updatedAt": "2026-02-17T10:00:00"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `number` | 제안서 ID |
| `roomId` | `number` | 연결된 논의방 ID |
| `authorId` | `number` | 작성자 사용자 ID |
| `title` | `string` | 제목 |
| `contents` | `object` | 본문 내용 객체 |
| `contents.paragraph` | `string` | 본문 텍스트 |
| `contents.image` | `string` | 이미지 URL |
| `contents.solution` | `string` | 해결 방안 |
| `contents.expectedEffect` | `string` | 기대 효과 |
| `status` | `string` | 제안서 상태 (`SUBMITTABLE` \| `UNSUBMITTABLE` \| `VOTING`) |
| `consents` | `array` | 동의자 목록 (`{id, nickname}[]`) |
| `deadline` | `string \| null` | 투표 마감 일시 (ISO 8601). 투표 시작 전에는 `null` |
| `createdAt` | `string` | 생성 일시 (ISO 8601) |
| `updatedAt` | `string` | 최종 수정 일시 (ISO 8601) |

---

## 6. Message API

### 6-1. 논의방 메시지 목록 조회 (커서 페이지네이션)

**`GET /api/messages/rooms/{roomId}`**
인증 불필요 (현재 설정 기준)

최근 메시지부터 역순으로 조회합니다. ID 기반 커서 페이지네이션을 사용합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `roomId` | `number` | 조회할 논의방 ID |

#### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `cursor` | `number` | ❌ | 없음 | 이전 응답의 `nextCursor` 값. 첫 요청 시 생략 |
| `size` | `number` | ❌ | `30` | 한 번에 조회할 메시지 수 |

#### Response Body (`data`)

```json
{
  "messages": [
    {
      "id": 150,
      "content": "안녕하세요!",
      "userName": "홍길동",
      "createdAt": "2026-02-25T14:30:00"
    },
    {
      "id": 149,
      "content": "반갑습니다.",
      "userName": "김철수",
      "createdAt": "2026-02-25T14:29:00"
    }
  ],
  "nextCursor": 149,
  "hasNext": true
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `messages` | `array` | 메시지 목록 (최신순) |
| `messages[].id` | `number` | 메시지 ID (커서로 사용) |
| `messages[].content` | `string` | 메시지 내용 |
| `messages[].userName` | `string` | 발신자 이름 |
| `messages[].createdAt` | `string` | 전송 일시 (ISO 8601) |
| `nextCursor` | `number \| null` | 다음 페이지 요청 시 사용할 커서. 다음 페이지 없으면 `null` |
| `hasNext` | `boolean` | 다음 페이지 존재 여부 |

#### 페이지네이션 사용 방법

1. 첫 요청: `GET /api/messages/rooms/1?size=30`
2. 다음 페이지: 응답의 `nextCursor` 값을 사용
   → `GET /api/messages/rooms/1?cursor=149&size=30`
3. `hasNext: false` 이면 마지막 페이지

---

## 7. WebSocket (STOMP)

실시간 채팅은 STOMP over WebSocket으로 구현되어 있습니다.

### 연결

```
WebSocket URL: ws://localhost:8080/gyeonggi_partners-chat
```

> SockJS를 지원합니다. SockJS 클라이언트 사용 시 HTTP URL `http://localhost:8080/gyeonggi_partners-chat` 로 연결합니다.

### STOMP 설정

| 항목 | 값 |
|------|---|
| App Prefix | `/app` |
| Broker Prefix | `/topic` |

---

### 7-1. 채팅방 입장

**STOMP SEND** `/app/chat.addUser`

채팅방에 접속할 때 서버에 사용자 정보를 등록합니다.

#### Payload

```json
{
  "type": "JOIN",
  "content": "",
  "roomId": 1,
  "userId": 5
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | `string` | `"JOIN"` 고정 |
| `content` | `string` | 빈 문자열 |
| `roomId` | `number` | 입장할 논의방 ID |
| `userId` | `number` | 현재 사용자 ID |

#### 수신 토픽 (구독)

```
/topic/room.{roomId}
```

입장 시 입장 알림 메시지가 구독 토픽으로 브로드캐스트됩니다.

---

### 7-2. 채팅 메시지 전송

**STOMP SEND** `/app/chat.sendMessage`

#### Payload

```json
{
  "type": "CHAT",
  "content": "안녕하세요!",
  "roomId": 1,
  "userId": 5
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `type` | `string` | ✅ | `"CHAT"` 고정 |
| `content` | `string` | ✅ | 메시지 내용 (빈 문자열 불가) |
| `roomId` | `number` | ✅ | 전송할 논의방 ID |
| `userId` | `number` | ✅ | 발신자 사용자 ID |

#### 수신 토픽 (구독)

```
/topic/room.{roomId}
```

메시지 전송 후 해당 방의 모든 구독자에게 브로드캐스트됩니다.

---

### 7-3. 채팅 흐름 요약

```
1. WebSocket 연결: ws://localhost:8080/gyeonggi_partners-chat

2. 채팅방 구독: SUBSCRIBE /topic/room.{roomId}

3. 입장 알림 전송: SEND /app/chat.addUser
   Payload: { type: "JOIN", content: "", roomId: 1, userId: 5 }

4. 메시지 전송: SEND /app/chat.sendMessage
   Payload: { type: "CHAT", content: "안녕하세요!", roomId: 1, userId: 5 }

5. 메시지 수신: /topic/room.{roomId} 토픽에서 브로드캐스트 수신
```

---

## 8. Enum 정의

### AccessLevel (논의방 접근 범위)

| 값 | 설명 |
|----|------|
| `PUBLIC` | 모든 사용자 입장 가능 |
| `OFFICIALS_ONLY` | 정부 관계자(`OFFICIAL` 역할)만 입장 가능 |
| `USER_ONLY` | 일반 시민(`USER` 역할)만 입장 가능 |

### SubmitStatus (제안서 상태)

| 값 | 설명 |
|----|------|
| `SUBMITTABLE` | 제출 가능 상태 (편집 가능, 투표 전) |
| `UNSUBMITTABLE` | 제출 불가 상태 |
| `VOTING` | 투표 진행 중 |

### MessageType (메시지 유형)

| 값 | 설명 |
|----|------|
| `CHAT` | 일반 채팅 메시지 |
| `JOIN` | 사용자 입장 알림 |
| `LEAVE` | 사용자 퇴장 알림 |

### Role (사용자 역할)

| 값 | 설명 |
|----|------|
| `USER` | 일반 시민 (기본값) |
| `OFFICIAL` | 경기도 정부 관계자 |
| `ADMIN` | 시스템 관리자 |
