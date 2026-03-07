# User & Auth API 명세 (Refactored)

이 문서는 기존 API 구조를 유지하면서 리팩토링된 UI 요구사항(프로필 이미지, 공무원 인증 등)을 반영한 User 도메인 명세입니다.

---

## 공통 규격
본 API는 [공통 Schema](../../common/Schema.md)의 `ApiResponse<T>` 및 `PageInfo` 규격을 따릅니다.

---

## 1. 인증 관련 API (AuthController)

### 1.1 로그인
- **Endpoint**: `POST /api/auth/login`
- **Request Body**: `SignInRequest`
- **Response Data**: `SignInResponse`
- **비고**: 액세스 토큰(1시간) 및 리프레시 토큰(7일) 발급

### 1.2 로그아웃
- **Endpoint**: `POST /api/auth/logout`
- **인증**: Bearer 토큰 필요
- **Response Data**: `null`

### 1.3 토큰 갱신
- **Endpoint**: `POST /api/auth/refresh`
- **Request Body**: `RefreshTokenRequest`
- **Response Data**: `TokenDto`

---

## 2. 사용자 관련 API (UserController)

### 2.1 회원가입
- **Endpoint**: `POST /api/users/signup`
- **Request Body**: `SignUpRequest`
- **Response Data**: `SignUpResponse`

### 2.2 이메일 인증 (회원가입용)
- **Endpoint**: `POST /api/users/email/send`
- **Request Body**: `{ "email": "String" }`
- **Response Data**: `null`

### 2.3 이메일 인증 확인 (회원가입용)
- **Endpoint**: `POST /api/users/email/verify`
- **Request Body**: `{ "email": "String", "code": "String" }`
- **Response Data**: `null`

### 2.4 회원정보 수정 [NEW]
- **Endpoint**: `PATCH /api/users/profile`
- **인증**: Bearer 토큰 필요
- **Request Body**: 
  ```json
  {
    "nickname": "string (optional)",
    "currentPassword": "string (optional - 비밀번호 변경 시 필수)",
    "newPassword": "string (optional)",
    "profileImageUrl": "string (optional)"
  }
  ```
- **Response Data**: `SignUpResponse` (최신 정보 반환)

### 2.5 공무원 인증 메일 발송 [NEW]
- **Endpoint**: `POST /api/users/official/send`
- **인증**: Bearer 토큰 필요
- **Description**: `@go.kr` 등 기관 이메일로 인증 코드를 발송합니다.
- **Request Body**: `{ "officialEmail": "String" }`
- **Response Data**: `null`

### 2.6 공무원 인증 확인 [NEW]
- **Endpoint**: `POST /api/users/official/verify`
- **인증**: Bearer 토큰 필요
- **Description**: 발송된 코드를 확인하여 사용자 역할을 `OFFICIAL`로 격상시키거나 인증 처리를 완료합니다.
- **Request Body**: `{ "officialEmail": "String", "code": "String" }`
- **Response Data**: 
  ```json
  {
    "userId": "Long",
    "role": "OFFICIAL",
    "certifiedAt": "ISO8601 String"
  }
  ```

---

## 3. 상세 DTO 명세

### SignInResponse (로그인 성공 시)
```json
{
  "userId": 1,
  "nickname": "김시민",
  "email": "user@example.com",
  "role": "USER",              // [UserRole](../../common/Schema.md)
  "profileImageUrl": "https://...",
  "grantType": "Bearer",
  "accessToken": "...",
  "refreshToken": "..."
}
```

### SignUpRequest (회원가입)
- 기존 스펙 유지 (loginId, password, name, nickname, email, phoneNumber)
- **추가**: 회원가입 시 프로필 이미지를 넣을 수 있도록 `profileImageUrl` (Optional) 추가 가능

### UpdateProfileRequest (회원정보 수정)
| 필드 | 제약 조건 | 설명 |
|------|-----------|------|
| `nickname` | 2-15자 | 수정할 닉네임 |
| `currentPassword` | - | 비밀번호 변경 요청 시 본인 확인용 |
| `newPassword` | 8자 이상, 복합 | 변경할 새 비밀번호 |
| `profileImageUrl` | URL 형식 | 사전에 업로드된 이미지의 URL |
