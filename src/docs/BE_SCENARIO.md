### 1. 이메일 인증번호 발송

#### 정상 플로우

**`/api` 계층 — `UserController`**
- `POST /api/users/email/send` 요청을 받아 `@RequestBody EmailVerificationRequest`로 바인딩
- `EmailVerificationRequest`는 `email` 필드 하나만 가지며, **Bean Validation 어노테이션 없음** → 형식 검증 없이 그대로 통과
- `request.getEmail()`로 이메일 문자열만 꺼내서 `UserService.sendEmailVerification(email)` 호출

**`/application` 계층 — `UserService`**
- `sendEmailVerification(String email)` 함수는 단순 위임자 역할만 수행
- `EmailVerificationService.sendVerificationCode(email)` 호출

**`/application` 계층 — `EmailVerificationService`**
- `sendVerificationCode(String email)` 에서 실제 처리 수행
  1. `SecureRandom.nextInt(900000) + 100000` 으로 100000~999999 범위의 6자리 인증번호 생성
  2. Redis에 Key: `email:verification:{email}`, Value: 인증번호, TTL: 5분으로 저장 (`StringRedisTemplate.opsForValue().set(...)`)
  3. `EmailNotifier.sendVerificationCode(email, code)` 호출 (도메인이 인프라에 직접 의존하지 않도록 인터페이스 통해 위임)

**`/infra` 계층 — `SmtpEmailNotifier`**
- `EmailNotifier` 인터페이스의 구현체로, Spring Mail을 사용해 실제 SMTP 발송 처리

---

#### 예외 플로우

없음. DTO 검증도 없고, 이미 발송된 이메일이어도 덮어쓰기로 처리하므로 별도 예외 없음.

---

#### DB 관련 작업

Redis만 사용. DB 접근 없음.

---

#### 구조 채택 이유 / 한계

- `EmailNotifier` 인터페이스를 `/domain/notifier/` 아래에 두고 인프라 구현체(`SmtpEmailNotifier`)를 `/infra/notification/`에 둔 이유: 도메인 계층이 SMTP라는 인프라 기술에 직접 의존하지 않도록 하기 위함. 메일 발송 방식을 바꿔도 인터페이스 구현체만 교체하면 됨.
- **한계**: `EmailVerificationService`가 `StringRedisTemplate`을 직접 의존 → Redis라는 인프라 기술에 애플리케이션 계층이 강결합됨. 엄밀한 Clean Architecture라면 Redis도 인터페이스로 추상화해야 하나, 오버엔지니어링 우려로 타협한 구조.

---

### 2. 이메일 인증번호 검증

#### 정상 플로우

**`/api` 계층 — `UserController`**
- `POST /api/users/email/verify` 요청을 받아 `@RequestBody VerifyEmailRequest`로 바인딩
- `VerifyEmailRequest`는 `email`, `code` 필드를 가지며, **Bean Validation 어노테이션 없음**
- `userService.verifyEmail(request.getEmail(), request.getCode())` 호출

**`/application` 계층 — `UserService`**
- `verifyEmail(String email, String code)` 도 단순 위임
- `EmailVerificationService.verifyCode(email, code)` 호출

**`/application` 계층 — `EmailVerificationService`**
- `verifyCode(String email, String code)` 에서 처리
  1. Redis에서 Key `email:verification:{email}` 로 저장된 인증번호 조회
  2. `null`이면 만료된 것, 불일치하면 틀린 것 → 두 경우 모두 `BusinessException(INVALID_VERIFICATION_CODE)` 발생
  3. 검증 성공 시 `redisTemplate.delete(key)` 로 해당 키 즉시 삭제 (1회성 인증 보장)

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 인증번호 만료(TTL 5분 초과) | `C001 INVALID_VERIFICATION_CODE` | 400 |
| 인증번호 불일치 | `C001 INVALID_VERIFICATION_CODE` | 400 |

만료와 불일치를 동일한 에러코드로 처리함 → 굳이 구분할 필요가 없다고 생각했음. (추후 분리)

---

#### DB 관련 작업

Redis만 사용. 인증번호는 일회성 데이터라 DB에 저장할 이유 없음.

---

#### 구조 채택 이유 / 한계

- 인증 성공 후 키를 즉시 삭제하는 방식으로 인증번호 재사용을 방지.

---

### 3. 회원가입

#### 정상 플로우

**`/api` 계층 — `UserController`**
- `POST /api/users/signup` 요청을 받아 `@RequestBody SignUpRequest`로 바인딩
- **`@Valid` 어노테이션 없음** → `SignUpRequest`에 선언된 `@NotBlank`, `@Pattern`, `@Size` 등의 Bean Validation이 **실제로 동작하지 않음** (OpenAPI 문서화 목적으로만 존재)
- `userService.signUp(request)` 호출

**`/api/dto` 계층 — `SignUpRequest`**
- 필드: `loginId`, `password`, `name`, `nickname`, `email`, `phoneNumber`
- `@Pattern`, `@Size`, `@NotBlank`, `@Email` 어노테이션이 선언돼 있으나 컨트롤러에서 `@Valid`가 없으므로 실제 검증은 수행되지 않음

**`/application` 계층 — `UserService.signUp(SignUpRequest req)`**

1. **중복 검증 (4회)**: `loginId`, `email`, `phoneNumber`, `nickname` 각각에 대해 `userRepository.existsBy*(...)` 호출 → 중복이면 `BusinessException` 발생
2. **평문 비밀번호 검증**: `validatePlainPassword()`로 null 체크, 8자 이상, 50자 이하 검증 (서비스 계층에서 직접 처리)
3. **비밀번호 암호화**: `PasswordEncoder.encode(req.getPassword())` → BCrypt 해시
4. **도메인 생성**: `User.create(loginId, encodedPassword, name, nickname, email, phoneNumber)` 호출 → 도메인 모델 내부 validate 메서드들 실행
5. **저장**: `userRepository.save(user)` 호출
6. **응답**: `SignUpResponse(id, nickname, email, role)` 반환

**`/domain` 계층 — `User.create()`**
- 팩토리 메서드로 호출됨. 내부에서 필드별 정적 validate 메서드 실행:
  - `validateLoginId()`: null/빈값, 30자 초과 여부
  - `validatePassword()`: null/빈값 (암호화된 값이 들어오므로 길이 검증 없음)
  - `validateName()`: null/빈값, 50자 초과 여부
  - `validateNickname()`: null/빈값, 50자 초과 여부
  - `validateEmail()`: null/빈값, 50자 초과, 이메일 패턴(`EMAIL_PATTERN`) 검증
  - `validatePhoneNumber()`: null/빈값, 20자 초과, 전화번호 패턴(`010-XXXX-XXXX`) 검증
- 검증 통과 시 role="USER"로 고정된 새 `User` 인스턴스 반환

**`/infra` 계층 — `UserRepositoryImpl.save()`**
- `UserEntity.fromDomain(user)` 로 도메인 모델 → JPA 엔티티 변환
- `UserJpaRepository.save(entity)` 호출 → JPA가 `INSERT` SQL 실행
- 저장된 엔티티의 `entity.toDomain()` 호출 → JPA 엔티티 → 도메인 모델 변환 후 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 로그인 ID 중복 | `U001 DUPLICATE_LOGIN_ID` | 409 |
| 이메일 중복 | `U002 DUPLICATE_EMAIL` | 409 |
| 전화번호 중복 | `U003 DUPLICATE_PHONE_NUMBER` | 409 |
| 닉네임 중복 | `U004 DUPLICATE_USER_NICKNAME` | 409 |
| 비밀번호 형식 오류(서비스/도메인 레벨) | `IllegalArgumentException` → 별도 에러 핸들러 처리 | 400 |

예외는 모두 `throw new BusinessException(UserErrorCode.*)` 형태로 던지며, 공통 예외 핸들러(`GlobalExceptionHandler`)가 잡아서 `{ status, code, message }` 형태의 에러 응답으로 변환.

---

#### DB 관련 작업

**중복 검증 4회** (`UserJpaRepository`의 Spring Data JPA 메서드명 기반 쿼리):

```
existsByLoginId(loginId)
→ SELECT count(*) > 0 FROM users WHERE login_id = ?

existsByEmail(email)
→ SELECT count(*) > 0 FROM users WHERE email = ?

existsByPhoneNumber(phoneNumber)
→ SELECT count(*) > 0 FROM users WHERE phone_number = ?

existsByNickname(nickname)
→ SELECT count(*) > 0 FROM users WHERE nickname = ?
```

**저장** (`JpaRepository.save()`):

```
→ INSERT INTO users (login_id, login_pw, name, nickname, email, phone_number, role, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, 'USER', now(), now())
```

---

#### 구조 채택 이유 / 한계

