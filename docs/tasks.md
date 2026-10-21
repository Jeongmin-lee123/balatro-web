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
| T-004 | GitHub 저장소 만들기, Vercel 연결, README에 배포 주소 기입 | 사람 + AI | 대기 | T-003 |

### 게임 규칙 (src/game, 화면 없음, 테스트 필수)

| 번호 | 작업 | 기능 | 담당 | 상태 | 선행 |
|---|---|---|---|---|---|
| T-005 | types.ts, rules.ts, data/*.json, rng.ts, deck.ts | F1 | AI | 완료 | T-003 |
| T-006 | handEval.ts 족보 판정 | F2 | AI | 완료 | T-005 |
| T-007 | jokers.ts, scoring.ts 점수 계산 | F3, F8 | AI | 완료 | T-006 |
| T-008 | blinds.ts, economy.ts 목표 점수와 정산 | F5, F6 | AI | 완료 | T-005 |
| T-009 | shop.ts 진열, 구매, 리롤, 판매 | F7, F8 | AI | 완료 | T-005 |
| T-010 | run.ts 판 진행 (라운드, 정산, 상점, 승패) | F4, F5 | AI | 대기 | T-007, T-008, T-009 |

### 화면 (src/ui)

| 번호 | 작업 | 기능 | 담당 | 상태 | 선행 |
|---|---|---|---|---|---|
| T-011 | cardView.ts, faceArt.ts, data/faces.json | F1 | AI | 대기 | T-005 |
| T-012 | 테이블 배치, sidebar.ts, roundScreen.ts | F1, F3, F4 | AI | 대기 | T-010, T-011 |
| T-013 | cashOutScreen.ts, shopScreen.ts, jokerView.ts | F6, F7, F8 | AI | 대기 | T-012 |
| T-014 | endScreen.ts, storage/records.ts | F5, F9 | AI | 대기 | T-012 |
| T-015 | 조커 그림 변환 스크립트, public/jokers 생성 | F8 | AI | 대기 | T-013 |
| T-016 | 조커 그림 나머지 생성 (5.3 표에서 "없음"인 것) | F8 | 사람 | 완료 | - |
| T-017 | 휴대폰 화면 점검, 키보드 조작, README 실행 방법 | N8 | AI | 대기 | T-014 |

### 2차 (인계 후 작업 후보)

requirements.md 3.2의 F10~F18. 하나를 시작할 때 아래 양식으로 상세를 쓰고 번호를 T-018부터 붙인다.
그림이 필요한 작업(F12 조커 추가 등)은 그림 생성을 별도 "사람" 작업으로 나눈다.

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
- 완료 기준: 안테 1 빅 = 450, 안테 8 보스 = 100000, 안테 8 보스 보상 $8. 이자는 $24에서 $4, $25 이상에서 $5. 정산 = 보상 + 남은 핸드 x $1 + 이자
- 테스트 방법: tests/game/blinds.test.ts, economy.test.ts

### T-009 상점

- 할 일: rollOffers(조커 2장, 무작위, 이미 가진 조커도 나올 수 있음), sellValue
- 완료 기준: 판매가 = 내림(가격/2), 최소 $1. 같은 시드면 같은 진열
- 테스트 방법: tests/game/shop.test.ts

### T-010 판 진행

- 할 일: newRun, apply의 모든 Action. 라운드 시작 시 덱 전체를 새로 섞어 8장 배분. 목표 달성 즉시 정산으로, 핸드 0이면 패배, 안테 8 보스 통과 시 승리
- 완료 기준: 정해진 시드와 행동 목록으로 한 판을 끝까지 돌리는 테스트가 통과한다. 허용되지 않는 행동은 상태를 그대로 돌려준다
- 테스트 방법: tests/game/run.test.ts

### T-015 조커 그림 변환

- 할 일: scripts/process-joker-art.mjs. art/jokers/*.png를 읽어 바깥 배경(크림색)을 가장자리부터 지우고, 71 x 95 안에 비율을 지켜 넣고, 색을 정리해 public/jokers/에 저장
- 완료 기준: 변환한 그림을 확대해 보았을 때 외곽선이 끊기지 않고 얼굴(배경과 비슷한 색)이 지워지지 않는다
- 테스트 방법: 결과 PNG를 눈으로 확인

### T-016 조커 그림 생성 (사람)

- 할 일: design.md 5.3 프롬프트로 ChatGPT에서 그림 생성, art/jokers/<id>.png로 저장, 5.3 표의 "그림" 칸 수정
- 완료 기준: 1차 조커 10종 그림이 모두 있다

### 작업 상세 작성 양식

```
### T-000 작업 이름

- 할 일:
- 완료 기준:
- 건드리는 파일:
- 테스트 방법:
- 지우거나 합친 코드: (없으면 "없음")
```
