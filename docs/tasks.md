# tasks.md - 어떤 순서로 구현할까

작업 하나는 커밋 하나 이상, 세션 하나 이하 크기로 나눈다.
작업을 시작하면 상태를 "진행 중"으로, 끝나면 "완료"로 바꾸고 `progress.md`를 갱신한다.

- 상태 값: 대기 / 진행 중 / 완료 / 보류
- 담당 값: AI (어떤 AI든 가능) / 사람 (이미지 생성, 계정 연결처럼 AI가 할 수 없는 일)

## 작업 목록

### 준비

| 번호 | 작업 | 담당 | 상태 | 선행 |
|---|---|---|---|---|
| T-001 | 따라 만들 게임 확정, requirements.md 2~3장 작성 | AI | 완료 | - |
| T-002 | 원작 수치 대조, design.md 3~5장 작성, 작업 쪼개기 | AI | 완료 | T-001 |
| T-003 | 프로젝트 골격: Vite + TypeScript + Vitest + 갈무리, 빈 테이블 화면 | AI | 완료 | T-002 |
| T-004 | GitHub 저장소 만들기, Vercel 연결, README에 배포 주소 기입 | 사람 + AI | 완료 | T-003 |

### 게임 규칙 (src/game, 화면 없음, 테스트 필수)

