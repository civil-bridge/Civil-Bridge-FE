# Discussion Room API 명세 (Refactored)

이 문서는 논의방(Discussion Room) 도메인에 관한 API 명세입니다.

---

## 공통 규격
본 API는 [공통 Schema](../../common/Schema.md)의 `ApiResponse<T>` 및 `PageInfo` 규격을 따릅니다.

---

## 1. 논의방 관리 API (DiscussionRoomController)

### 1.1 논의방 생성
- **Endpoint**: `POST /api/discussion-rooms/create`
- **Request Body**: `CreateDiscussionRoomReq`
- **Response Data**: `JoinRoomRes`

### 1.2 전체 논의방 목록 조회
- **Endpoint**: `GET /api/discussion-rooms/retrieveTotal`
- **Query Params**: `page` (기본 1), `size` (기본 15)
- **Response Data**: `DiscussionRoomListRes`

### 1.3 내가 참여한 논의방 목록 조회
- **Endpoint**: `GET /api/discussion-rooms/retrieveMyJoined`
- **Query Params**: `page` (기본 1), `size` (기본 15)
- **Response Data**: `DiscussionRoomListRes`

### 1.4 논의방 상세 정보 및 입장
- **Endpoint**: `POST /api/discussion-rooms/{roomId}/join`
- **Response Data**: `JoinRoomRes`

### 1.5 논의방 나가기
- **Endpoint**: `DELETE /api/discussion-rooms/{roomId}/leave`
- **Response Data**: `null`

### 1.6 논의방 삭제 [NEW]
- **Endpoint**: `DELETE /api/discussion-rooms/{roomId}`
- **인증**: 방장(Leader) 권한 필수
- **Response Data**: `null`

### 1.7 참여자 강퇴 [NEW]
- **Endpoint**: `DELETE /api/discussion-rooms/{roomId}/kick/{userId}`
- **인증**: 방장(Leader) 권한 필수
- **Response Data**: `null`

---

## 2. 상세 DTO 명세

### CreateDiscussionRoomReq
```json
{
  "title": "String",           // 필수, 최대 50자
  "description": "String",     // 필수, 최대 200자
  "city": "String",            // 필수 (예: "경기도")
  "district": "String",        // 필수 (예: "부천시")
  "accessLevel": "String"      // 필수, AccessLevel Enum
}
```

### JoinRoomRes (방 상세 및 참여자 정보)
```json
{
  "roomId": 1,
  "title": "부천역 소음 문제 해결",
  "description": "...",
  "city": "경기도",
  "district": "부천시",
  "accessLevel": "PUBLIC",
  "currentUsers": 12,
  "members": [
    {
      "userId": 1,
      "nickname": "김시민",
      "role": "LEADER",
      "profileImageUrl": "https://..."
    },
    {
      "userId": 2,
      "nickname": "홍길동",
      "role": "USER",
      "profileImageUrl": null
    }
  ],
  "joinedAt": "2025-11-08T14:30:00"
}
```

---

## 3. 필드 상세 스펙 및 Enum
지역 선택 및 접근 권한에 대한 상세 정의는 [공통 Schema](../../common/Schema.md)를 참조하십시오.
- **지역(Region)**: `city` 및 `district` 2단계 구조
- **권한(AccessLevel)**: `PUBLIC`, `OFFICIALS_ONLY`, `USER_ONLY`

### DiscussionRoomListRes (목록 조회 응답) [Updated]
```json
{
  "rooms": [
    {
      "roomId": 1,
      "title": "부천역 소음 문제 해결",
      "description": "밤늦은 시간 환기구 소음 문제에 대한 해결 방안 논의",
      "city": "경기도",
      "district": "부천시",
      "accessLevel": "PUBLIC",
      "currentUsers": 12,
      "createdAt": "2025-11-08T10:00:00"
    }
  ],
  "currentPage": 1,
  "pageSize": 15,
  "totalCount": 1,
  "totalPages": 1
}
```