- **이중 검증 구조** (서비스 + 도메인): 서비스 계층은 외부 제약(DB 중복, 비밀번호 평문 검증)을 담당하고, 도메인 계층(`User.create()`)은 비즈니스 규칙(형식, 길이)을 담당함. 어디서 User를 생성하든 도메인 규칙은 항상 보장됨.
- **Entity-Domain 분리**: JPA 엔티티(`UserEntity`)는 인프라 계층에만 존재. `fromDomain()` / `toDomain()`으로 변환. 덕분에 JPA 어노테이션, 영속성 컨텍스트 개념이 도메인 모델을 오염시키지 않음.
- **한계 1**: 컨트롤러에 `@Valid`가 빠져있어 DTO의 Bean Validation이 실제로 동작하지 않음. 현재는 도메인/서비스 레벨 검증에만 의존 중.
- **한계 2**: 중복 검증을 4번의 개별 쿼리로 처리 → 트래픽이 많으면 4번의 SELECT가 발생. 단일 쿼리로 통합하거나 DB unique constraint 위반을 잡는 방식으로 줄일 수 있으나 현재는 가독성을 우선한 구조.

---

### 4. 로그인

#### 정상 플로우

**`/api` 계층 — `AuthController`**
- `POST /api/auth/login` 요청을 받아 `@Valid @RequestBody SignInRequest`로 바인딩
- `@Valid` 있음 → `SignInRequest`의 `@NotBlank` 동작 → `loginId`, `password` 중 빈값이면 여기서 400 반환
- `authService.login(request)` 호출

**`/api/dto` 계층 — `SignInRequest`**
- `loginId`, `password` 필드에 `@NotBlank` 선언
- 형식 검증 없음 (ID/PW 형식 오류도 로그인 실패로 통합 처리)

**`/application` 계층 — `AuthService.login(SignInRequest request)`**

1. `UsernamePasswordAuthenticationToken(loginId, password)` 생성 → 아직 인증되지 않은 자격증명 운반체 (`authenticated=false`)
2. `AuthenticationManager.authenticate(authToken)` 호출 → Spring Security 인증 파이프라인 진입
   - 내부적으로 `CustomUserDetailsService.loadUserByUsername(loginId)` 실행 → DB 조회
   - `PasswordEncoder.matches(rawPassword, encodedPassword)` 로 비밀번호 비교
   - 성공 시 `authenticated=true`인 `Authentication` 반환
   - 실패 시 `BadCredentialsException` / `UsernameNotFoundException` / `InternalAuthenticationServiceException` 발생
3. `JwtTokenProvider.generateTokenDto(authentication)` 으로 Access Token(1시간) + Refresh Token(7일) 생성
4. `authentication.getPrincipal()` 로 `CustomUserDetails` 추출
5. Redis에 Refresh Token 저장: Key `RT:{userId}`, Value: Refresh Token 문자열, TTL 7일
6. `SignInResponse(userId, nickname, email, role, grantType, accessToken, refreshToken)` 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| loginId/password 빈값 | (Bean Validation, `MethodArgumentNotValidException`) | 400 |
| 존재하지 않는 아이디 | `A001 LOGIN_FAILED` | 401 |
| 비밀번호 불일치 | `A001 LOGIN_FAILED` | 401 |

Spring Security의 `BadCredentialsException`, `UsernameNotFoundException`, `InternalAuthenticationServiceException`을 catch해서 모두 `BusinessException(LOGIN_FAILED)`으로 변환 → 실패 원인(아이디 없음 vs 비밀번호 틀림)을 클라이언트에 노출하지 않음.

---

#### DB 관련 작업

Spring Security 파이프라인 내부에서 `CustomUserDetailsService`가 호출하는 쿼리:

```
findByLoginId(loginId)
→ SELECT * FROM users WHERE login_id = ?
```

---

#### 구조 채택 이유 / 한계

- Spring Security의 `AuthenticationManager`에 인증을 위임함으로써 인증 로직을 직접 구현하지 않고, Spring Security의 보안 검증(타이밍 공격 방어 등)을 재사용.
- 실패 이유를 단일 에러코드(`LOGIN_FAILED`)로 통합하여 열거형 공격(enumeration attack) 방지.
- **한계**: Refresh Token을 Redis에만 저장하고 Access Token은 서버가 따로 관리하지 않음 → 로그아웃 후에도 Access Token 만료(1시간)까지는 해당 토큰으로 API 호출이 가능. (아래 로그아웃 시나리오 참고)

---

### 5. 로그아웃

#### 정상 플로우

**`/api` 계층 — `AuthController`**
- `POST /api/auth/logout` 요청을 받음
- `@AuthenticationPrincipal CustomUserDetails userDetails` → `JwtAuthenticationFilter`가 Access Token을 파싱해 인증 정보를 `SecurityContext`에 저장해둔 것을 꺼내 주입. 클라이언트가 userId를 직접 보내는 게 아님.
- `authService.logoutByUserId(userDetails.getUserId())` 호출

**`/application` 계층 — `AuthService.logoutByUserId(Long userId)`**
- Redis에서 Key `RT:{userId}` 삭제 (`redisTemplate.delete(key)`)
- Refresh Token이 삭제되므로 이후 Access Token 만료 시 재발급 불가 → 사실상 세션 종료

---

#### 예외 플로우

없음. 이미 로그아웃된 상태(Redis에 키 없음)여도 `delete()`는 예외 없이 실행됨.

단, Access Token 없이 요청하면 `JwtAuthenticationFilter`에서 인증 실패 → `A002 INVALID_TOKEN` (401) 반환.

---

#### DB 관련 작업

없음. Redis 키 삭제만 수행.

```
Redis DEL RT:{userId}
```

---

#### 구조 채택 이유 / 한계

- Refresh Token만 삭제하는 단순한 구조로 서버 부하 없이 로그아웃 처리.
- **한계**: Access Token 자체는 서버가 무효화하지 않음. 로그아웃 후에도 기존 Access Token(최대 1시간)으로 API 호출이 가능한 상태가 지속됨. 완전한 즉시 무효화가 필요하면 Redis 블랙리스트에 Access Token을 등록하고 매 요청마다 조회해야 함. CivilBridge는 탈취 시 피해 규모가 크지 않다고 판단해 현재 구조로 타협.

---

### 6. 논의방 생성하기

#### 정상 플로우

**`/api` 계층 — `DiscussionRoomController`**
- `POST /api/discussion-rooms/create` 요청을 받아 `@Valid @RequestBody CreateDiscussionRoomReq`로 바인딩
- `@Valid` 있음 → `@NotBlank`(title, city, district), `@NotNull`(accessLevel), `@Size` 동작. 빈값이면 400 반환
- `@AuthenticationPrincipal CustomUserDetails`로 현재 로그인 유저의 `userId` 추출 (토큰에서 주입, 클라이언트 전송 아님)
- `discussionRoomService.createRoom(request, userId)` 호출
- 성공 시 HTTP 201 반환

**`/api/dto` 계층 — `CreateDiscussionRoomReq`**
- 필드: `title`(@NotBlank, @Size max=100), `description`(@Size max=255, optional), `city`(@NotBlank), `district`(@NotBlank), `accessLevel`(@NotNull, `AccessLevel` ENUM: PUBLIC / OFFICIALS_ONLY / USER_ONLY)

**`/application` 계층 — `DiscussionRoomService.createRoom()`**

1. **도메인 생성**: `DiscussionRoom.create(title, description, city, district, accessLevel)` 호출 → 도메인 내부 validate 실행
2. **DB 저장**: `discussionRoomRepository.save(room)` → `INSERT INTO discussion_rooms ...` 실행, `id`가 채번된 `DiscussionRoom` 반환
3. **생성자 멤버 등록**: `Member.join(userId, savedRoom.getId())` 로 도메인 생성 후 `memberRepository.save(creatorMember)` → `INSERT INTO members ...`
4. **Redis Write-Through 캐싱**: `cacheRepository.saveNewRoomToRedis(model, userId, timestamp)` 호출
   - `MULTI/EXEC` 트랜잭션으로 원자적 처리:
     - `HSET room:{roomId} ...` — 방 상세 정보 Hash 저장 (TTL 24시간)
     - `ZADD list:latest {timestamp} {roomId}` — 전체 최신 목록 ZSet 업데이트 (TTL 1시간)
     - `ZADD user:{userId}:joined {timestamp} {roomId}` — 생성자의 참여방 ZSet 업데이트 (TTL 12시간)
     - `RPUSH room:{roomId}:members {userId}` — 방 멤버 List에 생성자 추가 (TTL 24시간)
   - 이후 `list:latest` 10,000건 초과 시 오래된 항목 제거, `user:joined` 100건 초과 시 오래된 항목 제거
5. **생성자 정보 조회**: `userRepository.findById(userId)` → 닉네임 등 조회해서 `MemberInfo` 구성
6. `JoinRoomRes.of(model, members)` 반환

**`/domain` 계층 — `DiscussionRoom.create()`**
- `validateTitle()`: null/빈값, 100자 초과 여부
- `validateDescription()`: null 허용, 255자 초과 여부만 검증
- `validateCity()`, `validateDistrict()`: null/blank 여부
- `validateAccessLevel()`: null 여부
- 검증 통과 시 새 `DiscussionRoom` 인스턴스 반환

**`/infra` 계층 — `DiscussionRoomCacheRepositoryImpl`**
- Redis 연산 실패 시 `catch` 블록에서 로그만 남기고 계속 진행 (Graceful Degradation)

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| title/city/district 빈값, accessLevel null | (`MethodArgumentNotValidException`) | 400 |
| 도메인 validate 실패 (길이 초과 등) | `IllegalArgumentException` → 공통 핸들러 처리 | 400 |
| 생성자 userId가 DB에 없음 (비정상) | `A003 USER_NOT_FOUND` | 404 |

