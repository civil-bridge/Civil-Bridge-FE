# Civil Bridge 디자인 시스템

> Luma 스타일 기반, 따뜻한 커뮤니티 느낌 + 신뢰감

---

## 1. 컬러 팔레트

### 1.1. Primary (브랜드 컬러)

메인 액션, 강조 요소에 사용. Luma의 보라/핑크 그라데이션 톤 참고.

| 이름 | Hex | 용도 |
|------|-----|------|
| Primary-50 | `#FDF4FF` | 배경 하이라이트 |
| Primary-100 | `#FAE8FF` | 호버 배경 |
| Primary-200 | `#F5D0FE` | 비활성 요소 |
| Primary-300 | `#E879F9` | 보조 강조 |
| Primary-400 | `#D946EF` | 아이콘, 링크 |
| Primary-500 | `#C026D3` | 메인 버튼 |
| Primary-600 | `#A21CAF` | 버튼 호버 |
| Primary-700 | `#86198F` | 버튼 클릭 |

### 1.2. Secondary (보조 컬러)

따뜻한 느낌 추가. 오렌지/피치 톤.

| 이름 | Hex | 용도 |
|------|-----|------|
| Secondary-100 | `#FFEDD5` | 알림 배경 |
| Secondary-300 | `#FDBA74` | 뱃지, 태그 |
| Secondary-500 | `#F97316` | 강조 포인트 |

### 1.3. Neutral (중립 컬러)

텍스트, 배경, 보더에 사용. 따뜻한 그레이 톤 (쿨그레이 X).

| 이름 | Hex | 용도 |
|------|-----|------|
| Neutral-50 | `#FAFAF9` | 페이지 배경 |
| Neutral-100 | `#F5F5F4` | 카드 배경 |
| Neutral-200 | `#E7E5E4` | 보더, 구분선 |
| Neutral-300 | `#D6D3D1` | 비활성 보더 |
| Neutral-400 | `#A8A29E` | 플레이스홀더 |
| Neutral-500 | `#78716C` | 보조 텍스트 |
| Neutral-600 | `#57534E` | 본문 텍스트 |
| Neutral-700 | `#44403C` | 제목 텍스트 |
| Neutral-800 | `#292524` | 강조 텍스트 |
| Neutral-900 | `#1C1917` | 최상위 강조 |

### 1.4. Semantic (의미 컬러)

상태 표시용.

| 이름 | Hex | 용도 |
|------|-----|------|
| Success | `#22C55E` | 성공, 완료 |
| Warning | `#EAB308` | 주의, 경고 |
| Error | `#EF4444` | 오류, 삭제 |
| Info | `#3B82F6` | 정보, 안내 |

### 1.5. 특수 컬러

| 이름 | Hex | 용도 |
|------|-----|------|
| Official | `#FEF3C7` (배경) + `#D97706` (텍스트) | 공무원 뱃지 |
| Gradient | `#C026D3` → `#7C3AED` | 히어로 배너, CTA 버튼 |

---

## 2. 타이포그래피

### 2.1. 폰트 패밀리

| 용도 | 폰트 | 비고 |
|------|------|------|
| 기본 | Pretendard | 한글 가독성 우수 |
| 대체 | -apple-system, BlinkMacSystemFont, sans-serif | 시스템 폰트 폴백 |

### 2.2. 폰트 사이즈

| 이름 | 크기 | 행간 | 용도 |
|------|------|------|------|
| Display | 36px | 1.2 | 히어로 타이틀 |
| H1 | 28px | 1.3 | 페이지 제목 |
| H2 | 22px | 1.4 | 섹션 제목 |
| H3 | 18px | 1.4 | 카드 제목 |
| Body-lg | 16px | 1.6 | 본문 강조 |
| Body | 14px | 1.6 | 기본 본문 |
| Caption | 12px | 1.5 | 보조 텍스트, 타임스탬프 |

### 2.3. 폰트 굵기

| 이름 | 값 | 용도 |
|------|-----|------|
| Regular | 400 | 본문 |
| Medium | 500 | 라벨, 버튼 |
| SemiBold | 600 | 제목, 강조 |
| Bold | 700 | 히어로 타이틀 |

---

## 3. 컴포넌트 스타일

### 3.1. 버튼

**Primary 버튼**
```
배경: Primary-500 (#C026D3)
텍스트: White
패딩: 12px 24px
Border-radius: 12px
호버: Primary-600
클릭: Primary-700
그림자: 0 4px 14px rgba(192, 38, 211, 0.25)
```

**Secondary 버튼**
```
배경: Transparent
텍스트: Primary-500
보더: 1px solid Primary-300
패딩: 12px 24px
Border-radius: 12px
호버: Primary-50 배경
```

**Ghost 버튼**
```
배경: Transparent
텍스트: Neutral-600
패딩: 8px 16px
Border-radius: 8px
호버: Neutral-100 배경
```

### 3.2. 카드

