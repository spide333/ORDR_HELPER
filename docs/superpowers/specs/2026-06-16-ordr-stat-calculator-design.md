# ORDR 보유 스탯 계산기 설계

## 개요

ORDR 보유 스탯 계산기는 `ordsearch.net` 기준 캐릭터 데이터 중 특별부터 세라핌까지의 주요 등급 캐릭터를 대상으로 한다. 사용자는 물뎀 또는 마뎀 모드를 선택한 뒤, 보유한 캐릭터를 그리드에서 선택하고 전체 보유 스탯 합계를 확인한다. DB에서 `common`으로 관리되는 공용 캐릭터는 물뎀/마뎀 양쪽 목록에 모두 표시한다.

초기 버전은 개인 및 지인 사용을 우선하되, 추후 Play Store 배포 가능성을 열어둔다.

## 목표

- 공개 읽기 전용 Google Sheets를 캐릭터 DB로 사용한다.
- 물뎀/마뎀 모드를 상단에서 전환한다.
- 선택된 모드에 맞는 캐릭터와 공용 캐릭터를 목록에 표시한다.
- 전체 캐릭터는 등급별 그룹으로 나누고, 각 그룹 내부는 가나다순으로 표시한다.
- 캐릭터 카드는 썸네일, 이름, 등급, 선택 여부만 표시한다.
- 선택된 캐릭터는 하단 합계 영역 위에 작은 그리드로 표시한다.
- 하단 고정 영역에서 전체 보유 스탯 합계를 보여준다.
- 물뎀/마뎀 전환 시 선택 목록과 합계를 초기화한다.
- 사용자가 직접 선택 목록을 비울 수 있는 초기화 버튼을 제공한다.

## 비목표

- 초기 버전에서 사용자 계정, 로그인, 서버 DB, 관리자 페이지는 만들지 않는다.
- 초기 버전에서 Google Sheets 쓰기 기능은 제공하지 않는다.
- 초기 버전에서 Android 네이티브 전용 UI는 만들지 않는다.
- 등급 테두리 효과, 불꽃 효과, 세부 색상은 구조와 별개로 추후 디자인 단계에서 조정한다.

## 플랫폼 방향

초기 구현은 PWA 웹앱으로 만든다.

- 지인에게 URL로 바로 공유할 수 있다.
- Google Sheets DB를 수정하면 앱 재배포 없이 데이터가 갱신된다.
- 홈 화면 추가와 기본 오프라인 캐시를 지원할 수 있다.
- 추후 Android 배포가 필요하면 TWA로 감싼다.

일반 WebView 래핑은 개인 APK 용도로는 가능하지만, Play Store 가능성을 고려하면 PWA + TWA가 더 적합하다.

## 기술 스택

- 앱: Vite + React + TypeScript
- 상태 관리: Zustand
- 스타일: CSS Modules
- PWA: vite-plugin-pwa
- 데이터 소스: 공개 읽기 전용 Google Sheets CSV
- Android 패키징 후보: Bubblewrap 기반 TWA

## 데이터 소스

Google Sheets를 공개 읽기 전용으로 게시하고 앱에서 읽는다. 앱은 시트를 source of truth로 사용한다.

초기 데이터 입력 기준은 `ordsearch.net`의 캐릭터 정보를 따른다. 앱은 `ordsearch.net`을 실시간으로 스크래핑하지 않고, Google Sheets에 정리된 데이터를 읽는다.

### 이미지 관리

캐릭터 썸네일 파일은 앱 로컬에 둔다.

예시:

```text
public/characters/roger_immortal.svg
public/characters/zoro_transcend.svg
public/characters/black_maria_distortion.svg
```

Google Sheets에는 이미지 파일 자체를 넣지 않고 `imageKey`를 관리한다. 앱은 기본적으로 `/characters/{imageKey}.svg` 형태로 로컬 썸네일을 찾는다.

권장 방식:

```text
imageKey: roger_immortal
imageUrl:
```

`imageUrl` 컬럼은 외부 이미지나 예외 경로가 필요할 때만 사용하는 선택 컬럼이다. `imageKey` 또는 `imageUrl` 중 하나는 값이 있어야 한다.

이미지가 없거나 로딩에 실패하면 등급 색상이 적용된 이니셜 썸네일을 보여준다.

## Google Sheets 스키마

캐릭터 시트 필수 컬럼:

```text
id
nameKo
grade
damageType
imageKey
sortName
isEnabled
updatedAt
```

캐릭터 시트 선택 컬럼:

```text
imageUrl
```

스탯 값 컬럼은 스탯 정의 시트의 `key`와 같은 이름으로 추가한다. 예를 들어 스탯 정의에 `cooldownReduction`을 추가하면 캐릭터 시트에도 `cooldownReduction` 컬럼을 추가한다.

스탯 정의 시트 컬럼:

```text
key
label
order
enabled
includeInTotal
```

- `key`: 캐릭터 시트의 스탯 컬럼명
- `label`: 하단 합계 영역에 표시할 이름
- `order`: 하단 표시 순서
- `enabled`: false면 하단 표시에서 숨김
- `includeInTotal`: false면 세부 항목에는 표시하지만 `전체 보유 스탯 합`에는 제외

`grade` 값:

```text
special
rare
legendary
hidden
distortion
changed
limited
transcend
immortal
eternal
specialUnit
seraphim
```

`damageType` 값:

```text
physical
magical
common
```

`common`은 별도 탭을 만들지 않고 물뎀/마뎀 양쪽 필터 결과에 모두 포함한다.