---

#### DB 관련 작업

```
-- 논의방 저장
discussionRoomJpaRepository.save(entity)
→ INSERT INTO discussion_rooms (title, description, city, district, access_level, created_at)
  VALUES (?, ?, ?, ?, ?, now())

-- 생성자 멤버 등록
memberJpaRepository.save(entity)
→ INSERT INTO members (user_id, room_id, created_at)
  VALUES (?, ?, now())

-- 생성자 정보 조회
userJpaRepository.findById(userId)
→ SELECT * FROM users WHERE user_id = ?
```

---

#### 구조 채택 이유 / 한계

- **Write-Through 전략**: DB 저장 직후 Redis에도 즉시 쓰는 방식. 다음 조회 시 캐시 히트를 보장해 응답 속도를 높임.
- **MULTI/EXEC 트랜잭션**: 4개의 Redis 키(방 정보, 전체목록, 유저목록, 멤버목록)를 원자적으로 갱신해 부분 반영 상태 방지.
- **Graceful Degradation**: Redis 실패 시 로그만 남기고 DB 저장은 이미 완료된 상태이므로 클라이언트에게 성공 응답. 다음 조회 시 Cache-Aside로 자동 복구됨.
- **한계**: DB 트랜잭션과 Redis 쓰기가 별개 → DB commit 후 Redis 실패 시 일시적 불일치 발생 가능. 이후 조회 시 Cache-Aside로 자동 복구되므로 현재 구조로 타협.

---

### 7. 전체 논의방 조회

#### 정상 플로우

**`/api` 계층 — `DiscussionRoomController`**
- `GET /api/discussion-rooms/retrieveTotal?page=1&size=15` 요청
- `@RequestParam`으로 `page`(기본값 1), `size`(기본값 15) 수신
- 인증 불필요 (비로그인 허용 엔드포인트)
- `discussionRoomService.retrieveTotalRooms(page, size)` 호출

**`/application` 계층 — `DiscussionRoomService.retrieveTotalRooms()`**

1. **DB에서 페이징 조회**: `PageRequest.of(page-1, size)` 로 `Pageable` 생성 후 `discussionRoomRepository.findAllByOrderByCreatedAtDesc(pageable)` 호출
   - soft delete된 방 제외, 최신순 정렬
   - 결과가 없으면 빈 목록 즉시 반환
2. **방 ID 목록 추출** 및 **멤버 수 일괄 조회**: `memberRepository.countByRoomIds(roomIds)` → GROUP BY 쿼리 1회로 N+1 방지
3. **각 방에 대해 Cache-Aside**: `cacheRepository.retrieveCachingRoom(roomId)` 호출
   - Redis `HGETALL room:{roomId}` 조회 → 데이터 있으면 캐시 히트, 없으면 DB 조회 후 `HSET`으로 캐싱
4. `DiscussionRoomListRes.of(roomSummaries, page, size, totalElements)` 반환

**`/infra` 계층 — `DiscussionRoomCacheRepositoryImpl.retrieveCachingRoom()`**
- 캐시 히트: Redis Hash에서 꺼내 `DiscussionRoomCacheModel.fromRedisHash()` 로 변환
- 캐시 미스: DB 조회 → `memberRepository.countByRoomId()` 로 현재 인원 조회 → Redis `HSET` 캐싱 후 반환

---

#### 예외 플로우

없음. 결과가 없으면 빈 목록 반환.

---

#### DB 관련 작업

```
-- 전체 방 목록 페이징 조회 (JPQL)
findAllByDeletedAtIsNullOrderByCreatedAtDesc(pageable)
→ SELECT d FROM discussion_rooms d
  WHERE d.deleted_at IS NULL
  ORDER BY d.created_at DESC
  LIMIT ? OFFSET ?

-- 멤버 수 일괄 조회 (JPQL, N+1 방지)
countByRoomIds(roomIds)
→ SELECT m.room_id as roomId, COUNT(m) as count
  FROM members m
  WHERE m.room_id IN (?, ?, ...)
  GROUP BY m.room_id

-- 캐시 미스 시 개별 방 조회
findById(roomId)
→ SELECT * FROM discussion_rooms WHERE id = ?

-- 캐시 미스 시 방 인원 수 조회
countByRoomId(roomId)
→ SELECT COUNT(*) FROM members WHERE room_id = ?
```

---

#### 구조 채택 이유 / 한계

- **목록은 DB가 source of truth**: 목록 페이징은 Redis가 아닌 DB에서 직접 조회. Redis는 개별 방 상세 정보 캐싱에만 활용. 목록 순서/총 개수 불일치 방지.
- **N+1 방지**: 방 목록 조회 후 방별로 멤버 수를 개별 쿼리로 가져오지 않고, `IN` + `GROUP BY` 쿼리 1회로 일괄 처리.
- **Cache-Aside**: 각 방 상세는 Redis에서 먼저 찾고, 없으면 DB 조회 후 자동 캐싱 → 자주 조회되는 방은 Redis에 상주하게 됨.
- **한계**: 목록 자체(순서, 총 개수)는 매번 DB를 타므로 Redis 캐싱의 이점이 방 상세 조회에만 적용됨. 목록 조회가 병목이 되는 시점에는 Redis ZSet 기반 목록 캐싱으로 전환이 필요.

---

### 8. 논의방 나가기

#### 정상 플로우

**`/api` 계층 — `DiscussionRoomController`**
- `DELETE /api/discussion-rooms/{roomId}/leave` 요청
- `@PathVariable Long roomId` 로 방 ID 수신
- `@AuthenticationPrincipal`로 `userId` 추출
- `discussionRoomService.leaveRoom(userId, roomId)` 호출

**`/application` 계층 — `DiscussionRoomService.leaveRoom()`**

1. **비관적 락으로 방 조회**: `discussionRoomRepository.findByIdWithLock(roomId)` → `SELECT ... FOR UPDATE` 실행. 같은 방에 동시에 여러 퇴장 요청이 오는 경우 순차 처리 보장
2. **멤버 여부 확인**: `memberRepository.existsByUserIdAndRoomId(userId, roomId)` → 참여하지 않은 방이면 `BusinessException` 발생
3. **남은 인원 확인**: `memberRepository.countByRoomId(roomId)` → 퇴장 전 인원 수 파악 (마지막 사람 여부 판단용)
4. **Redis 퇴장 처리**: `cacheRepository.removeUserFromRoom(userId, roomId)` → `MULTI/EXEC` 트랜잭션:
   - `ZREM user:{userId}:joined {roomId}` — 유저의 참여 목록에서 제거
   - `LREM room:{roomId}:members 0 {userId}` — 방 멤버 목록에서 제거
   - `HINCRBY room:{roomId} currentUsers -1` — 방 인원 수 감소
5. **DB 멤버 삭제**: `memberRepository.deleteByUserIdAndRoomId(userId, roomId)` → `DELETE FROM members WHERE ...`
6. **마지막 멤버인 경우** (퇴장 전 인원이 1명):
   - `discussionRoomRepository.softDelete(roomId)` → `UPDATE discussion_rooms SET deleted_at = now() WHERE id = ?`
   - `cacheRepository.evictRoomCache(roomId, userId)` → `MULTI/EXEC`:
     - `DEL room:{roomId}` — 방 정보 삭제
     - `DEL room:{roomId}:members` — 멤버 목록 삭제
     - `ZREM list:latest {roomId}` — 전체 목록에서 제거
     - `ZREM user:{userId}:joined {roomId}` — 유저 참여 목록에서 제거

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 존재하지 않는 방 | `R001 ROOM_NOT_FOUND` | 404 |
| 해당 방의 멤버가 아님 | `R006 NOT_A_ROOM_MEMBER` | 403 |

---

#### DB 관련 작업

```
-- 비관적 락으로 방 조회 (JPQL + @Lock)
findByIdWithLock(roomId)
→ SELECT * FROM discussion_rooms
  WHERE id = ? AND deleted_at IS NULL
  FOR UPDATE

-- 멤버 존재 여부 확인
existsByUserIdAndRoomId(userId, roomId)
→ SELECT count(*) > 0 FROM members
  WHERE user_id = ? AND room_id = ?

-- 남은 인원 수 조회
countByRoomId(roomId)
→ SELECT COUNT(*) FROM members WHERE room_id = ?

-- 멤버 삭제
deleteByUserIdAndRoomId(userId, roomId)
→ DELETE FROM members WHERE user_id = ? AND room_id = ?

-- 방 Soft Delete (마지막 멤버 퇴장 시, JPQL @Modifying)
softDelete(roomId)
→ UPDATE discussion_rooms SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
```

---

#### 구조 채택 이유 / 한계

