# design.md - 어떤 구조로 만들까

- 문서 상태: 1차 확정 (2026-10-21, T-002)
- 관련 문서: 요구사항은 `requirements.md`, 작업 순서는 `tasks.md`

이 문서에 없는 파일, 폴더, 공개 함수를 새로 만들 때는 먼저 이 문서를 고친다.

---

## 1. 기술 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 언어 | TypeScript (strict) | 타입이 규칙 역할을 해서, 다른 AI가 이어받아도 자료 형태를 멋대로 바꾸기 어렵다 |
| 빌드 | Vite | 파일을 나눠 개발해도 결과는 정적 파일 한 묶음. Vercel과 GitHub Pages 모두 그대로 올라간다 |
| 화면 | DOM + 인라인 SVG | 카드 게임은 움직임이 적다. DOM이면 버튼, 접근성, 반응형을 브라우저가 해 준다 |
| 프레임워크 | 사용하지 않음 | 화면은 "상태 하나를 통째로 다시 그리는" 구조라 프레임워크 이점이 작다 |
| 테스트 | Vitest | `src/game/` 규칙을 화면 없이 검증 |
| 글꼴 | 갈무리 (npm `galmuri`, SIL OFL) | 한글 픽셀 글꼴. 원작 글꼴은 쓰지 않는다 |
| 그림 처리 | sharp (개발 의존성) | 조커 원본 그림을 카드 크기로 줄이고 배경을 지우는 스크립트에만 쓴다 |
| 배포 | Vercel (기본), GitHub Pages (대안) | main 브랜치에 푸시하면 자동 배포 |

## 2. 폴더 구조와 책임

### 2.1 표준 구조와의 대응

| 표준 구조 | 이 프로젝트 | 책임 |
|---|---|---|
| `app.py` (창과 버튼) | `src/main.ts`, `src/ui/` | 그리기, 입력 받기, 게임 규칙 호출 |
| `inventory.py` (대여, 반납, 저장) | `src/game/`, `src/storage/` | 게임 규칙 / 기록 저장을 분리 |
| `data/equipment.json` | `data/` | 족보 수치, 블라인드, 규칙값, 조커 목록, 얼굴 카드 도트 |
| `docs/` 4개 문서 | `docs/` 4개 문서 | 동일 |

### 2.2 전체 트리

