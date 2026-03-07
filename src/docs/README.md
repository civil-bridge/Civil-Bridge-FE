# Civil Bridge Specification Documentation (SDD)

본 프로젝트는 **SDD(Spec-Driven Development, 명세 주도 개발)**를 지향합니다. 
모든 개발(BE/FE)은 이 문서에 정의된 명세를 최우선 순위로 삼아 진행됩니다.

---

## 📂 문서 구조 (Directory Structure)

- **`common/`**: 프로젝트 전체에서 공유되는 규격 (Enum, 전역 타입, DB 설계 등)
  - [Schema.md](./common/Schema.md): 단일 진실 공급원(Single Source of Truth)
- **`domain/`**: 비즈니스 도메인별 상세 명세 (기능, API, 워크플로우)
  - `User/`: 회원가입, 로그인, 프로필 관리
  - `DiscussionRoom/`: 논의방 생성, 관리, 참여자 제어
  - `Proposal/`: 제안서 작성, 투표, 상태 관리
- **`design/`**: UI/UX 명세
  - [DesignSystem.md](./design/DesignSystem.md): 디자인 토큰 및 컴포넌트 스타일 규격
  - [screen/](./design/screen/): 화면별 레이아웃 및 인터랙션 명세
- **`guide/`**: 개발 프로세스 가이드
  - [CommitMessageGuide.md](./guide/CommitMessageGuide.md)

---

## 🔗 Spec ID 시스템 (Traceability)

명세 간의 일관성을 추적하기 위해 고유 ID를 사용합니다.

- **기능(Function)**: `F-{Domain}-{Seq}` (예: `F-USR-01`)
- **화면(Screen)**: `S-{Domain}-{Seq}` (예: `S-USR-01`)
- **API**: `A-{Domain}-{Seq}` (예: `A-USR-01`)

**추적 예시**:
1. `F-USR-01` (로그인 기능) 요구사항 정의
2. `S-USR-01` (로그인 화면) UI 설계 및 `F-USR-01` 연결
3. `A-USR-01` (로그인 API) 설계 및 `S-USR-01` 통신 규격 정의

---

## 🛠️ 개발 규칙
1. **명세 우선**: 코드를 작성하기 전 반드시 해당 도메인의 명세를 업데이트하고 승인을 받습니다.
2. **명세 일치**: FE의 Props명과 BE의 DTO 필드명은 명세에 정의된 이름을 엄격히 따릅니다.
3. **변경 보고**: 개발 중 명세의 결함이나 변경이 필요할 경우, 문서를 먼저 수정합니다.
