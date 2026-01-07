# Proposal & Voting API 명세 (Refactored)

이 문서는 제안서(Proposal) 및 투표(Voting) 도메인에 관한 API 명세입니다.

---

## 공통 규격
본 API는 [공통 Schema](../../common/Schema.md)의 `ApiResponse<T>` 및 `PageInfo` 규격을 따릅니다.

---

## 1. 제안서 및 투표 API (ProposalController)

### 1.1 제안서/투표 현황 조회
- **Endpoint**: `GET /api/discussion-rooms/{roomId}/proposal`
- **Response Data**: `ProposalResponse`
- **비고**: 방 내부에서 제안서 패널을 열 때 사용

### 1.2 제안서 임시 저장 (Auto-save)
- **Endpoint**: `PATCH /api/discussion-rooms/{roomId}/proposal`
- **Request Body**: `UpdateProposalReq`
- **Response Data**: `ProposalResponse`
- **비고**: 방장만 수정 가능

### 1.3 제안서 최종 제출 (투표 시작)
- **Endpoint**: `POST /api/discussion-rooms/{roomId}/proposal/submit`
- **Request Body**: `SubmitProposalReq`
- **Response Data**: `ProposalResponse`
- **비고**: 제출 시 상태가 `VOTING`으로 변경됨

### 1.4 제안서 동의 (투표하기)
- **Endpoint**: `POST /api/discussion-rooms/{roomId}/proposal/vote`
- **Response Data**: `ProposalResponse`
- **비고**: 일반 참여자가 동의 버튼을 클릭할 때 사용

---

## 2. 상세 DTO 명세

### ProposalResponse (제안서 및 투표 정보)
```json
{
  "proposalId": 101,
  "title": "부천역 환기구 위치 변경 제안",
  "content": {
    "issue": "밤늦은 시간 환기구 소음이 심각함",
    "solution": "환기구 위치를 도로 쪽으로 50m 이동",
    "expectedEffect": "주거 지역 소음 20% 감소 기대",
    "attachments": [ { "name": "...", "url": "..." } ]
  },
  "status": "VOTING", 
  "voting": {
    "minAgreements": 50,
    "currentAgreements": 12,
    "deadline": "2025-11-15T23:59:59",
    "isVoted": false
  },
  "updatedAt": "2025-11-08T15:00:00"
}
```

### UpdateProposalReq (편집/임시 저장)
| 필드 | 필수 | 설명 |
|------|------|------|
| `title` | Yes | 제안서 제목 |
| `issue` | Yes | 현재 발생 중인 문제 상황 |
| `solution` | Yes | 해결 방안 |
| `expectedEffect` | No | 기대 효과 |
| `attachments` | No | 첨부 자료 리스트 |

### SubmitProposalReq (최종 제출 설정)
| 필드 | 제약 조건 | 설명 |
|------|-----------|------|
| `minAgreements` | 1 이상 | 목표 동의 인원 수 |
| `deadline` | 현재 시간 이후 | 투표 마감 일시 (ISO-8601) |

---

## 3. 필드 상세 스펙 및 Enum
제안서 상태에 대한 상세 정의는 [공통 Schema](../../common/Schema.md)의 `ProposalStatus`를 참조하십시오.