```
src/
├─ main.ts               진입점. 판 상태를 만들고, 행동이 오면 상태를 바꾸고 다시 그린다
├─ game/                 게임 규칙. DOM, window, localStorage를 쓰지 않는다
│  ├─ types.ts           모든 자료형 (3장)
│  ├─ rules.ts           data/*.json을 읽어 타입을 붙여 내보낸다. JSON을 직접 import하는 곳은 여기뿐
│  ├─ rng.ts             시드 난수 (mulberry32). 상태에 시드값을 넣어 재현 가능하게
│  ├─ deck.ts            52장 생성, 섞기, 뽑기, 정렬
│  ├─ handEval.ts        족보 판정, 점수 카드 고르기, "포함" 족보 목록
│  ├─ scoring.ts         점수 계산과 계산 과정 기록
│  ├─ jokers.ts          조커 효과 종류별 함수
│  ├─ blinds.ts          목표 점수, 블라인드 보상
│  ├─ bosses.ts          보스 고르기, 무효 카드, 라운드 횟수 제한
│  ├─ economy.ts         라운드 정산 (보상, 남은 핸드, 이자)
│  ├─ shop.ts            진열, 구매, 리롤, 판매
│  ├─ tags.ts            블라인드 태그 고르기, 즉시 지급 금액, 보관 태그 꺼내기
│  ├─ tarots.ts          타로 사용 조건과 효과 (손패와 판 전체 덱을 함께 바꾼다)
│  └─ run.ts             한 판의 상태 전이. apply(state, action) -> state
├─ ui/
│  ├─ render.ts          상태의 phase를 보고 알맞은 화면 함수를 부른다
│  ├─ dom.ts             요소 생성, 이벤트 연결 공용 도구
│  ├─ cardView.ts        트럼프 카드 SVG
│  ├─ faceArt.ts         얼굴 카드 도트 SVG
│  ├─ jokerView.ts       조커 카드 (그림 + 설명)
│  ├─ planetView.ts      행성 카드 (색 하나로 만드는 도트 행성)
│  ├─ tarotView.ts       타로 카드(로마 숫자 글자 카드)와 소모품 칸
│  ├─ sidebar.ts         블라인드, 점수, 핸드/버리기 횟수, 돈, 앤티
│  └─ screens/
│     ├─ blindSelectScreen.ts 블라인드 3개 중 선택 또는 건너뛰기
│     ├─ roundScreen.ts  손패 선택, 플레이, 버리기, 정렬, 점수 계산 과정
│     ├─ cashOutScreen.ts 라운드 정산
│     ├─ shopScreen.ts   상점
│     └─ endScreen.ts    승리, 패배
├─ storage/
│  ├─ records.ts         최고 기록 읽기, 쓰기 (localStorage)
│  └─ savedRun.ts        진행 중인 판 저장, 불러오기 (버전 번호가 다르면 버린다)
└─ styles/
   ├─ fonts.css          갈무리 글꼴 3개 연결 (패키지 CSS 전체를 쓰지 않는다)
   ├─ tokens.css         색, 글꼴, 간격 변수
   ├─ base.css           기본 요소
   ├─ layout.css         테이블, 사이드바 배치
   └─ components.css     카드, 버튼, 패널
data/
├─ hands.json            족보별 기본 칩, 배수 (레벨업 값 포함, F10 대비)
├─ blinds.json           앤티별 기본 점수, 블라인드 배수와 보상
├─ rules.json            손패 수, 핸드, 버리기, 조커 칸, 이자, 리롤 값
├─ jokers.json           조커 목록 (id, 이름, 가격, 설명, 효과 종류와 값)
├─ planets.json          행성 9종 (id, 이름, 올리는 족보, 가격, 그림 색)
├─ bosses.json           보스 12종 (id, 이름, 설명, 최소 앤티, 목표 배수, 효과)
├─ tags.json             태그 8종 (id, 이름, 설명, 최소 앤티, 효과)
├─ tarots.json           타로 20종 (id, 이름, 로마 숫자, 가격, 설명, 효과)
└─ faces.json            J, Q, K 도트 격자와 팔레트
public/
└─ jokers/<id>.png       처리된 조커 그림 (256 x 384, 16색, 배경 그대로)
art/
├─ jokers/<id>.png       ChatGPT로 만든 원본 그림. 지우지 않는다
└─ sample/              그림 방식을 정할 때 쓴 견본 페이지 (배포 대상 아님)
scripts/
└─ process-joker-art.mjs art/ -> public/ 변환
tests/
├─ game/*.test.ts        src/game/ 파일마다 하나, cards.ts는 테스트 공용 도구
└─ ui/*.test.ts          DOM 없이 검사할 수 있는 화면 함수 (SVG 문자열 등)
```

### 2.3 의존 방향

화살표 방향으로만 import 한다. 반대 방향 import는 리뷰에서 반려한다.

```
main.ts -> ui/ -> game/
main.ts -> storage/ -> game/types.ts
game/*.ts -> game/rules.ts -> data/*.json
ui/ 는 data/ 를 직접 읽지 않는다 (faces.json 제외, ui/faceArt.ts만 읽는다)
```

## 3. 데이터 모델

`src/game/types.ts`에 둔다. 아래는 1차에 필요한 형태다.