**기본 카드**
```
배경: White
보더: 1px solid Neutral-200
Border-radius: 16px
패딩: 20px
그림자: 0 1px 3px rgba(0, 0, 0, 0.05)
호버 그림자: 0 4px 12px rgba(0, 0, 0, 0.1)
호버 보더: Primary-200
트랜지션: all 0.2s ease
```

**토의실 카드 구성**
```
- 지역 태그: Secondary-100 배경, Secondary-500 텍스트, 8px radius
- 공무원 뱃지: Official 컬러, 자물쇠 아이콘
- 제목: H3, Neutral-800
- 내용: Body, Neutral-500, 2줄 말줄임
- 참여자 수: Caption, Neutral-400
- 입장하기: Ghost 버튼 스타일, Primary-500 텍스트
```

### 3.3. 인풋

**텍스트 인풋**
```
배경: White
보더: 1px solid Neutral-200
Border-radius: 12px
패딩: 12px 16px
포커스 보더: Primary-400
포커스 그림자: 0 0 0 3px Primary-100
플레이스홀더: Neutral-400
```

**텍스트에리어**
```
위와 동일, 최소 높이 120px
리사이즈: vertical
```

### 3.4. 태그/뱃지

**지역 태그**
```
배경: Secondary-100
텍스트: Secondary-500
패딩: 4px 12px
Border-radius: 8px
폰트: Caption, Medium
```

**공무원 전용 뱃지**
```
배경: Official 배경
텍스트: Official 텍스트
보더: 1px solid #F59E0B
패딩: 4px 12px
Border-radius: 8px
아이콘: 자물쇠 (좌측)
```

### 3.5. 탭

**탭 네비게이션**
```
비활성 텍스트: Neutral-500
활성 텍스트: Primary-600
활성 하단선: 2px solid Primary-500
패딩: 12px 20px
트랜지션: all 0.2s ease
```

### 3.6. 채팅 말풍선

**일반 사용자**
```
배경: Neutral-100
텍스트: Neutral-700
Border-radius: 16px 16px 16px 4px (좌측 꼬리)
패딩: 12px 16px
최대 너비: 70%
```

**공무원**
```
배경: Primary-50
보더: 1px solid Primary-200
텍스트: Neutral-700
Border-radius: 16px 16px 4px 16px (우측 꼬리)
```

---

## 4. 레이아웃 규칙

### 4.1. 여백 시스템

8px 기반 스케일 사용.

| 이름 | 값 | 용도 |
|------|-----|------|
| space-1 | 4px | 아이콘-텍스트 간격 |
| space-2 | 8px | 인라인 요소 간격 |
| space-3 | 12px | 폼 요소 간격 |
| space-4 | 16px | 카드 내부 패딩 |
| space-5 | 20px | 카드 패딩 |
| space-6 | 24px | 섹션 간격 |
| space-8 | 32px | 큰 섹션 간격 |
| space-10 | 40px | 페이지 상하 여백 |
| space-12 | 48px | 히어로 여백 |

### 4.2. 컨테이너

| 이름 | 최대 너비 | 용도 |
|------|-----------|------|
| Container-sm | 640px | 폼, 인증 페이지 |
| Container-md | 768px | 상세 페이지 |
| Container-lg | 1024px | 목록 페이지 |
| Container-xl | 1280px | 메인 레이아웃 |

좌우 패딩: 16px (모바일), 24px (태블릿), 32px (데스크탑)

### 4.3. 그리드

**토의실 카드 목록**
```
모바일 (< 640px): 1열
태블릿 (640px ~ 1024px): 2열
데스크탑 (> 1024px): 3열
Gap: 24px
```

### 4.4. 반응형 기준점

| 이름 | 값 |
|------|-----|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |

### 4.5. Z-index 규칙

| 레이어 | 값 |
|--------|-----|
| 기본 | 0 |
| 드롭다운 | 10 |
| 고정 헤더 | 20 |
| 모달 배경 | 30 |
| 모달 | 40 |
| 토스트 | 50 |

---

## 5. 그라데이션 & 효과

### 5.1. 브랜드 그라데이션

**히어로 배너**
```css
background: linear-gradient(135deg, #C026D3 0%, #7C3AED 50%, #6366F1 100%);
```

**CTA 버튼 (선택적)**
```css
background: linear-gradient(135deg, #C026D3 0%, #A21CAF 100%);
```

### 5.2. 글래스모피즘 (선택적)

헤더, 모달 등에 적용 가능.
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.2);
```

---

## 6. 적용 예시

### 6.1. 히어로 섹션
- 배경: 브랜드 그라데이션
- 타이틀: Display, Bold, White
- 서브타이틀: Body-lg, Regular, White (opacity 0.9)
- CTA 버튼: White 배경, Primary-600 텍스트

### 6.2. 토의실 목록
- 섹션 타이틀: H2, SemiBold, Neutral-800
- 카운트: Body, Regular, Primary-500 (숫자만)
- 정렬 드롭다운: Ghost 버튼 스타일
- 카드: 기본 카드 스타일 적용