- **비관적 락(Pessimistic Lock)**: 동시에 여러 사람이 퇴장할 때 인원 수 판단 오류 방지. 예를 들어 2명이 동시에 나가면서 둘 다 "마지막 사람"으로 오판하여 방이 이중 삭제될 수 있는 문제를 차단. `SELECT FOR UPDATE`로 해당 행을 잠가 순차 처리 보장.
- **Soft Delete**: 물리적으로 데이터를 삭제하지 않고 `deleted_at`만 기록. 추후 범죄 수사 등 법적 대응 시 데이터 보존 가능.
- **한계**: Redis 퇴장 처리(4번)와 DB 삭제(5번)가 별개 → Redis 성공 후 DB 실패 시 불일치 발생 가능. 반대의 경우(DB 삭제 후 Redis 실패)도 마찬가지. 분산 트랜잭션이 없는 구조의 고유한 한계.

---

### 9. 내가 참여한 논의방 조회하기

---

## 제안서 시나리오

> 제안서 상태 흐름: `UNSUBMITTABLE`(편집 중) → `VOTING`(투표 중) → `COMPLETED`(가결) / `REJECTED`(부결)

### 10. 제안서 생성

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `POST /api/proposals` 요청을 받아 `@Valid @RequestBody CreateProposalRequest`로 바인딩
- `@Valid` 있음 → `@NotNull`(roomId) 동작
- `@AuthenticationPrincipal`로 `userId` 추출
- `proposalService.createProposal(request, userId)` 호출

**`/api/dto` 계층 — `CreateProposalRequest`**
- 필드: `roomId`(@NotNull) 하나뿐. 내용은 이후 수정 API에서 채움

**`/application` 계층 — `ProposalService.createProposal()`**

1. **멤버 검증**: `memberRepository.existsByUserIdAndRoomId(userId, roomId)` → 해당 논의방 멤버가 아니면 예외
2. **방당 제안서 수 제한**: `proposalRepository.countByRoomId(roomId)` → 5개 이상이면 예외
3. **빈 제안서 생성**: `Proposal.createBlank(roomId, userId)` → title=null, contents=null, status=`UNSUBMITTABLE`으로 생성
4. **DB 저장**: `proposalRepository.save(proposal)` → `INSERT INTO proposals ...`
5. **편집 락 자동 획득**: `lockService.tryLock(savedId, userId)` → Redis `SETNX proposal:lock:{proposalId} {userId}` (TTL 10분)
   - 생성 직후 바로 편집 가능하도록 락을 자동으로 잡아줌
6. `ProposalResponse.from(saved)` 반환

**`/application` 계층 — `ProposalLockService.tryLock()`**
- `redisTemplate.opsForValue().setIfAbsent(key, value, TTL)` → Redis `SET proposal:lock:{proposalId} {userId} NX EX 600`
- 이미 다른 사용자가 락을 보유 중이면 `false` 반환
- 자신이 이미 보유 중이면 TTL만 갱신 후 `true` 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| roomId null | (`MethodArgumentNotValidException`) | 400 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |
| 방당 제안서 5개 초과 | `P016 PROPOSAL_LIMIT_EXCEEDED` | 400 |

---

#### DB 관련 작업

```
-- 멤버 여부 확인
existsByUserIdAndRoomId(userId, roomId)
→ SELECT count(*) > 0 FROM members WHERE user_id = ? AND room_id = ?

-- 방당 제안서 수 조회
countByRoomId(roomId)
→ SELECT COUNT(*) FROM proposals WHERE room_id = ?

-- 빈 제안서 저장
proposalJpaRepository.save(entity)
→ INSERT INTO proposals (room_id, author_id, title, contents, status, required_consents, created_at)
  VALUES (?, ?, null, null, 'UNSUBMITTABLE', 10, now())
```

---

#### 구조 채택 이유 / 한계

- **빈 제안서 선생성 방식**: 제안서를 생성하자마자 편집 락을 자동 부여해 다른 사람이 즉시 개입하지 못하게 함. 내용은 이후 수정 API에서 점진적으로 채움(auto-save 방식).
- **Redis 분산 락으로 단일 편집자 보장**: DB 트랜잭션이 아닌 Redis `SETNX`로 "현재 편집 중인 사람이 누구인지"를 관리. DB 락보다 가볍고 TTL로 자동 해제 가능.
- **한계**: 락 TTL이 10분이므로 사용자가 편집 중 연결이 끊기면 최대 10분간 다른 사람이 편집 불가. `renewLock()`으로 수정 시마다 TTL을 초기화해 활성 편집 중에는 만료되지 않도록 보완.

---

### 11. 제안서 편집 시작 (락 획득)

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `POST /api/proposals/{proposalId}/start-editing` 요청
- `@PathVariable Long proposalId`, `@AuthenticationPrincipal`로 `userId` 추출
- `proposalService.startEditing(proposalId, userId)` 호출

**`/application` 계층 — `ProposalService.startEditing()`**

1. **제안서 조회**: `proposalRepository.findById(proposalId)` → 없으면 예외
2. **멤버 검증**: `memberRepository.existsByUserIdAndRoomId(userId, proposal.getRoomId())`
3. **투표 중 여부 확인**: status == `VOTING`이면 편집 불가 → 예외
4. **락 획득 시도**: `lockService.tryLock(proposalId, userId)`
   - 성공: Redis에 `proposal:lock:{proposalId}` 키 생성, TTL 10분
   - 실패(타인이 이미 락 보유): `false` 반환 → 예외

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 존재하지 않는 제안서 | `P001 PROPOSAL_NOT_FOUND` | 404 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |
| 투표 진행 중 (수정 불가) | `P004 PROPOSAL_LOCKED` | 409 |
| 다른 사용자가 편집 중 | `P002 PROPOSAL_BEING_EDITED` | 409 |

---

#### DB 관련 작업

```
-- 제안서 조회
findById(proposalId)
→ SELECT * FROM proposals WHERE proposal_id = ?

-- 멤버 여부 확인
existsByUserIdAndRoomId(userId, roomId)
→ SELECT count(*) > 0 FROM members WHERE user_id = ? AND room_id = ?
```

Redis: `SET proposal:lock:{proposalId} {userId} NX EX 600`

---

#### 구조 채택 이유 / 한계

- **한계**: 락 상태가 Redis에만 존재하므로 Redis 장애 시 락이 사라짐 → 동시 편집 허용 가능성. 현재는 Redis 고가용성 보장 전제로 타협.

---

### 12. 제안서 수정 (auto-save)

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `PUT /api/proposals/{proposalId}` 요청을 받아 `@Valid @RequestBody UpdateProposalRequest`로 바인딩
- `UpdateProposalRequest`에 `@Valid` 있으나 필드에 Bean Validation 어노테이션 없음 → 실질 검증 없음
- `proposalService.updateProposal(proposalId, request, userId)` 호출

**`/api/dto` 계층 — `UpdateProposalRequest`**
- 필드: `title`, `paragraph`, `image`, `solution`, `expectedEffect` 전부 optional (null 허용, auto-save 용도)

**`/application` 계층 — `ProposalService.updateProposal()`**

1. **제안서 조회** → 멤버 검증 → VOTING 상태 거부
2. **락 소유자 확인**: `lockService.getLockOwner(proposalId)` → Redis `GET proposal:lock:{proposalId}`
   - 락이 없으면(null) `LOCK_NOT_ACQUIRED` 예외 → `start-editing` 먼저 호출 필요
   - 자신이 아닌 다른 사람이 락을 보유 중이면 `PROPOSAL_BEING_EDITED` 예외
3. **내용 구성**: `ContentFormat.ofNullable(paragraph, image, solution, expectedEffect)` → paragraph null 허용 (미완성 내용도 저장 가능)
4. **DB 직접 업데이트** (native query): `proposalRepository.updateContent(proposalId, title, contents)`
   - `@Version` 체크 없이 직접 UPDATE → JPA 낙관적 락 우회
   - `@Modifying(clearAutomatically = true)` → 이후 `findById` 시 JPA 캐시 무효화, DB에서 최신값 읽음
5. **락 TTL 갱신**: `lockService.renewLock(proposalId, userId)` → Redis `EXPIRE proposal:lock:{proposalId} 600`
6. `proposalRepository.findById(proposalId)` 재조회 후 `ProposalResponse` 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 존재하지 않는 제안서 | `P001 PROPOSAL_NOT_FOUND` | 404 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |
| 투표 진행 중 (수정 불가) | `P004 PROPOSAL_LOCKED` | 409 |
| 편집 락 미보유 (start-editing 없이 호출) | `P010 LOCK_NOT_ACQUIRED` | 409 |
| 다른 사용자가 락 보유 중 | `P002 PROPOSAL_BEING_EDITED` | 409 |

---

#### DB 관련 작업

```
-- @Version 우회 native query 직접 UPDATE
updateContent(proposalId, title, contentsJson, updatedAt)
→ UPDATE proposals
  SET title = ?, contents = ?, updated_at = ?
  WHERE proposal_id = ?
```

- `ContentFormat`은 `ObjectMapper.writeValueAsString()`으로 JSON 직렬화 후 `contents` 컬럼에 저장
- 예시: `{"paragraph":"...", "image":"...", "solution":"...", "expectedEffect":"..."}`

---

#### 구조 채택 이유 / 한계