```ts
type Suit = "spades" | "hearts" | "clubs" | "diamonds";
type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

interface Card { id: string; rank: Rank; suit: Suit; enhancement?: Enhancement }   // id 예: "hearts-13", 강화는 F15

type HandType =
  | "high_card" | "pair" | "two_pair" | "three_of_a_kind" | "straight"
  | "flush" | "full_house" | "four_of_a_kind" | "straight_flush";

interface HandResult {
  type: HandType;
  scoringCards: Card[];        // 점수에 들어가는 카드만, 플레이한 순서대로
  contains: HandType[];        // 플레이한 카드 안에 들어 있는 모든 족보
  isRoyal: boolean;            // 표시용
}

type JokerEffect =
  | { kind: "flat_mult"; mult: number }
  | { kind: "suit_mult"; suit: Suit; mult: number }
  | { kind: "contains_mult"; hand: HandType; mult: number }
  | { kind: "contains_chips"; hand: HandType; chips: number }
  | { kind: "small_hand_mult"; maxCards: number; mult: number }
  | { kind: "per_joker_mult"; mult: number };

interface JokerDef { id: string; name: string; price: number; description: string; effect: JokerEffect }
interface OwnedJoker { uid: string; defId: string; paid: number }  // 같은 조커를 두 장 가질 수 있어 uid를 따로 둔다

interface ScoreStep { source: string; chips: number; mult: number; xMult?: number; note: string }  // 화면의 계산 과정 한 줄, xMult는 곱하기
interface ScoreResult { hand: HandResult; chips: number; mult: number; total: number; steps: ScoreStep[]; money: number; shattered: string[] }

type Phase = "blind_select" | "round" | "cash_out" | "shop" | "won" | "lost";

interface RunState {
  seed: number; rngState: number;
  phase: Phase;
  ante: number;                 // 1..8
  blindIndex: 0 | 1 | 2;        // 스몰, 빅, 보스
  money: number;
  jokers: OwnedJoker[];
  deck: Card[]; consumables: string[]; lastTarot: string | null;   // 판 전체 덱, 소모품 칸, 바보용 (F14)
  handLevels: Record<HandType, number>;   // 족보 레벨, 처음 모두 1 (F10)
  boss: string; bossesSeen: string[];     // 이번 앤티 보스, 이번 판에 나온 보스 (F11)
  blindTags: string[]; tags: string[];    // 스몰, 빅 건너뛰기 태그, 보관 중인 태그 (F13)
  round: { drawPile: Card[]; hand: Card[]; selected: string[]; handsLeft: number; discardsLeft: number;
           score: number; lastScore: ScoreResult | null; sortBy: "rank" | "suit" };
  cashOut: { lines: { label: string; amount: number }[]; total: number } | null;
  shop: { offers: ({ kind: "joker" | "tarot" | "planet"; id: string; price?: number } | null)[]; rerollCost: number } | null;   // 산 칸은 null
  stats: { bestHand: number; handsPlayed: number };
}

type Action =
  | { type: "toggle_card"; cardId: string } | { type: "play" } | { type: "discard" }
  | { type: "sort"; by: "rank" | "suit" } | { type: "collect" }      // 정산 확인 -> 상점
  | { type: "buy"; slot: number } | { type: "sell"; uid: string } | { type: "reroll" }
  | { type: "move_joker"; uid: string; to: number } | { type: "next_round" } | { type: "new_run"; seed?: number };
```

규칙
- 상태는 바꾸지 않고 새로 만든다. `apply`는 같은 입력에 항상 같은 결과를 낸다 (N9).
- 허용되지 않는 행동(돈이 모자란 구매, 0장 플레이 등)은 상태를 그대로 돌려준다. 화면은 미리 버튼을 비활성화한다.
- 금액, 점수는 모두 정수다.

## 4. 모듈별 공개 함수

여기에 없는 함수를 다른 파일에서 쓰고 싶으면 이 표에 먼저 추가한다. 파일 안에서만 쓰는 함수는 export 하지 않는다.