숫자 스탯 컬럼은 비어 있거나 숫자 변환에 실패하면 `0`으로 처리한다. 스탯 정의에 있는데 캐릭터 시트에 아직 컬럼이 없으면 해당 스탯은 `0`으로 처리한다. `isEnabled`가 false인 캐릭터는 목록에서 제외한다.

## 도메인 모델

```ts
type Grade =
  | "special"
  | "rare"
  | "legendary"
  | "hidden"
  | "distortion"
  | "changed"
  | "limited"
  | "transcend"
  | "immortal"
  | "eternal"
  | "specialUnit"
  | "seraphim";

type DamageType = "physical" | "magical" | "common";
type DamageFilter = "physical" | "magical";

type CharacterStats = Record<string, number>;

type StatDefinition = {
  key: string;
  label: string;
  order: number;
  enabled: boolean;
  includeInTotal: boolean;
};

type Character = {
  id: string;
  nameKo: string;
  grade: Grade;
  damageType: DamageType;
  imageKey: string;
  imageUrl: string;
  sortName: string;
  stats: CharacterStats;
  isEnabled: boolean;
  updatedAt: string;
};
```

## 화면 구조

### 상단 바

상단 바는 세 영역으로 구성한다.

```text
ORDR | 물뎀/마뎀 토글 | 검색
```

- `ORDR`: 앱 식별 영역
- `물뎀/마뎀 토글`: 현재 damageType을 바꾸는 버튼
- `검색`: 현재 필터링된 목록에서 이름 검색

물뎀/마뎀 토글을 클릭하면 선택된 캐릭터 목록을 초기화하고 합계를 0으로 다시 계산한다.

### 보조 바

상단 바 아래에는 얇은 보조 바를 둔다.

- 현재 목록 개수
- 현재 선택 개수
- 선택 초기화 버튼

선택 초기화 버튼은 선택된 캐릭터가 없으면 비활성화하거나 흐리게 표시한다. 선택된 캐릭터가 있으면 클릭 시 확인 다이얼로그를 띄운 뒤 초기화한다.

### 캐릭터 그리드

캐릭터 카드는 다음 정보만 보여준다.

- 썸네일
- 이름
- 등급
- 선택 여부

카드에는 스탯 설명이나 캐릭터 상세 설명을 표시하지 않는다.

### 등급 그룹

전체 목록은 등급별 섹션으로 그룹화한다.

등급 표시 순서:

```text
전설 → 히든 → 초월 → 불멸 → 제한 → 영원 → 왜곡
```

각 등급 그룹 내부는 `sortName`이 있으면 `sortName`, 없으면 `nameKo` 기준으로 가나다순 정렬한다.

### 하단 고정 영역

하단 고정 영역은 두 부분으로 구성한다.

1. 선택된 캐릭터 미니 그리드
2. 전체 보유 스탯 합계

선택된 캐릭터 미니 그리드는 작은 썸네일과 이름만 보여준다. 선택된 캐릭터가 많아지면 가로 스크롤 또는 2줄 접힘 구조를 고려한다. 초기 버전은 1줄 가로 스크롤을 기본으로 한다.

전체 보유 스탯 합계는 선택된 캐릭터들의 각 스탯을 합산해서 보여준다.

## 상태 흐름

앱 상태:

```text
characters
damageType
searchQuery
selectedCharacterIds
loadingState
errorState
```

흐름:

1. 앱 시작 시 Google Sheets에서 캐릭터 목록을 불러온다.
2. `isEnabled`가 true인 캐릭터만 유지한다.
3. 현재 `damageType` 기준으로 목록을 필터링하되, `common` 캐릭터는 물뎀/마뎀 양쪽에 포함한다.
4. 검색어가 있으면 `nameKo` 기준으로 추가 필터링한다.
5. 등급 그룹과 가나다순 정렬을 적용한다.
6. 사용자가 카드를 선택하면 `selectedCharacterIds`에 추가하거나 제거한다.
7. 선택 목록이 바뀔 때마다 합계를 다시 계산한다.
8. 물뎀/마뎀 전환 또는 초기화 버튼으로 `selectedCharacterIds`를 비운다.

## 계산 규칙

- 동일 캐릭터는 중복 선택할 수 없다.
- 선택된 캐릭터의 숫자 스탯을 모두 합산한다.
- 숫자 변환에 실패한 값은 `0`으로 처리한다.
- 선택 목록이 비어 있으면 모든 합계는 `0`이다.
- 물뎀/마뎀 전환 시 선택 목록은 항상 초기화한다.

## 오류 및 빈 상태

### 로딩

데이터를 불러오는 동안 그리드 영역에 스켈레톤 UI를 표시한다.

### 데이터 로드 실패

Google Sheets 요청이 실패하면 오류 메시지와 다시 시도 버튼을 표시한다.

### 빈 목록

현재 damageType 또는 검색어에 해당하는 캐릭터가 없으면 빈 상태 문구를 표시한다.

### 이미지 로드 실패

이미지 로드에 실패하면 등급 색상이 적용된 이니셜 썸네일을 보여준다.

## 테스트 방향

- Google Sheets 행 파싱 테스트
- 빈 숫자 값이 0으로 변환되는지 테스트
- damageType 필터링 테스트
- 등급 그룹 정렬 테스트
- 그룹 내부 가나다순 정렬 테스트
- 선택 및 선택 해제 테스트
- 물뎀/마뎀 전환 시 선택 목록 초기화 테스트
- 초기화 버튼 동작 테스트
- 합계 계산 테스트

## 향후 확장

- Android TWA 패키징
- PWA 오프라인 캐시 강화
- 선택 목록 로컬 저장 옵션
- 등급별 디자인 효과 개선
- 스탯 상세 패널 확장 보기
- 캐릭터 이미지 CDN 또는 외부 URL 전환 옵션