- **`@Version` 낙관적 락 우회 이유**: `PUT`(수정) 직후 `POST /start-voting`(투표 시작)을 연속 호출하면 두 쿼리가 같은 `version` 값을 읽어 낙관적 락 충돌(`OptimisticLockingFailureException`) 발생. Redis 분산 락이 이미 단일 편집자를 보장하므로 native query 직접 UPDATE로 우회.
- **auto-save 방식**: 클라이언트가 내용을 타이핑할 때마다 또는 일정 주기로 저장 요청을 보낼 수 있음. paragraph가 null이어도 저장 가능하도록 `ofNullable()` 사용.
- **한계**: native query이므로 JPA 영속성 컨텍스트가 모름 → `clearAutomatically = true`로 1차 캐시 무효화해 이후 조회 시 DB에서 직접 읽도록 강제.

---

### 13. 제안서 편집 완료 (락 해제)

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `POST /api/proposals/{proposalId}/finish-editing` 요청
- `proposalService.finishEditing(proposalId, userId)` 호출

**`/application` 계층 — `ProposalService.finishEditing()`**

1. **제안서 조회** → 멤버 검증
2. **락 해제**: `lockService.unlock(proposalId, userId)`
   - Redis `GET proposal:lock:{proposalId}` → 현재 소유자 확인
   - 소유자가 자신이면 `DEL proposal:lock:{proposalId}` 실행
   - 타인이 보유 중이면 아무것도 하지 않음 (자신의 락만 해제 가능)

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 존재하지 않는 제안서 | `P001 PROPOSAL_NOT_FOUND` | 404 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |

타인의 락을 해제 시도해도 예외 없이 무시됨 (no-op).

---

#### DB 관련 작업

조회: `SELECT * FROM proposals WHERE proposal_id = ?`
Redis: `GET proposal:lock:{proposalId}` → `DEL proposal:lock:{proposalId}`

---

### 14. 투표 시작 (최종 제출)

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `POST /api/proposals/{proposalId}/start-voting` 요청을 받아 `@Valid @RequestBody SubmitProposalRequest`로 바인딩
- `@Valid` 있음 → `@NotBlank`(title, paragraph), `@Size`(title 5~100자), `@NotNull`+`@Future`(deadline), `@Min(1)`(minAgreements) 동작

**`/api/dto` 계층 — `SubmitProposalRequest`**
- 필드: `title`(@NotBlank, @Size min=5 max=100), `paragraph`(@NotBlank), `image`(optional), `solution`(optional), `expectedEffect`(optional), `minAgreements`(@Min 1), `deadline`(@NotNull, @Future)

**`/application` 계층 — `ProposalService.startVoting()`**

1. **제안서 조회** → 멤버 검증
2. **상태 검증**: 이미 `VOTING`이면 예외, 이미 `COMPLETED`이면 예외
3. **작성자 확인**: `proposal.getAuthorId().equals(userId)` → 작성자 본인만 투표 시작 가능
4. **타인 락 점유 확인**: `lockService.getLockOwner(proposalId)` → 타인이 락을 보유 중이면 예외 (자신이거나 없으면 통과)
5. **내용 구성**: `ContentFormat.of(paragraph, image, solution, expectedEffect)` → paragraph null이면 `IllegalArgumentException` 발생 (필수 검증)
6. **DB 원자적 처리** (native query): `proposalRepository.submitAndStartVoting(proposalId, title, contents, deadline, minAgreements)`
   - 내용 저장 + status=`VOTING` 전환 + 마감일 + 정족수를 단일 UPDATE로 처리
   - `@Version` 우회
7. **락 해제**: `lockService.unlock(proposalId, userId)` → 투표 시작 후 편집 불가이므로 락 반납
8. `findById` 재조회 후 `ProposalResponse` 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| title/paragraph 빈값, deadline null | (`MethodArgumentNotValidException`) | 400 |
| 존재하지 않는 제안서 | `P001 PROPOSAL_NOT_FOUND` | 404 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |
| 이미 투표 진행 중 | `P012 ALREADY_VOTING` | 409 |
| 이미 완료된 제안서 | `P013 ALREADY_COMPLETED` | 409 |
| 작성자 본인이 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |
| 다른 사용자가 락 보유 중 | `P002 PROPOSAL_BEING_EDITED` | 409 |
| paragraph 비어있음 (도메인 검증) | `IllegalArgumentException` → 공통 핸들러 | 400 |

---

#### DB 관련 작업

```
-- 내용 저장 + 상태 전환을 단일 native query로 원자적 처리
submitAndStartVoting(proposalId, title, contentsJson, deadline, requiredConsents, updatedAt)
→ UPDATE proposals
  SET title = ?, contents = ?, status = 'VOTING',
      consent_deadline = ?, required_consents = ?, updated_at = ?
  WHERE proposal_id = ?
```

---

#### 구조 채택 이유 / 한계

- **단일 쿼리 원자적 처리**: `updateContent`(내용저장) 후 별도로 `status=VOTING` UPDATE를 하면 두 쿼리 사이에 @Version 충돌 가능. 한 쿼리로 묶어 원자성 보장.
- **클라이언트가 deadline과 minAgreements 결정**: 서버 고정값이 아니라 클라이언트 입력값을 사용. 논의방 상황에 따라 정족수와 투표 기간을 유연하게 설정 가능.

---

### 15. 제안서 동의

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `POST /api/proposals/{proposalId}/consents` 요청
- `proposalService.consentProposal(proposalId, userId)` 호출

**`/application` 계층 — `ProposalService.consentProposal()`**

1. **제안서 조회** → 멤버 검증
2. **투표 중 여부 확인**: status != `VOTING`이면 예외
3. **마감 확인**: `LocalDateTime.now().isAfter(proposal.getDeadline())`이면 예외
4. **중복 동의 확인**: `proposal.getConsents().stream().anyMatch(c -> c.getId().equals(userId))` → 이미 동의했으면 예외
5. **유저 정보 조회**: `userRepository.findById(userId)` → 닉네임 등 조회해 `Consenter` 생성
6. **동의 추가** (native query): `proposalRepository.addConsent(proposalId, consenter)`
   - `Consenter`를 `ObjectMapper.writeValueAsString()`으로 JSON 직렬화
   - `JSON_ARRAY_APPEND`로 기존 `consents` 배열에 append (단일 원소 추가)
   - `@Modifying(clearAutomatically = true)` → JPA 캐시 무효화
7. `findById` 재조회 후 `ConsentResponse(totalConsents)` 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 존재하지 않는 제안서 | `P001 PROPOSAL_NOT_FOUND` | 404 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |
| 투표 중이 아님 | `P009 NOT_IN_VOTING` | 400 |
| 투표 마감 초과 | `P015 VOTING_DEADLINE_EXPIRED` | 400 |
| 이미 동의함 | `P003 ALREADY_CONSENTED` | 409 |

---

#### DB 관련 작업

```
-- JSON 배열에 동의자 추가 (native query)
addConsent(proposalId, consenterJson, updatedAt)
→ UPDATE proposals
  SET consents = JSON_ARRAY_APPEND(COALESCE(consents, JSON_ARRAY()), '$', CAST(? AS JSON)),
      updated_at = ?
  WHERE proposal_id = ?

-- consenterJson 예시
{"id": 42, "nickname": "길동이"}
```

---

#### 구조 채택 이유 / 한계

- **`JSON_ARRAY_APPEND` native query 사용 이유**: 동의자 목록을 별도 테이블이 아닌 JSON 컬럼으로 관리. 동의 추가 시 기존 consents 배열 전체를 읽어 덮어쓰는 방식이면 `@Version` 충돌 발생 가능 (스케줄러/수동 종료와 동시 실행). DB 레벨 JSON 함수로 append하면 버전 충돌 없이 원자적으로 추가 가능.
- **한계**: `JSON_ARRAY_APPEND`는 MySQL/PostgreSQL 방언. DB 교체 시 쿼리 수정 필요.

---

### 16. 투표 종료 (수동)

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `POST /api/proposals/{proposalId}/end-voting` 요청
- `proposalService.endVoting(proposalId, userId)` 호출

**`/application` 계층 — `ProposalService.endVoting()`**

1. **제안서 조회** → 멤버 검증
2. **투표 중 여부 확인**: status != `VOTING`이면 예외
3. **작성자 확인**: `proposal.getAuthorId().equals(userId)` → 작성자 본인만 종료 가능
4. **결과 판정**:
   - 동의 수 >= `requiredConsents` → `COMPLETED` (가결)
   - 마감일 초과(`deadline` < now) → `REJECTED` (부결)
   - 두 조건 모두 미달 → `INSUFFICIENT_CONSENTS` 예외 (아직 종료 불가)
5. **DB 상태 확정** (native query): `proposalRepository.updateVotingResult(proposalId, finalStatus)`
   - status 변경 + `consent_deadline = NULL` + `version += 1` 단일 쿼리
6. `findById` 재조회 후 `ProposalResponse` 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 존재하지 않는 제안서 | `P001 PROPOSAL_NOT_FOUND` | 404 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |
| 투표 중이 아님 | `P009 NOT_IN_VOTING` | 400 |
| 작성자 본인이 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |
| 정족수 미달 + 마감 미도래 (종료 불가) | `P017 INSUFFICIENT_CONSENTS` | 409 |