| 파일 | 공개 함수 |
|---|---|
| rng.ts | `nextRandom(state): [value, nextState]`, `shuffle(items, state): [items, nextState]` |
| rules.ts | `HANDS`, `HAND_TYPES`, `BLINDS`, `RULES`, `JOKERS`(id로 찾기), `JOKER_IDS`, `TAROTS`, `TAROT_IDS`, `PLANETS`, `PLANET_IDS`, `BOSSES`, `BOSS_LIST`, `TAGS`, `TAG_LIST`, `ANTE_COUNT` |
| deck.ts | `SUITS`, `SUIT_NAMES`, `createDeck(): Card[]`, `drawCards(pile, count): { drawn, rest }`, `sortHand(cards, by): Card[]`, `rankLabel(rank)`, `cardLabel(card)` |
| handEval.ts | `evaluateHand(cards): HandResult` |
| scoring.ts | `scoreHand(cards, jokerDefs, levels?, rules?): ScoreResult` (rules: 무효 카드 판정, 기본값 절반), `handBase(type, level)`, `cardChips(card)`, `handName(hand)` |
| jokers.ts | `onCardScored(effect, card): JokerGain \| null`, `onIndependent(effect, ctx): JokerGain \| null` |
| blinds.ts | `targetScore(ante, blindIndex, bossMultiplier?): number`, `blindReward(ante, blindIndex): number`, `blindName(blindIndex): string`, `nextBlind(ante, blindIndex)` |
| bosses.ts | `bossDef(id)`, `pickBoss(rngState, ante, seen)`, `isDebuffed(effect, card)`, `roundLimits(effect)`, `canPlayCount(effect, count)` |
| economy.ts | `cashOutLines({ ante, blindIndex, handsLeft, money }): CashOut`, `interest(money): number` |
| shop.ts | `rollOffers(rngState, count): [ShopOffer[], nextState]`, `offerPrice(offer)`, `sellValue(paid): number` |
| run.ts | `newRun(seed): RunState`, `apply(state, action): RunState`, `currentTarget(state)`, `jokerDefs(owned)`, `canBuy(state, slot)`, `canPlay(state)`, `activeBoss(state)` |
| records.ts | `loadRecords(): Records`, `saveRun(state): Records` |
| tarots.ts | `tarotDef(id)`, `targetRange(effect)`, `canUseTarot(state, index)`, `useTarot(state, index)` |
| tags.ts | `tagDef(id)`, `pickBlindTags(rngState, ante)`, `instantMoney(effect, state)`, `takeTags(held, kind)` |
| savedRun.ts | `loadSavedRun(): RunState | null`, `storeRun(state)`, `clearSavedRun()`, `SAVE_VERSION` |

### 4.1 점수 계산 순서 (scoring.ts)

원작 순서를 따른다. 조커 순서가 결과를 바꾸므로 반드시 이 순서를 지킨다.

1. 족보 기본 칩, 기본 배수 (레벨이 오른 만큼 data/hands.json의 레벨업 값을 더한다)
2. 점수 카드를 왼쪽부터 하나씩 (보스가 무효로 만든 카드는 칩도 조커 반응도 없이 넘어간다): 카드 칩을 더하고, 그 카드에 반응하는 조커(`onCardScored`)를 왼쪽 조커부터 적용
3. 손에 들고 있는 강철 카드마다 배수 x1.5
4. 조커를 왼쪽부터 하나씩 독립 효과(`onIndependent`) 적용
5. 단계를 위에서부터 차례로 누적한다: 칩과 배수는 더하고, xMult가 있으면 그때까지의 배수에 곱한다. 총점 = 칩 x 배수 (내림)

각 단계는 `ScoreStep` 한 줄로 남겨 화면에 그대로 보여 준다.

### 4.2 조커 추가 방법

- 기존 효과 종류로 되는 조커: `data/jokers.json`에 한 항목만 추가한다. 코드 수정 없음.
- 새 효과 종류가 필요한 조커: `types.ts`의 `JokerEffect`에 종류를 추가하고, `jokers.ts`에 함수를 추가하고, 테스트를 추가한다.
- 그림: `art/jokers/<id>.png`에 원본을 넣고 `npm run art`를 실행한다. 그림이 없으면 화면은 이름만 적힌 빈 카드를 그린다.

## 5. 화면과 디자인 규칙

### 5.1 화면 배치

원작의 배치를 따른다.

```
데스크톱 (가로 900px 이상)
┌──────────┬────────────────────────────────────┐
│ 사이드바  │  조커 줄 (최대 5칸)                   │
│ 블라인드  │                                    │
│ 목표 점수 │  점수 계산 과정 (플레이 직후)           │
│ 현재 점수 │                                    │
│ 칩 x 배수 │  손패 8장 (고른 카드는 위로)           │
│ 핸드/버리기│  [플레이] [정렬: 숫자 무늬] [버리기]    │
│ 돈, 앤티  │                                    │
└──────────┴────────────────────────────────────┘

휴대폰 (가로 900px 미만)
사이드바가 위쪽 띠로 접힌다. 손패는 겹쳐서 한 줄에 8장을 놓는다.
```

