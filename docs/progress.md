# progress.md - 지금 어디까지 했나

다른 AI나 사람이 이어받을 때 가장 먼저 읽는 파일이다.
작업이 끝날 때마다 "현재 상태"와 "다음 할 일"을 고치고, "작업 기록"에 한 줄을 추가한다.

## 현재 상태 (2026-10-21 인계 시점)

- 단계: 게임 규칙 완료, 화면 구현 전
- 대상 게임: 발라트로 (Balatro). 규칙과 수치는 requirements.md 2.1 (위키 대조 완료)
- 배포 주소: 없음 (T-004 대기)
- 테스트: `npm test` 82개 통과, `npm run typecheck` 오류 없음, `npm run build` 성공

| 영역 | 상태 | 비고 |
|---|---|---|
| 문서 (requirements, design, tasks) | 완료 | 2차 기능은 requirements.md 3.2 |
| 게임 규칙 `src/game/` (T-005 ~ T-010) | 완료 | 화면 없이 테스트로 검증됨 |
| 고정 자료 `data/` | 완료 | hands, blinds, rules, jokers, faces |
| 조커 원본 그림 `art/jokers/` (T-016) | 완료 | 10장 모두 |
| 화면 `src/ui/` (T-011 ~ T-014) | 시작 전 | main.ts는 빈 테이블만 그린다 |
| 조커 그림 변환 (T-015) | 시작 전 | |
| 배포 (T-004) | 시작 전 | 사람이 GitHub, Vercel 계정을 연결해야 한다 |

## 다음 할 일

순서대로 하면 된다. 각 작업의 상세(할 일, 완료 기준, 주의점)는 tasks.md "작업 상세"에 있다.

1. **T-011 카드 그림**: `art/sample/card-art-sample.html`의 스크립트를 TypeScript로 옮긴다. 얼굴 격자는 `data/faces.json`에 이미 있다.
2. **T-012 라운드 화면**: `main.ts`에서 `newRun` -> `apply` -> `render` 반복 구조를 만든다.
3. **T-013 정산과 상점**, **T-014 끝 화면과 기록**
4. **T-015 조커 그림 변환** (T-013 이후). 주의할 그림 목록이 tasks.md에 있다.
5. **T-004 배포** (사람): GitHub에 저장소를 만들고 push, Vercel에서 가져오기. 빌드 설정은 tasks.md T-004.
6. **T-017 마무리 점검**

## 이어받는 사람이 알아야 할 것

### 실행

```
npm install
npm run dev        개발 서버 (작업 확인용. 배포는 Vercel)
npm test           규칙 테스트
npm run typecheck  타입 검사
npm run build      배포용 빌드 (dist/)
```

### 코드 구조의 약속

- 판 상태는 `apply(state, action)`으로만 바꾼다 (src/game/run.ts). 화면은 상태를 읽어 그리고, 버튼은 Action을 보낸다. 화면 코드가 상태를 직접 고치면 안 된다.
- `src/game/`은 DOM, window, localStorage를 쓰지 않는다. 화면 없이 테스트된다.
- 허용되지 않는 행동(돈 부족, 0장 플레이 등)은 `apply`가 상태를 그대로 돌려준다. 화면은 미리 버튼을 비활성화한다.
- 공개 함수 목록은 design.md 4장. 새 공개 함수를 만들면 그 표에 추가한다.
- 조커 추가는 대부분 `data/jokers.json` 한 줄이면 된다 (design.md 4.2).

### 환경에서 겪은 것

- 패키지 버전: TypeScript 7, Vite 8, Vitest 5, Node 24. 예전 버전의 설정 예제를 그대로 붙이면 안 맞을 수 있다.
- 갈무리 글꼴은 `galmuri/dist/galmuri.css`를 통째로 import하면 글꼴 11종 50MB가 빌드에 들어간다. `src/styles/fonts.css`처럼 쓰는 woff2만 연결한다.
- 줄바꿈은 `.gitattributes`로 LF 고정. Windows에서도 그대로 둔다.
- `tests/game/cards.ts`에 "Ah Kd 5s" 표기로 카드를 만드는 테스트 도구가 있다. 새 테스트에서 다시 만들지 말고 가져다 쓴다.

### 그림

- 조커 그림은 ChatGPT로 만든다. Codex, Copilot은 그림을 만들 수 없으니 그림이 필요한 작업(2차 F12 조커 추가 등)은 사람에게 넘긴다. 프롬프트는 design.md 5.3.
- `art/jokers/`의 원본 PNG는 지우지 않는다. 다시 변환할 때 필요하다.
- `art/sample/card-art-sample.html`은 사용자와 그림 방식을 정할 때 쓴 견본 페이지다. 브라우저로 열면 카드와 얼굴 도트가 보인다. 배포 대상이 아니다.
- 원작 이미지, 글꼴, 사운드는 쓰지 않는다.

## 막힌 점

- 없음

## 작업 기록

| 날짜 | 작업 | 한 사람 | 내용 |
|---|---|---|---|
| 2026-10-21 | - | Claude | 문서 구조를 표준 4개 문서(requirements, design, tasks, progress)로 정리. 독서 기록장 기획 폐기 |
| 2026-10-21 | T-001 | Claude | 대상 게임 발라트로 확정. requirements.md에 규칙 요약, 1차 기능 F1~F9, 2차 기능 F10~F18 작성 |
| 2026-10-21 | T-002 | Claude | 위키와 수치 대조 완료. design.md에 폴더 구조, 타입, 공개 함수, 점수 순서, 화면 배치, 그림 방식, 프롬프트 작성. tasks.md를 T-003~T-017로 쪼갬 |
| 2026-10-21 | T-016 | 사용자 | ChatGPT로 조커 그림 10장 생성, art/jokers/에 저장 |
| 2026-10-21 | T-003 | Claude | Vite + TypeScript 7 + Vitest 5 골격. 갈무리 글꼴은 쓰는 3개만 연결(빌드 50MB -> 1.2MB). 줄바꿈 LF 고정(.gitattributes) |
| 2026-10-21 | T-005 | Claude | types.ts, rules.ts, data/ 4종, rng.ts(mulberry32), deck.ts와 테스트 9개 |
| 2026-10-21 | T-006 | Claude | handEval.ts. 위키 확인: 포카드는 투 페어를 포함하지 않음. 테스트 22개 |
| 2026-10-21 | T-007 | Claude | jokers.ts(효과 6종), scoring.ts. 테스트 공용 도구 tests/game/cards.ts로 중복 제거 |
| 2026-10-21 | T-008 | Claude | blinds.ts, economy.ts. 이자는 보상 받기 전 금액으로 계산 |
| 2026-10-21 | T-009 | Claude | shop.ts. 진열은 data/jokers.json에서 중복 허용 무작위 |
| 2026-10-21 | T-010 | Claude | run.ts. 안테 8 보스 통과는 정산 없이 바로 승리. 자동 플레이 테스트로 한 판 재현성 확인. 테스트 합계 82개 |
| 2026-10-21 | 인계 | Claude | 얼굴 카드 도트를 data/faces.json으로, 견본 페이지를 art/sample/로 보관. T-011~T-014, T-017 작업 상세 작성. 이 문서를 인계용으로 정리 |