---

#### DB 관련 작업

```
-- 투표 결과 확정 (native query)
updateVotingResult(proposalId, status, updatedAt)
→ UPDATE proposals
  SET status = ?, consent_deadline = NULL, version = version + 1, updated_at = ?
  WHERE proposal_id = ?
```

---

#### 구조 채택 이유 / 한계

- **native query + `version += 1` 명시**: `@Version` 우회 쿼리이지만 `version` 컬럼을 수동으로 증가시켜 변경 이력 추적 가능하게 유지. 동시에 동의하기(`addConsent`)가 실행되어도 status 업데이트는 분리된 컬럼이므로 충돌 없음.
- **정족수 미달이면 예외**: 작성자가 "그냥 닫고 싶다"는 경우도 마감일을 기다려야 REJECTED 처리 가능. 마감일 전 강제 종료를 허용하지 않는 정책.

---

### 17. 투표 자동 종료 (스케줄러)

#### 정상 플로우

**`/application` 계층 — `ProposalVotingScheduler.checkExpiredVoting()`**
- `@Scheduled(cron = "0 0 * * * *")` — 매 시간 정각마다 실행
- `proposalRepository.findVotingProposalsWithExpiredDeadline(now)` → 마감일이 지난 `VOTING` 상태 제안서 목록 조회
- 각 제안서에 대해:
  1. 동의 수 >= `requiredConsents` → `COMPLETED` (가결)
  2. 그 외 → `UNSUBMITTABLE` (정족수 미달 만료)
  3. `proposalRepository.updateVotingResult(proposalId, finalStatus)` → native query로 상태 확정
- 개별 제안서 처리 실패 시 로그만 남기고 다음 제안서 처리 계속

---

#### 예외 플로우

없음. 각 제안서별로 try-catch 처리 → 한 건 실패해도 나머지 계속 처리.

---

#### DB 관련 작업

```
-- 마감 만료된 VOTING 제안서 조회 (JPQL)
findVotingProposalsWithExpiredDeadline(now)
→ SELECT p FROM proposals p
  WHERE p.status = 'VOTING' AND p.deadline < ?

-- 상태 확정 (native query, 수동 종료와 동일)
updateVotingResult(proposalId, status, updatedAt)
→ UPDATE proposals
  SET status = ?, consent_deadline = NULL, version = version + 1, updated_at = ?
  WHERE proposal_id = ?
```

---

#### 구조 채택 이유 / 한계

- **스케줄러 방식**: 만료와 동시에 즉시 처리하지 않고 최대 1시간 지연 가능. 정밀한 실시간 처리가 필요하면 Redis TTL 만료 이벤트(`keyspace notification`)나 별도 큐를 사용해야 하나, 현재 서비스 규모에서는 과잉.
- **한계**: 스케줄러와 `addConsent`(동의하기)가 동시에 실행될 수 있음. `updateVotingResult`가 native query로 `version += 1`을 처리하므로 `addConsent`의 JSON append와 컬럼 충돌 없음. 단, 마감 직전 동의 추가 후 스케줄러가 먼저 종료 처리하면 해당 동의가 카운트에서 누락될 수 있음 (허용 범위로 판단).

---

### 18. 제안서 조회

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `GET /api/proposals/{proposalId}` 요청
- `proposalService.getProposal(proposalId, userId)` 호출

**`/application` 계층 — `ProposalService.getProposal()`**
1. `proposalRepository.findById(proposalId)` → 없으면 예외
2. `memberRepository.existsByUserIdAndRoomId(userId, proposal.getRoomId())` → 해당 논의방 멤버만 조회 가능
3. `ProposalResponse.from(proposal)` 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 존재하지 않는 제안서 | `P001 PROPOSAL_NOT_FOUND` | 404 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |

---

#### DB 관련 작업

```
findById(proposalId)
→ SELECT * FROM proposals WHERE proposal_id = ?

existsByUserIdAndRoomId(userId, roomId)
→ SELECT count(*) > 0 FROM members WHERE user_id = ? AND room_id = ?
```

---

### 19. 논의방의 제안서 목록 조회

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `GET /api/proposals/rooms/{roomId}` 요청
- `proposalService.getProposalsByRoom(roomId, userId)` 호출

**`/application` 계층 — `ProposalService.getProposalsByRoom()`**
1. `memberRepository.existsByUserIdAndRoomId(userId, roomId)` → 멤버 검증
2. `proposalRepository.findByRoomId(roomId)` → 해당 방의 제안서 목록 최신순 조회
3. `ProposalResponse::from` 스트림 변환 후 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |

---

#### DB 관련 작업

```
-- 논의방의 제안서 목록 조회 (JPQL, 최신순)
findByRoomId(roomId)
→ SELECT p FROM proposals p
  WHERE p.room_id = ?
  ORDER BY p.created_at DESC
```

---

### 20. 제안서 락 상태 확인

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `GET /api/proposals/{proposalId}/lock-status` 요청
- `proposalService.getLockStatus(proposalId, userId)` 호출

**`/application` 계층 — `ProposalService.getLockStatus()`**
1. **제안서 조회** → 멤버 검증
2. `lockService.getLockOwner(proposalId)` → Redis `GET proposal:lock:{proposalId}` → null이면 락 없음
3. 락이 없으면 `LockStatusResponse.unlocked()` 반환
4. 락이 있으면 `userRepository.findById(lockOwner)`로 닉네임 조회 → `LockStatusResponse.locked(lockOwner, nickname)` 반환

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 존재하지 않는 제안서 | `P001 PROPOSAL_NOT_FOUND` | 404 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |

---

#### DB 관련 작업

Redis: `GET proposal:lock:{proposalId}`

락 보유 시 `SELECT * FROM users WHERE user_id = ?` (닉네임 조회용)

---

### 21. 동의자 목록 조회

---

## 채팅 시나리오

> 채팅은 HTTP가 아닌 **WebSocket(STOMP over SockJS)** 프로토콜을 사용한다.
> 메시지 브로커로는 **Redis Pub/Sub**를 사용하며, 다중 서버 환경을 전제로 설계되었다.

### 전체 아키텍처 개요

```
[클라이언트]
    │  ① STOMP CONNECT (JWT 포함)
    ▼
[StompChannelInterceptor]  ← JWT 검증, userId를 WebSocket 세션에 저장
    │
    ▼
[MessageController]        ← @MessageMapping("/chat.sendMessage")
    │
    ▼
[MessageService]           ← 유효성 검증, DB 저장
    │
    ▼
[RedisPublisher]           ← Redis PUBLISH "chatChannel"
    │
    ▼ (Redis Pub/Sub)
[RedisSubscriber]          ← Redis SUBSCRIBE "chatChannel" (모든 서버 인스턴스)
    │
    ▼
[SimpMessagingTemplate]    ← STOMP broker에 전달 (/topic/room.{roomId})
    │
    ▼
[STOMP SimpleBroker]       ← 해당 채팅방을 구독 중인 모든 클라이언트에게 브로드캐스팅
```

**왜 Redis Pub/Sub를 쓰는가?**
- 서버가 1대면 `@SendTo("/topic/room.{roomId}")` 로 직접 브로드캐스팅해도 됨.
- 서버가 여러 대이면 클라이언트 A가 서버1에, 클라이언트 B가 서버2에 연결된 경우 서버1의 SimpleBroker는 서버2의 클라이언트에게 메시지를 전달할 수 없음.
- Redis 채널(`chatChannel`)에 발행하면 모든 서버 인스턴스의 Subscriber가 동시에 수신 → 각자의 SimpleBroker를 통해 자신에게 연결된 클라이언트에게 전달.

**STOMP 설정 요약** (`WebSocketConfig`)

| 항목 | 값 |
|------|---|
| WebSocket 핸드셰이크 엔드포인트 | `/gyeonggi_partners-chat` (SockJS 폴백 지원) |
| 클라이언트 → 서버 prefix | `/app` |
| 서버 → 클라이언트 prefix | `/topic` |
| 채팅방 구독 주소 | `/topic/room.{roomId}` |
| 에러 수신 주소 | `/queue/errors` (개인 큐) |

---

### 22. WebSocket 연결 (STOMP CONNECT)

#### 정상 플로우

클라이언트는 HTTP로 요청을 시작하지 않고 WebSocket 핸드셰이크를 통해 연결을 수립한다.

**연결 과정**

1. 클라이언트가 `/gyeonggi_partners-chat` 으로 SockJS 연결 시도 (HTTP → WebSocket 업그레이드)
2. STOMP `CONNECT` 프레임 전송. 헤더에 `Authorization: Bearer {accessToken}` 포함
3. `StompChannelInterceptor.preSend()` 가 모든 인바운드 프레임을 가로챔
   - `StompCommand.CONNECT` 인 경우에만 처리, 나머지 프레임은 그대로 통과
   - `Authorization` 헤더 추출 → `Bearer ` 접두어 제거 후 토큰 추출
   - `JwtTokenProvider.validateToken(token)` 으로 서명/만료 검증
   - `jwtTokenProvider.getAuthentication(token)` → `CustomUserDetails` 추출 → `userId` 획득
   - `accessor.getSessionAttributes().put("userId", userId)` 로 **WebSocket 세션에 userId 저장**
     - 이후 메시지 수신 시 `headerAccessor.getSessionAttributes().get("userId")` 로 꺼내어 쓸 수 있음