### 5.2 그림

| 대상 | 방식 | 위치 |
|---|---|---|
| 숫자 카드, A | 무늬 SVG 경로 4개 + 무늬 배치표로 생성 | `ui/cardView.ts` |
| J, Q, K | 28 x 22 도트 격자를 그리고 180도 돌려 붙임. 옷 색만 무늬 색에 따라 바꿈 | `data/faces.json`, `ui/faceArt.ts` |
| 조커 | ChatGPT로 만든 그림(1024 x 1536)을 256 x 384로 최근접 축소, 16색으로 정리. 배경은 지우지 않고 카드 바탕으로 쓴다 (D-009) | `art/jokers/`, `public/jokers/` |
| 배경, 패널, 버튼 | CSS | `styles/` |

무늬를 유니코드 기호 문자(U+2660~U+2667)로 쓰지 않는다. 일부 기기에서 이모지로 바뀌어 보이기 때문이다.

### 5.3 조커 그림 프롬프트

조커를 추가하는 사람은 ChatGPT에 아래 공통 문장과 소재 한 줄을 함께 넣는다.
첫 조커 그림(`art/jokers/joker.png`)을 기준 이미지로 항상 첨부한다.

```
트럼프 카드 게임에 들어갈 조커 카드 한 장의 그림을 그려줘.
- 세로 2:3 비율, 카드 한 장을 그림이 꽉 채움
- 16비트 시절 게임 같은 픽셀 아트. 가로 약 71픽셀짜리 그림을 확대한 것처럼 픽셀이 크게 보이게
- 1픽셀 두께의 짙은 외곽선(#1d1b22), 단색 면 채색, 그라데이션과 안티에일리어싱 없음
- 전체 색은 8색 이내
- 배경은 크림색(#f3ebdb) 단색. 카드 테두리, 글자, 숫자, 서명은 넣지 말 것
- 첨부한 기준 이미지가 있으면 그것과 같은 화풍, 같은 외곽선 굵기, 같은 색감으로

소재: (조커별 한 줄)
```

조커 소재 (1차 10종 + T-019 5종)

| id | 소재 | 그림 |
|---|---|---|
| joker | 빨강과 파랑으로 반씩 나뉜 두 갈래 광대 모자를 쓰고, 이를 드러내며 활짝 웃는 광대의 얼굴. 모자 끝마다 금색 방울. | 있음 |
| greedy_joker | 빨간 다이아몬드 모양 보석 더미를 두 팔로 꽉 끌어안고, 눈을 가늘게 뜬 채 군침을 흘리는 광대. | 있음 |
| lusty_joker | 한쪽 눈을 찡긋하며 손키스를 날리는 광대. 주변에 빨간 하트 모양 서너 개가 떠 있음. | 있음 |
| wrathful_joker | 얼굴이 시뻘개지고 머리 위로 김이 솟는 화난 광대. 한 손에 검은 스페이드 모양 방패를 들고 있음. | 있음 |
| gluttonous_joker | 클로버 모양 초록 쿠키를 입에 잔뜩 넣어 양 볼이 터질 듯 부푼 광대. 손에 쿠키 하나를 더 들고 있음. | 있음 |
| jolly_joker | 똑같이 생긴 광대 두 명이 어깨동무를 하고 입을 크게 벌려 웃는 모습. | 있음 |
| zany_joker | 몸 하나 위에 광대 얼굴 세 개가 토템처럼 쌓여 있고, 세 얼굴이 각자 다른 방향을 보며 엉뚱한 표정을 짓는 모습. | 있음 |
| sly_joker | 커튼 뒤에서 몸을 반쯤 내밀고 음흉하게 웃는 광대. 등 뒤로 숫자가 같은 카드 두 장을 몰래 쥐고 있음. | 있음 |
| half_joker | 세로로 정확히 반만 그려진 광대. 왼쪽 절반만 있고 오른쪽 절반은 깔끔하게 잘려 배경만 보임. | 있음 |
| abstract_joker | 원, 삼각형, 사각형 도형 조각만으로 짜 맞춘 광대 얼굴. 입체파 그림처럼 조각마다 색이 다름. | 있음 |
| mad_joker | 양손에 같은 숫자 카드 두 쌍을 쥐고, 눈이 뱅글뱅글 돌아간 채 고함을 지르는 광대. | 있음 |
| crazy_joker | 계단처럼 한 칸씩 높아지는 카드 다섯 장 위를 뛰어오르며 미친 듯이 웃는 광대. | 없음 |
| droll_joker | 같은 무늬 카드 다섯 장을 부채처럼 펼쳐 얼굴 아래쪽을 가리고 키득거리는 광대. | 없음 |
| wily_joker | 소매 속에서 같은 숫자 카드 세 장을 몰래 꺼내며 한쪽 눈썹을 치켜올린 광대. | 없음 |
| clever_joker | 동그란 안경을 쓰고, 칠판에 붙인 카드 두 쌍을 지시봉으로 가리키는 광대. | 없음 |