| 번호 | 작업 | 기능 | 담당 | 상태 | 선행 |
|---|---|---|---|---|---|
| T-005 | types.ts, rules.ts, data/*.json, rng.ts, deck.ts | F1 | AI | 완료 | T-003 |
| T-006 | handEval.ts 족보 판정 | F2 | AI | 완료 | T-005 |
| T-007 | jokers.ts, scoring.ts 점수 계산 | F3, F8 | AI | 완료 | T-006 |
| T-008 | blinds.ts, economy.ts 목표 점수와 정산 | F5, F6 | AI | 완료 | T-005 |
| T-009 | shop.ts 진열, 구매, 리롤, 판매 | F7, F8 | AI | 완료 | T-005 |
| T-010 | run.ts 판 진행 (라운드, 정산, 상점, 승패) | F4, F5 | AI | 완료 | T-007, T-008, T-009 |

### 화면 (src/ui)

| 번호 | 작업 | 기능 | 담당 | 상태 | 선행 |
|---|---|---|---|---|---|
| T-011 | cardView.ts, faceArt.ts, data/faces.json | F1 | AI | 완료 | T-005 |
| T-012 | 테이블 배치, sidebar.ts, roundScreen.ts | F1, F3, F4 | AI | 완료 | T-010, T-011 |
| T-013 | cashOutScreen.ts, shopScreen.ts, jokerView.ts | F6, F7, F8 | AI | 완료 | T-012 |
| T-014 | endScreen.ts, storage/records.ts | F5, F9 | AI | 완료 | T-012 |
| T-015 | 조커 그림 변환 스크립트, public/jokers 생성 | F8 | AI | 완료 | T-013 |
| T-016 | 조커 그림 나머지 생성 (5.3 표에서 "없음"인 것) | F8 | 사람 | 완료 | - |
| T-017 | 휴대폰 화면 점검, 키보드 조작, README 실행 방법 | N8 | AI | 완료 | T-014 |

### 2차 (인계 후 작업 후보)

requirements.md 3.2의 F10~F18. 하나를 시작할 때 아래 양식으로 상세를 쓰고 번호를 T-018부터 붙인다.
그림이 필요한 작업(F12 조커 추가 등)은 그림 생성을 별도 "사람" 작업으로 나눈다.

| 번호 | 작업 | 기능 | 담당 | 상태 | 선행 |
|---|---|---|---|---|---|
| T-018 | 행성 카드: 족보 레벨, 상점 진열, 구매 즉시 레벨업 | F10 | AI | 완료 | T-017 |
| T-019 | 조커 5종 추가 (미친, 광기의, 익살스러운, 약삭빠른, 영리한) | F12 | AI | 완료 | T-017 |
| T-020 | T-019 조커 5종 그림 생성 (design.md 5.3 표에서 "없음"인 것) | F12 | 사람 | 대기 | T-019 |
| T-021 | 보스 블라인드 효과 11종 | F11 | AI | 완료 | T-018 |
| T-022 | 진행 중인 판 저장과 이어하기 | F17 | AI | 완료 | T-021 |
| T-023 | 블라인드 선택 화면, 건너뛰기와 태그 8종 | F13 | AI | 완료 | T-022 |

## 작업 상세

### T-003 프로젝트 골격

- 할 일: Vite(vanilla-ts) 설정, Vitest, `npm run dev / build / test / typecheck / art` 스크립트, design.md 2.2의 빈 폴더와 styles/ 파일, 갈무리 글꼴 연결, 펠트 바탕에 "발라트로" 제목과 하단 출처 문구만 있는 화면
- 완료 기준: `npm run build`와 `npm test`가 통과한다. 빌드 결과 `dist/`를 열면 빈 테이블이 보인다
- 건드리는 파일: package.json, tsconfig.json, vite.config.ts, index.html, src/main.ts, src/styles/*
- 테스트 방법: `npm run build`, `npm test`
- 지우거나 합친 코드: Vite 템플릿의 예제 파일(counter.ts, 로고 등)은 남기지 않는다

### T-004 배포 연결

- 할 일: (사람) GitHub에 저장소를 만들고 push, Vercel에서 저장소를 가져오기. (AI) 빌드 설정 확인, README에 주소 기입
- 완료 기준: main에 push하면 Vercel 주소에 반영된다
- 빌드 설정: Framework Vite, Build `npm run build`, Output `dist`

### T-005 기본 자료와 덱

- 할 일: design.md 3장 타입 작성. data/hands.json, blinds.json, rules.json, jokers.json 작성(requirements.md 2.1, 3.1 수치). rng.ts, deck.ts
- 완료 기준: 같은 시드로 섞으면 항상 같은 순서, 다른 시드면 다른 순서. 52장에 중복이 없다
- 테스트 방법: tests/game/rng.test.ts, deck.test.ts

### T-006 족보 판정

- 할 일: evaluateHand. 9개 족보, 점수 카드, contains 목록, 로열 표시
- 완료 기준: A-2-3-4-5 스트레이트 인정, Q-K-A-2-3 불인정. 5장 미만은 스트레이트, 플러시가 될 수 없다. 하이 카드의 점수 카드는 가장 높은 1장. 풀 하우스의 contains에 pair, three_of_a_kind, two_pair가 들어간다
- 테스트 방법: tests/game/handEval.test.ts

### T-007 점수 계산

- 할 일: jokers.ts의 효과 6종, scoring.ts의 순서(design.md 4.1)와 ScoreStep 기록
- 완료 기준: K 페어 + 조커 = 30 x 6 = 180. 추상적 조커 2장이면 각자 +6. 하프 조커는 4장 플레이 때 효과 없음
- 테스트 방법: tests/game/scoring.test.ts

### T-008 목표 점수와 정산

- 할 일: targetScore, blindReward, cashOutLines, interest
- 완료 기준: 앤티 1 빅 = 450, 앤티 8 보스 = 100000, 앤티 8 보스 보상 $8. 이자는 $24에서 $4, $25 이상에서 $5. 정산 = 보상 + 남은 핸드 x $1 + 이자
- 테스트 방법: tests/game/blinds.test.ts, economy.test.ts

### T-009 상점

- 할 일: rollOffers(조커 2장, 무작위, 이미 가진 조커도 나올 수 있음), sellValue
- 완료 기준: 판매가 = 내림(가격/2), 최소 $1. 같은 시드면 같은 진열
- 테스트 방법: tests/game/shop.test.ts

### T-010 판 진행

- 할 일: newRun, apply의 모든 Action. 라운드 시작 시 덱 전체를 새로 섞어 8장 배분. 목표 달성 즉시 정산으로, 핸드 0이면 패배, 앤티 8 보스 통과 시 승리
- 완료 기준: 정해진 시드와 행동 목록으로 한 판을 끝까지 돌리는 테스트가 통과한다. 허용되지 않는 행동은 상태를 그대로 돌려준다
- 테스트 방법: tests/game/run.test.ts

### T-011 카드 그림

- 할 일: `ui/cardView.ts`(트럼프 카드 SVG 문자열), `ui/faceArt.ts`(얼굴 카드 도트 SVG). `data/faces.json`은 이미 있다
- 참고: `art/sample/card-art-sample.html`의 `<script>`에 무늬 SVG 경로(SUITS), 무늬 배치표(PIPS), `renderCard`, `pixelRects`, `facePortrait`가 동작하는 형태로 들어 있다. 이 코드를 TypeScript로 옮기고 Card 타입(rank 2~14)에 맞춘다. 견본의 HTML과 CSS는 옮기지 않는다
- faces.json 구조: `base`(공통 색) + `robe.red|black`(옷 색, 하트/다이아는 red) + `faces["11"|"12"|"13"]`(인물별 색과 위쪽 절반 격자 28 x 22). 아래 절반은 격자를 180도 돌려 그린다. `.`은 투명
- 완료 기준: 52장 모두 오류 없이 SVG 문자열이 나온다. 무늬를 유니코드 기호 문자(U+2660~U+2667)로 쓰지 않는다
- 건드리는 파일: src/ui/cardView.ts, src/ui/faceArt.ts, src/game/rules.ts는 건드리지 않는다 (ui/faceArt.ts만 faces.json을 직접 읽는다, design.md 2.3)
- 테스트 방법: `tests/ui/cardView.test.ts`에서 52장 생성, 얼굴 카드에 rect가 들어가는지 확인. vitest 환경은 node라 DOM 없이 문자열만 검사한다

### T-012 라운드 화면

- 할 일: `main.ts`에서 `newRun(Date.now())`로 시작하고, 행동이 오면 `apply` 후 `render` 다시 호출. `ui/render.ts`가 phase별 화면을 고른다. 이번 작업은 round 화면만. `ui/dom.ts`, `ui/sidebar.ts`, `ui/screens/roundScreen.ts`
- 사이드바: 블라인드 이름, 목표 점수(`currentTarget`), 현재 점수, 마지막 플레이의 칩 x 배수, 핸드/버리기 남은 횟수, 돈, 앤티 n/8
- 놀이판: 조커 줄(그림은 T-015 전까지 이름만 적힌 빈 카드), 손패 8장(고른 카드는 위로 18px), 버튼 [플레이] [숫자순] [무늬순] [버리기], 플레이 직후 `lastScore.steps`를 한 줄씩 보여 주는 계산 과정 패널
- 버튼 비활성화: 고른 카드 0장이면 플레이와 버리기, 버리기 0번이면 버리기
- 배치와 색은 design.md 5.1, 5.4, 문구는 5.6을 따른다. 색은 tokens.css 변수만 쓴다
- 완료 기준: 브라우저에서 카드를 골라 플레이와 버리기를 반복할 수 있고, 목표를 넘기면 phase가 cash_out으로 바뀐다(이 화면은 T-013에서)
- 테스트 방법: `npm run dev`로 직접 플레이. 규칙 테스트는 이미 tests/game에 있다

### T-013 정산, 상점, 조커 카드

- 할 일: `screens/cashOutScreen.ts`(cashOut.lines 표와 [받기] 버튼 -> collect), `screens/shopScreen.ts`(진열 2칸, [사기] [다시 굴리기 $n] [다음 라운드]), `ui/jokerView.ts`(그림, 이름, 효과 설명, 가격 또는 판매가)
- 조커 줄은 round와 shop 화면 모두에 있고 [팔기 $n]과 왼쪽/오른쪽 이동 버튼이 있다 (sell, move_joker)
- 완료 기준: 정산 -> 상점 -> 다음 라운드가 끊기지 않고 이어진다. 돈이 모자라거나 칸이 차면 사기 버튼이 비활성화된다

### T-014 끝 화면과 기록

- 할 일: `screens/endScreen.ts`(won, lost), `storage/records.ts`(최고 도달 앤티, 최고 한 손 점수. localStorage 읽기/쓰기는 try/catch로 감싼다)
- 문구: design.md 5.6. 패배 화면에는 도달 앤티와 블라인드, 이번 판 최고 한 손, 역대 기록을 보여 준다
- 완료 기준: 새로고침해도 역대 기록이 남는다. [새 게임]이 동작한다

### T-017 마무리 점검

- 할 일: 가로 375px 화면에서 가로 스크롤 없이 플레이 가능한지, 키보드(Tab, Enter)로 카드 고르기와 버튼이 되는지 확인. README의 "실행 방법"과 배포 주소 갱신
- 완료 기준: 위 항목을 progress.md에 확인 결과로 남긴다

### T-015 조커 그림 변환

- 할 일: scripts/process-joker-art.mjs. art/jokers/*.png를 256 x 384로 최근접 축소하고 16색(디더링 없음)으로 정리해 public/jokers/에 저장. 배경은 지우지 않는다 (design.md D-009)
- 완료 기준: 변환한 그림을 확대해 보았을 때 외곽선이 끊기지 않고 얼굴(배경과 비슷한 색)이 지워지지 않는다
- 테스트 방법: 결과 PNG를 눈으로 확인
- 주의할 그림
  - 원본은 모두 1024 x 1536이고, 픽셀 크기가 일정하지 않은 "픽셀 아트 느낌" 그림이다. 단순 최근접 축소는 선이 끊길 수 있다
  - half_joker: 얼굴이 잘린 면에 외곽선이 없어 배경 지우기가 얼굴로 번진다. 배경색과 얼굴색의 차이(얼굴이 약간 더 밝다)로 임계값을 잡거나, 이 그림만 오른쪽 잘린 선을 경계로 처리한다
  - sly_joker: 커튼이 그림 오른쪽 끝에 닿아 있다. 커튼은 빨강이라 지워지지 않지만 결과를 확인한다
  - wrathful_joker: 얼굴 분홍 음영이 그라데이션처럼 번져 있다. 색 정리(팔레트 축소)로 단색 면으로 만든다
- sharp는 이미 devDependencies에 있다

### T-016 조커 그림 생성 (사람)

- 할 일: design.md 5.3 프롬프트로 ChatGPT에서 그림 생성, art/jokers/<id>.png로 저장, 5.3 표의 "그림" 칸 수정
- 완료 기준: 1차 조커 10종 그림이 모두 있다

### T-018 행성 카드

- 할 일
  - RunState에 `handLevels`(족보별 레벨, 처음 모두 1) 추가
  - data/planets.json(행성 9종: id, 이름, 올리는 족보, 가격 $3, 그림 색), rules.json에 상점 진열 비율 `shopWeights`(조커 20, 행성 4. 원작 비율에서 타로 제외)
  - 상점 진열 칸을 조커 id 문자열에서 `{ kind: "joker" | "planet", id }`로 바꾼다
  - 행성은 사는 즉시 해당 족보 레벨 +1 (소모품 칸 없음, design.md D-010)
  - scoring.ts: 족보 기본값 = 기본 칩 + 레벨업 칩 x (레벨 - 1), 배수도 같은 방식
  - 화면: 상점에 행성 카드(도트 행성 그림 + 족보 이름 + "레벨 n -> n+1"), 족보 미리보기와 계산 과정에 레벨 표시
- 완료 기준: 수성 2장을 산 뒤 원 페어 기본값이 10 + 15 x 2 = 40칩, 2 + 1 x 2 = 4배수. 같은 시드면 같은 진열
- 건드리는 파일: types.ts, rules.ts, shop.ts, scoring.ts, run.ts, data/planets.json, data/rules.json, ui/screens/shopScreen.ts, ui/screens/roundScreen.ts, ui/planetView.ts(새 파일)
- 테스트 방법: tests/game/scoring.test.ts, shop.test.ts, run.test.ts에 추가
- 지우거나 합친 코드: 없음

### T-019 조커 5종 추가

- 할 일: data/jokers.json에 5줄 추가. 모두 기존 효과 종류(contains_mult, contains_chips)라 코드 수정 없음 (design.md D-005)
- 수치: 위키와 대조 완료. 모두 일반 등급 $4
- 완료 기준: scoring.test.ts의 T-019 테스트 통과. 그림이 없는 동안 화면은 이름만 적힌 카드를 보여 준다
- 지우거나 합친 코드: 없음

### T-020 조커 5종 그림 (사람)

- 할 일: design.md 5.3의 공통 프롬프트와 소재로 ChatGPT에서 그림을 만들고, 기준 이미지(art/jokers/joker.png)를 함께 첨부한다. art/jokers/<id>.png로 저장한 뒤 `npm run art`를 실행하고 커밋한다
- 완료 기준: public/jokers/에 15장, 5.3 표의 "그림" 칸이 모두 "있음"

### T-021 보스 블라인드 효과

- 할 일
  - data/bosses.json: 보스 11종(id, 이름, 설명, 최소 앤티, 목표 배수, 효과). 효과 종류는 debuff_suit, debuff_face, must_play, hands, discards, halve_base, lower_level, none
  - game/bosses.ts: 보스 고르기(앤티 조건, 모든 보스가 한 번씩 나오기 전에는 반복 없음), 무효 카드 판정, 라운드 횟수 제한
  - RunState에 `boss`(이번 앤티 보스 id)와 `bossesSeen` 추가. 새 판과 앤티가 바뀔 때 고른다
  - blinds.ts targetScore에 보스 배수 반영 (벽 4배, 바늘 1배, 나머지 2배)
  - scoring.ts: 무효 카드는 족보 판정에는 들어가고 칩과 카드 반응 조커는 없음. 부싯돌은 족보 기본값 절반(반올림, 최소 1)
  - run.ts: 점쟁이는 5장일 때만 플레이, 팔은 플레이한 족보 레벨 -1(최소 1)을 점수 계산 전에 적용
  - 화면: 사이드바에 보스 이름과 효과, 무효 카드는 흐리게, 상점의 "다음" 안내에 보스 표시
- 제외: 훅(낼 때마다 손패 2장 무작위 버림). 앤티 8 전용 쇼다운 보스도 제외하고 앤티 8에서도 일반 보스를 쓴다
- 완료 기준: 각 효과별 테스트, 같은 시드면 같은 보스 순서
- 테스트 방법: tests/game/bosses.test.ts 새로, scoring.test.ts, run.test.ts에 추가
- 지우거나 합친 코드: 없음

### T-022 진행 중인 판 저장과 이어하기

- 할 일: storage/savedRun.ts(저장, 불러오기, 지우기). 행동이 상태를 바꿀 때마다 저장하고, 판이 끝나면 지운다. 시작할 때 저장된 판이 있으면 이어서 연다. 사이드바에 "새 게임"(한 번 더 확인하는 펼침 메뉴)
- 저장 형식: `{ version, state }`. RunState 모양이 바뀌면 SAVE_VERSION을 올린다. 버전이 다르거나 모양이 맞지 않으면 버리고 새 판을 연다
- 완료 기준: 새로고침해도 같은 손패와 점수에서 이어진다. 저장소가 막힌 환경에서도 게임은 돌아간다
- 테스트 방법: tests/storage/savedRun.test.ts (localStorage 대역을 넣어 검사)
- 지우거나 합친 코드: 없음

### T-023 블라인드 선택, 건너뛰기와 태그

- 흐름: 새 판과 상점 다음에 phase "blind_select"가 온다. "선택"(select_blind)하면 라운드, "건너뛰기"(skip_blind, 스몰과 빅만)하면 그 블라인드의 태그를 받고 다음 블라인드 선택으로 넘어간다
- 손패는 블라인드 선택 화면에 들어갈 때 미리 나눠 두고, 선택하면 phase만 round로 바꾼다 (round는 항상 유효한 값으로 남는다)
- 태그: 앤티가 바뀔 때 스몰, 빅에 하나씩 무작위로 정한다(최소 앤티 조건). data/tags.json 8종
  - 즉시: 경제(돈 두 배, 최대 +$40), 손재주(낸 핸드 1번마다 $1), 쓰레기(쓰지 않은 버리기 1번마다 $1), 속도(건너뛴 블라인드 1개마다 $5)
  - 보관 후 발동: 투자(보스를 이기면 정산에 $25), 쿠폰(다음 상점의 처음 진열 무료), 주사위(다음 상점 다시 굴리기 $0부터), 저글링(다음에 선택한 라운드 손패 +3장)
- RunState: blindTags, tags(보관 중), stats.skips, stats.unusedDiscards(라운드를 이길 때 남은 버리기를 더한다). ShopOffer에 price(덮어쓰는 가격) 추가. 저장 형식이 바뀌므로 SAVE_VERSION 2
- 화면: screens/blindSelectScreen.ts(블라인드 3개, 목표, 보상, 태그, 보스 효과), 사이드바에 보관 중인 태그
- 완료 기준: 태그별 테스트, 건너뛰기 후 다음 블라인드로, 보스는 건너뛸 수 없음
- 테스트 방법: tests/game/tags.test.ts 새로, run.test.ts 수정(새 판이 blind_select로 시작)
- 지우거나 합친 코드: 없음

### 작업 상세 작성 양식

```
### T-000 작업 이름

- 할 일:
- 완료 기준:
- 건드리는 파일:
- 테스트 방법:
- 지우거나 합친 코드: (없으면 "없음")
```