4. 검증 통과 → STOMP `CONNECTED` 프레임 응답. 이제 클라이언트는 이 WebSocket 커넥션을 통해 메시지를 주고받을 수 있음
5. 클라이언트가 `/topic/room.{roomId}` 를 STOMP `SUBSCRIBE` 로 구독 → 해당 채팅방의 브로드캐스트 메시지를 수신 대기

**프로토콜 특성**

- 최초 연결 이후에는 HTTP 요청 없이 하나의 TCP 커넥션을 유지하며 양방향 통신
- STOMP 프레임 단위로 메시지를 구조화 (HTTP의 Request/Response 모델과 다름)
- SockJS 폴백: WebSocket을 지원하지 않는 환경에서 Long Polling 등으로 자동 대체

---

#### 예외 플로우

연결 단계 예외는 `@MessageExceptionHandler` 가 아닌 `StompChannelInterceptor` 에서 직접 처리된다. `MessageDeliveryException` 을 throw하면 STOMP 연결이 거부된다.

| 상황 | 처리 방식 |
|------|----------|
| `Authorization` 헤더 없음 또는 형식 오류 | `MessageDeliveryException` throw → STOMP ERROR 프레임 응답 |
| JWT 만료 또는 서명 불일치 | `MessageDeliveryException` throw → STOMP ERROR 프레임 응답 |

---

#### 구조 채택 이유 / 한계

- **`StompChannelInterceptor`에서 인증 처리**: Spring Security의 `JwtAuthenticationFilter`는 HTTP 요청 기반이라 WebSocket 연결 시점에는 동작하지 않음. CONNECT 프레임 인터셉터에서 직접 JWT를 검증하고 세션에 userId를 저장하는 방식으로 별도 구현.
- **세션에 userId 저장**: 이후 메시지 전송 시 클라이언트가 보내는 `userId` 필드와 세션에 저장된 `userId`를 비교해 위조된 요청을 걸러냄.
- **한계**: CONNECT 이후 프레임(SEND 등)에서는 토큰을 재검증하지 않음. 연결 후 토큰이 만료되어도 WebSocket 커넥션이 살아있으면 계속 사용 가능. 완전한 재검증이 필요하면 매 SEND 프레임마다 인터셉터에서 토큰을 확인해야 하나, 현재 구조로 타협.

---

### 23. 채팅방 입장 알림 (JOIN)

#### 정상 플로우

WebSocket 연결 후 특정 채팅방에 입장했음을 다른 참여자에게 알리는 시나리오. 채팅방에 실제 멤버로 추가하는 로직(논의방 입장, 시나리오 6 참고)과는 별개다.

**STOMP SEND 프레임 → `/app/chat.addUser`**

```json
{
  "type": "JOIN",
  "content": "홍길동님이 입장하셨습니다.",
  "roomId": 1,
  "userId": 42
}
```

**`/application` 계층 — `MessageService.processJoinMessage()`**

1. `request.getType()` 이 `JOIN` 이면 `redisPublisher.publish(request)` 호출
2. `RedisPublisher` 가 `chatChannel` Redis 채널에 `MessageRequest` 를 JSON 직렬화 후 `PUBLISH`
3. `RedisSubscriber.handleMessage()` 가 `chatChannel` 을 수신 → `ObjectMapper` 로 역직렬화 → `SimpMessagingTemplate.convertAndSend("/topic/room.{roomId}", request)` 로 해당 채팅방 구독자에게 브로드캐스팅

JOIN 타입은 DB에 저장하지 않는다. (알림 메시지이므로 영속화 불필요)

---

#### 예외 플로우

없음. JOIN 메시지는 별도 검증 없이 Redis로 발행. 멤버 여부 검증은 메시지 전송(CHAT) 시에만 수행.

---

#### DB 관련 작업

없음. Redis PUBLISH만 수행.

```
Redis PUBLISH chatChannel {직렬화된 MessageRequest JSON}
```

---

### 24. 채팅 메시지 전송 (CHAT)

#### 정상 플로우

**STOMP SEND 프레임 → `/app/chat.sendMessage`**

```json
{
  "type": "CHAT",
  "content": "안녕하세요!",
  "roomId": 1,
  "userId": 42
}
```

**`/api` 계층 — `MessageController.sendMessage()`**

- `@MessageMapping("/chat.sendMessage")` → STOMP `/app/chat.sendMessage` 경로와 매핑
- `@Payload @Valid MessageRequest request` → `@NotBlank(content)` Bean Validation 동작
- `SimpMessageHeaderAccessor` 로 WebSocket 세션 정보 접근 가능
- 반환값 없음 (`void`) — 응답은 Redis → Subscriber → `SimpMessagingTemplate` 경로로 처리

**`/application` 계층 — `MessageService.processChatMessage()`**

1. **세션 userId 검증**: `headerAccessor.getSessionAttributes().get("userId")` 로 세션에 저장된 userId를 꺼내 `request.getUserId()` 와 비교 → 불일치 시 예외 (클라이언트가 다른 사람의 userId로 메시지 위조 방지)
2. **내용 검증**: `validateMessage()` → content null/공백이면 예외, 2000자 초과 시 예외
3. **멤버 권한 확인**: `memberJpaRepository.existsByUserIdAndRoomId(userId, roomId)` → 해당 논의방 멤버가 아니면 예외
4. **엔티티 조회**: `userJpaRepository.findById(userId)`, `discussionRoomJpaRepository.findById(roomId)`
5. **DB 저장**: `MessageEntity` 빌더로 생성 후 `messageRepository.save(entity)` → `INSERT INTO messages ...`
6. **Redis 발행**: `request.getType() == CHAT` 이면 `redisPublisher.publish(request)` 호출
   - `redisTemplate.convertAndSend("chatChannel", request)` → Redis `PUBLISH chatChannel {JSON}`
   - Value Serializer: `GenericJackson2JsonRedisSerializer` 로 JSON 직렬화

**`/application` 계층 — `RedisSubscriber.handleMessage(String message)`**

- `RedisMessageListenerContainer` 가 `chatChannel` 을 상시 구독 중
- 메시지 수신 → `MessageListenerAdapter` 가 `handleMessage()` 를 리플렉션으로 호출
- `ObjectMapper.readValue(message, MessageRequest.class)` 로 역직렬화
  - `MessageListenerAdapter` 의 StringSerializer로 1차 역직렬화 → String 전달 → ObjectMapper로 2차 역직렬화
- `messagingTemplate.convertAndSend("/topic/room.{roomId}", request)` → SimpleBroker에 전달
- SimpleBroker가 `/topic/room.{roomId}` 를 STOMP SUBSCRIBE한 모든 클라이언트에게 브로드캐스팅

---

#### 예외 플로우

WebSocket 예외는 HTTP와 다르게 `@ControllerAdvice` + `@MessageExceptionHandler` 로 처리된다. 에러 응답은 HTTP Response가 아니라 STOMP 프레임으로 해당 유저의 `/queue/errors` 개인 큐로 전송된다.

| 상황 | 커스텀 에러코드 | 전달 경로 |
|------|----------------|----------|
| 세션 userId와 요청 userId 불일치 | `M003 MESSAGE_USER_INCOINSISTENCY` | `BusinessException` → `GlobalExceptionHandler` (HTTP 에러) |
| content 비어있음 (서비스 레벨) | `M001 MESSAGE_CONTENT_EMPTY` | `MessageException` → `WebSocketExceptionHandler` → `/queue/errors` |
| content 2000자 초과 | `M002 MESSAGE_TOO_LONG` | `MessageException` → `WebSocketExceptionHandler` → `/queue/errors` |
| 논의방 멤버 아님 | `R006 NOT_A_ROOM_MEMBER` | `MessageException` → `WebSocketExceptionHandler` → `/queue/errors` |

`MessageException` 은 `BusinessException` 과 다른 별도 예외 클래스. `@MessageExceptionHandler` 가 WebSocket 컨텍스트에서 발생한 `MessageException` 을 잡아 `/queue/errors` 로 전송.

Redis Subscriber에서 발생하는 예외는 스레드가 죽지 않도록 catch 후 로그만 남김.

---

#### DB 관련 작업

```
-- 메시지 저장 (JPA save)
messageRepository.save(entity)
→ INSERT INTO messages (user_id, room_id, content, created_at, updated_at)
  VALUES (?, ?, ?, now(), now())

-- 유저 조회 (메시지 저장 전)
userJpaRepository.findById(userId)
→ SELECT * FROM users WHERE user_id = ?

-- 논의방 조회 (메시지 저장 전)
discussionRoomJpaRepository.findById(roomId)
→ SELECT * FROM discussion_rooms WHERE id = ?

-- 멤버 여부 확인
memberJpaRepository.existsByUserIdAndRoomId(userId, roomId)
→ SELECT count(*) > 0 FROM members WHERE user_id = ? AND room_id = ?
```

---

#### 구조 채택 이유 / 한계