그림을 추가하면 이 표의 "그림" 칸을 고친다.

### 5.4 색과 글꼴

`src/styles/tokens.css`에 변수로 둔다. 컴포넌트 CSS에 색 값을 직접 쓰지 않는다.

| 변수 | 값 | 쓰임 |
|---|---|---|
| --felt / --felt-deep | #2c5a4d / #1f443a | 테이블 바탕 |
| --panel / --panel-line | #1b2326 / #33413f | 사이드바, 패널 |
| --ink / --muted | #efe7d6 / #a7b6ae | 글자 |
| --card / --card-edge | #f3ebdb / #c7b99d | 카드 바탕, 테두리 |
| --suit-red / --suit-black | #c23b2e / #24262c | 무늬 |
| --chips / --mult | #2f7fd0 / #d6452f | 칩은 파랑, 배수는 빨강 (원작 약속) |
| --money | #e1b03f | 돈 |

글꼴은 갈무리 하나만 쓴다. 숫자는 `font-variant-numeric: tabular-nums`로 자리를 맞춘다.

### 5.5 금지 목록

- 이모지
- 의미 없는 보라색/파란색 그라데이션, 반짝임, 유리 효과
- 모든 요소에 같은 둥근 모서리와 그림자를 준 카드 나열
- "지금 바로 도전하세요!", "궁극의", "손쉽게" 같은 광고 문구
- 게임 화면보다 큰 소개 영역, 아이콘 3개짜리 기능 소개
- 무늬를 유니코드 기호 문자(U+2660~U+2667)로 쓰는 것

### 5.6 문구 원칙

- 버튼은 짧은 동사형: "플레이", "버리기", "다시 굴리기", "다음 라운드", "새 게임"
- 숫자 앞에 단위를 붙인다: "$4", "핸드 3", "버리기 2"
- 승패 안내는 결과와 다음 행동만: "앤티 3 보스 블라인드에서 끝났습니다. 새 게임을 눌러 다시 시작하세요."
- 화면 하단에 "Balatro(LocalThunk) 비공식 팬 제작. 원작 그림과 소리는 쓰지 않았습니다."를 표기한다.

## 6. 결정 기록

구조를 바꾸는 결정은 여기에 추가한다. 지우지 않고 아래로 쌓는다.