- **컨트롤러에서 `@SendTo` 없이 void 반환**: 컨트롤러가 직접 브로드캐스팅하면 해당 서버 인스턴스에 연결된 클라이언트에게만 전달됨. Redis 발행 → Subscriber 수신 → `SimpMessagingTemplate` 전달 구조로 모든 인스턴스에 전파.
- **직렬화 책임 분리**: `RedisConfig`의 `MessageListenerAdapter`에서 String으로 1차 역직렬화, `RedisSubscriber`에서 ObjectMapper로 2차 역직렬화. 각 단계의 책임을 분리.
- **한계 1**: `@NotBlank(content)` 는 `@Payload @Valid` 가 있어 동작하지만, `roomId`, `userId`, `type` 은 validation 어노테이션 없음 → null이 들어올 수 있음.
- **한계 2**: DB 저장(5번)과 Redis 발행(6번)이 별개 → DB 저장 성공 후 Redis 발행 실패 시 메시지가 DB에는 있지만 실시간으로 전달되지 않음. 재발행 메커니즘 없음.

---

### 25. 이전 메시지 조회 (HTTP)

> 이 시나리오만 WebSocket이 아닌 일반 **HTTP GET** 요청이다. 채팅방 입장 시 과거 메시지를 불러올 때 사용한다.

#### 정상 플로우

**`/api` 계층 — `MessageController`**

- `GET /api/messages/rooms/{roomId}?cursor={messageId}&size=30` 요청
- `@PathVariable Long roomId`, `@RequestParam(required = false) Long cursor`, `@RequestParam(defaultValue = "30") int size`
- `messageService.getMessages(roomId, cursor, size)` 호출

**`/application` 계층 — `MessageService.getMessages()`**

- `PageRequest.of(0, size+1)` 로 Pageable 생성 → `size+1` 개를 조회해 다음 페이지 존재 여부 판단
- `cursor == null` (최초 조회): `messageRepository.findLatesetMessages(roomId, pageable)` → 최신순으로 size+1개 조회
- `cursor != null` (이후 조회): `messageRepository.findMessagesBeforeCursor(roomId, cursor, pageable)` → `id < cursor` 인 메시지를 최신순으로 size+1개 조회
- 결과가 `size+1`개이면 다음 페이지 존재 → `hasNext=true`, 마지막 원소 제거 후 반환
- `nextCursor` = 반환 목록의 마지막 메시지 `id` (클라이언트가 다음 요청 시 이 값을 cursor로 사용)
- `MessageEntity` 조회 시 `JOIN FETCH m.user` 로 N+1 방지 (닉네임 등 유저 정보 함께 조회)

**커서 페이징 방식**
```
최초: GET /api/messages/rooms/1?size=30
      → id 기준 최신 30개 반환, nextCursor=101

다음: GET /api/messages/rooms/1?cursor=101&size=30
      → id < 101 인 메시지 30개 반환, nextCursor=71

...반복...
```

---

#### 예외 플로우

없음. 메시지가 없으면 빈 목록 반환.

---

#### DB 관련 작업

```
-- 최초 조회 (cursor 없음, JPQL + JOIN FETCH)
findLatesetMessages(roomId, pageable)
→ SELECT m FROM messages m
  JOIN FETCH m.user
  WHERE m.discussion_room_id = ?
  ORDER BY m.id DESC
  LIMIT ?

-- 커서 기반 이후 조회 (JPQL + JOIN FETCH)
findMessagesBeforeCursor(roomId, cursor, pageable)
→ SELECT m FROM messages m
  JOIN FETCH m.user
  WHERE m.discussion_room_id = ?
  AND m.id < ?
  ORDER BY m.id DESC
  LIMIT ?
```

---

#### 구조 채택 이유 / 한계

- **커서 페이징(Cursor Pagination)**: OFFSET 기반 페이징은 중간에 새 메시지가 추가되면 페이지 경계가 밀려 중복/누락이 발생. ID 기반 커서 페이징은 "이 ID보다 작은 것"을 조회하므로 실시간으로 메시지가 쌓여도 일관성 보장.
- **`size+1` 조회 트릭**: 실제 응답에는 size개만 담고, size+1개 조회 성공 여부로 다음 페이지 존재를 판단. 별도 COUNT 쿼리를 실행하지 않아도 됨.
- **JOIN FETCH**: `MessageEntity`가 `UserEntity`를 `@ManyToOne(FetchType.LAZY)`로 갖는데, 목록 조회 시 유저 정보도 필요하므로 Fetch Join으로 1회 쿼리에 함께 조회. N+1 방지.
- **한계**: 인증 없이 호출 가능한지 여부가 코드에서 명시적으로 확인되지 않음 (`@AuthenticationPrincipal` 없음). Security Config에서 별도로 허용 설정이 없으면 Spring Security가 막을 수 있음.

#### 정상 플로우

**`/api` 계층 — `ProposalController`**
- `GET /api/proposals/{proposalId}/consenters` 요청
- `proposalService.getConsenters(proposalId, userId)` 호출

**`/application` 계층 — `ProposalService.getConsenters()`**
1. **제안서 조회** → 멤버 검증
2. `ConsenterListResponse.from(proposal)` → `proposal.getConsents()` 목록을 DTO로 변환 반환
   - `consents`는 JSON 컬럼이 `Proposal.restore()` 시 이미 `List<Consenter>`로 역직렬화된 상태

---

#### 예외 플로우

| 상황 | 커스텀 에러코드 | HTTP 상태 |
|------|----------------|-----------|
| 존재하지 않는 제안서 | `P001 PROPOSAL_NOT_FOUND` | 404 |
| 해당 논의방 멤버 아님 | `P008 UNAUTHORIZED_ACCESS` | 403 |

---

#### DB 관련 작업

```
findById(proposalId)
→ SELECT * FROM proposals WHERE proposal_id = ?
  (contents, consents 컬럼은 JSON → ProposalEntity.toDomain() 시 ObjectMapper로 역직렬화)
```

#### 정상 플로우

**`/api` 계층 — `DiscussionRoomController`**
- `GET /api/discussion-rooms/retrieveMyJoined?page=1&size=15` 요청
- `@RequestParam`으로 `page`(기본값 1), `size`(기본값 15) 수신
- `@AuthenticationPrincipal`로 `userId` 추출
- `discussionRoomService.retrieveJoinedRooms(userId, page, size)` 호출

**`/application` 계층 — `DiscussionRoomService.retrieveJoinedRooms()`**

1. **참여 방 ID 페이징 조회**: `memberRepository.findRoomIdsByUserId(userId, pageable)` → `members` 테이블에서 해당 유저가 참여한 `room_id` 목록을 `created_at DESC`(최신 참여순)로 페이징 조회
   - 결과가 없으면 빈 목록 즉시 반환
2. **방 상세 일괄 조회**: `discussionRoomRepository.findAllByIdIn(roomIds)` → `IN` 쿼리 1회로 방 목록 조회 (soft delete된 방 제외)
3. **멤버 수 일괄 조회**: `memberRepository.countByRoomIds(roomIds)` → GROUP BY 쿼리 1회로 N+1 방지 (7번 시나리오와 동일 방식)
4. **각 방에 대해 Cache-Aside**: `cacheRepository.retrieveCachingRoom(roomId)` → Redis 캐시 확인, 미스 시 DB 조회 후 캐싱 (7번 시나리오와 동일)
5. `DiscussionRoomListRes.of(roomSummaries, page, size, totalElements)` 반환

---

#### 예외 플로우

없음. 참여한 방이 없으면 빈 목록 반환.

---

#### DB 관련 작업

```
-- 참여 방 ID 페이징 조회 (JPQL)
findRoomIdsByUserIdOrderByJoinedAtDesc(userId, pageable)
→ SELECT m.room_id FROM members m
  WHERE m.user_id = ?
  ORDER BY m.created_at DESC
  LIMIT ? OFFSET ?

-- 방 상세 일괄 조회 (JPQL, N+1 방지)
findAllByIdIn(roomIds)
→ SELECT d FROM discussion_rooms d
  WHERE d.id IN (?, ?, ...) AND d.deleted_at IS NULL

-- 멤버 수 일괄 조회 (7번과 동일)
countByRoomIds(roomIds)
→ SELECT m.room_id as roomId, COUNT(m) as count
  FROM members m
  WHERE m.room_id IN (?, ?, ...)
  GROUP BY m.room_id
```

---

#### 구조 채택 이유 / 한계

- **목록 순서는 DB가 기준**: 최신 참여순 정렬이 필요한데 Redis ZSet의 `user:{userId}:joined`도 timestamp를 score로 같은 순서를 유지하지만, Redis는 최대 100건으로 제한됨. DB는 전체 이력 보유. 따라서 목록 조회는 DB를 source of truth로 사용.
- **N+1 방지 이중 적용**: 방 목록은 `IN` 쿼리 1회, 멤버 수는 `GROUP BY` 쿼리 1회로 해결. 방 상세는 Cache-Aside 캐싱으로 반복 DB 조회 최소화.
- **한계**: 전체 논의방 조회(7번)와 구조가 거의 동일한데 코드 중복이 있음. 목록 조회 파이프라인을 추상화하면 줄일 수 있으나 현재는 명시적으로 분리된 구조.