| 번호 | 날짜 | 결정 | 이유 |
|---|---|---|---|
| D-001 | 2026-10-21 | 문서를 requirements / design / tasks / progress 4개로 고정 | 과제 표준 구조. 문서가 늘어나면 어디를 봐야 할지 흐려진다 |
| D-002 | 2026-10-21 | AI 지침은 AGENTS.md 한 곳에 두고 CLAUDE.md는 불러오기만 | Codex, Copilot도 AGENTS.md를 읽으므로 규칙이 갈라지지 않는다 |
| D-003 | 2026-10-21 | TypeScript + Vite, 프레임워크 없음, DOM + SVG | 1장 참고 |
| D-004 | 2026-10-21 | 트럼프 카드는 코드로 생성, 얼굴 카드는 텍스트 도트 격자, 조커만 ChatGPT 그림 | 코드로 그린 조커는 "AI 티"가 난다는 판단(사용자). 카드와 얼굴은 텍스트라 diff와 인계가 쉽다 |
| D-005 | 2026-10-21 | 조커 효과는 "효과 종류 + 값"으로 data/jokers.json에 둔다 | 같은 종류 조커는 데이터 한 줄로 추가되어 2차 작업(F12)이 작아진다 |
| D-006 | 2026-10-21 | 판 진행은 `apply(state, action)` 하나로만 바꾼다 | 화면과 규칙이 섞이지 않고, 시드와 행동 목록만으로 버그를 재현할 수 있다 |
| D-007 | 2026-10-21 | 버리기 기본값 3 (레드 덱 보너스 없음) | 덱 선택을 만들지 않으므로 원작 기본 규칙을 쓴다 |
| D-008 | 2026-10-21 | 기본 브랜치 이름을 main으로 | Vercel, GitHub 기본값과 맞춘다 |
| D-009 | 2026-10-21 | 조커 그림은 배경을 지우지 않고 2:3 비율 그대로 쓴다 | 원본 배경(240,229,205)과 얼굴색(245,235,217)이 거의 같아 배경을 지우면 얼굴도 지워진다. 원본 비율이 2:3이라 자를 필요도 없다 |
| D-010 | 2026-10-21 | 행성 카드는 사는 즉시 족보 레벨을 올린다. 소모품 칸은 만들지 않는다 | 원작은 소모품 칸에 보관했다가 쓰지만, 타로(F14)가 없는 지금은 보관할 이유가 없다. F14를 만들 때 소모품 칸을 함께 도입한다 |
| D-011 | 2026-10-21 | 보스는 앤티가 바뀔 때 하나 고르고, 효과는 data/bosses.json의 종류 + 값으로 둔다. 앤티 8 전용 쇼다운 보스는 제외 (훅은 T-024에서 추가) | 조커와 같은 방식이라 보스 추가가 데이터 한 줄이 된다. 훅은 무작위 버림 처리가 따로 필요해 다음 작업으로 미룬다 |
| D-012 | 2026-10-21 | 진행 중인 판은 행동마다 RunState를 통째로 저장하고, 형식이 바뀌면 SAVE_VERSION을 올려 이전 저장을 버린다 | RunState가 순수 데이터라 변환 코드가 필요 없다. 옛 저장을 새 모양으로 옮기는 코드는 지금 규모에서 유지 비용이 더 크다 |
| D-013 | 2026-10-21 | 블라인드 선택 화면에 들어갈 때 손패를 미리 나눠 두고, 선택은 phase만 바꾼다. 저글링 태그만 선택 시점에 카드를 더 뽑는다 | round가 항상 유효한 값이라 화면과 저장이 단순해진다. 건너뛰기는 손패를 버리고 다음 블라인드의 손패를 새로 나눈다 |
| D-014 | 2026-10-21 | 덱을 판 전체 상태(RunState.deck)로 두고 라운드마다 이 덱을 섞는다. 카드 id는 처음 이름을 유지한다 | 타로와 카드 강화(F15)가 바꾼 카드가 다음 라운드에도 남아야 한다. id를 바꾸지 않으면 손패와 덱의 같은 카드를 쉽게 찾는다 |
| D-015 | 2026-10-21 | 타로 카드 그림은 로마 숫자와 이름을 쓴 글자 카드로 시작한다 | 조커처럼 ChatGPT 그림을 넣을 수 있지만 사람 작업이 필요하다. 글자 카드만으로도 구분이 된다 |
| D-016 | 2026-10-21 | 점수는 단계 순서대로 누적한다 (더하기 다음 곱하기가 순서에 따라 결과가 달라진다) | 유리(x2), 강철(x1.5) 같은 곱하기 효과가 원작처럼 순서에 따라 다르게 계산되어야 한다. 덧셈만 있을 때는 예전 방식과 결과가 같다 |
