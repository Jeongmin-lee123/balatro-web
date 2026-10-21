# progress.md - 지금 어디까지 했나

다른 AI나 사람이 이어받을 때 가장 먼저 읽는 파일이다.
작업이 끝날 때마다 "현재 상태"와 "다음 할 일"을 고치고, "작업 기록"에 한 줄을 추가한다.

## 현재 상태 (2026-10-21 인계 시점)

- 단계: 1차 범위(F1~F9) 완료, 2차 진행 중 (F10 행성 카드, F12 조커 5종, F11 보스 11종, F17 판 저장, F13 건너뛰기와 태그, F14 타로 20종, F15 카드 강화 8종 완료. 조커 15종 그림 모두 있음)
- 대상 게임: 발라트로 (Balatro). 규칙과 수치는 requirements.md 2.1 (위키 대조 완료)
- 배포 주소: https://balatro-web-two.vercel.app (main에 push하면 자동 배포)
- 저장소: https://github.com/Jeongmin-lee123/balatro-web (공개)
- 테스트: `npm test` 163개 통과, `npm run typecheck` 오류 없음, `npm run build` 성공

| 영역 | 상태 | 비고 |
|---|---|---|
| 문서 (requirements, design, tasks) | 완료 | 2차 기능은 requirements.md 3.2 |
| 게임 규칙 `src/game/` (T-005 ~ T-010) | 완료 | 화면 없이 테스트로 검증됨 |
| 고정 자료 `data/` | 완료 | hands, blinds, rules, jokers, faces |
| 조커 원본 그림 `art/jokers/` (T-016) | 완료 | 10장 모두 |
| 화면 `src/ui/` (T-011 ~ T-014) | 완료 | 브라우저에서 라운드, 정산, 상점, 구매, 패배, 기록 확인 |
| 조커 그림 변환 (T-015) | 완료 | npm run art. public/jokers 10장 140KB |
| 배포 (T-004) | 완료 | GitHub main push -> Vercel 자동 배포 |

## 다음 할 일

1차 작업(T-001 ~ T-017)은 모두 끝났다. 다음은 requirements.md 3.2의 2차 기능이다. 하나를 고르면 tasks.md "2차" 안내대로 T-018부터 번호를 붙여 작업 상세를 먼저 쓴다.

완료한 2차 작업: F10 행성 카드(T-018), F12 조커 5종(T-019), F11 보스 12종(T-021, T-024), F17 판 저장(T-022), F13 건너뛰기와 태그(T-023), F14 타로(T-026), F15 카드 강화(T-027)

추천 순서 (남은 것)
3. **F15 나머지**: 카드 봉인(빨강, 파랑, 금, 보라)과 에디션(호일, 홀로그래픽, 폴리크롬)
5. **F16 바우처와 부스터 팩**, **F18 비밀 족보** (F14, F15 이후)

화면 개선 후보: T-017에서 나온 두 가지(휴대폰 손패 크기, 빈 조커 칸)는 T-025에서 처리했다

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
| 2026-10-21 | T-010 | Claude | run.ts. 앤티 8 보스 통과는 정산 없이 바로 승리. 자동 플레이 테스트로 한 판 재현성 확인. 테스트 합계 82개 |
| 2026-10-21 | 인계 | Claude | 얼굴 카드 도트를 data/faces.json으로, 견본 페이지를 art/sample/로 보관. T-011~T-014, T-017 작업 상세 작성. 이 문서를 인계용으로 정리 |
| 2026-10-21 | T-004 | Claude | Vercel 프로젝트 balatro-web 생성, CLI로 프로덕션 배포. 지금은 빈 테이블 화면만 보인다 |
| 2026-10-21 | T-004 | Claude | GitHub 공개 저장소 생성과 push. vercel git connect는 실패(Vercel GitHub 앱 미설치로 추정). README에 참여 방법 추가 |
| 2026-10-21 | T-004 | Claude | 사용자가 Vercel GitHub 앱 설치, vercel git connect 성공. main push 자동 배포 확인 |
| 2026-10-21 | T-011 | Claude | ui/cardView.ts, ui/faceArt.ts. 견본 코드를 TypeScript로 이식, 귀퉁이 글꼴을 갈무리로. 테스트 8개 |
| 2026-10-21 | T-012 | Claude | 라운드 화면. 버튼에 Action을 JSON으로 달고 루트 한 곳에서 클릭을 받는 구조(ui/dom.ts). 다시 그릴 때 키보드 초점 유지. 다음 블라인드 계산을 blinds.ts nextBlind로 합쳐 run.ts와 상점 화면이 같이 씀. 브라우저에서 선택, 미리보기, 플레이 확인 |
| 2026-10-21 | T-013 | Claude | 정산, 상점, 조커 카드. 사이드바의 핸드/버리기는 라운드 중에만 표시 |
| 2026-10-21 | T-014 | Claude | 끝 화면, storage/records.ts. 패배 후 역대 기록이 새로고침 뒤에도 남는 것 확인 |
| 2026-10-21 | T-015 | Claude | 배경 지우기를 포기하고 2:3 그대로 256 x 384, 16색 변환 (design.md D-009) |
| 2026-10-21 | T-017 | Claude | 375px 폭에서 가로 스크롤 없음, 키보드 초점이 다시 그린 뒤에도 유지됨을 확인. 휴대폰 사이드바의 칩 x 배수 한 줄로 정리. 개선 후보를 다음 할 일에 기록 |
| 2026-10-21 | 용어 | Claude | 사용자 요청으로 '안테'를 '앤티'로 통일 (화면, 코드, 테스트, 문서) |
| 2026-10-21 | T-018 | Claude | 행성 카드 9종. 상점 진열을 { kind, id }로 바꿈, 진열 비율 조커 20 : 행성 4. 사는 즉시 레벨업(D-010). 행성 그림은 색 하나로 만드는 도트 구. 브라우저에서 진열과 구매 확인 |
| 2026-10-21 | T-019 | Claude | 조커 5종을 data/jokers.json 5줄로 추가 (코드 수정 없음, D-005 확인). 그림 소재는 design.md 5.3, 생성은 T-020(사람) |
| 2026-10-21 | T-021 | Claude | 보스 11종 규칙(game/bosses.ts, data/bosses.json). 테스트용 자동 플레이를 실제 apply로 고르도록 바꾸고, 시드 하나의 운에 기대던 테스트를 여러 시드로 바꿈. 화면은 다음 커밋 |
| 2026-10-21 | T-021 | Claude | 보스 화면: 사이드바에 보스 이름과 효과, 무효 카드 흐리게, 점쟁이일 때 5장 아니면 플레이 버튼 꺼짐, 상점 다음 안내에 보스. 브라우저에서 곤봉 보스 확인 |
| 2026-10-21 | T-022 | Claude | storage/savedRun.ts. 행동마다 저장, 끝난 판은 지움, 사이드바에 확인 한 번 거치는 새 게임 메뉴. 브라우저에서 새로고침 이어하기와 새 게임 확인 (D-012) |
| 2026-10-21 | T-023 | Claude | 블라인드 선택 화면(phase blind_select), 건너뛰기와 태그 8종. 저장 형식 변경으로 SAVE_VERSION 2. 브라우저에서 선택, 건너뛰기, 보관 태그 표시 확인 (D-013) |
| 2026-10-21 | T-024 | Claude | 갈고리(훅) 보스. takeSelected에 무작위 추가 버림을 넣어 플레이 순서(낸 카드 빼기, 2장 버리기, 다시 채우기)를 원작대로 |
| 2026-10-21 | T-025 | Claude | 600px 미만에서 손패를 겹쳐 놓아 카드 폭 40px -> 65px, 빈 조커 칸은 20px 띠로. 375px 프레임에서 한 줄, 가로 스크롤 없음 확인 |
| 2026-10-21 | T-026 | Claude | 판 전체 덱(state.deck), 소모품 칸 2, 타로 12종 규칙(game/tarots.ts, data/tarots.json). 상점 비율 조커 20 : 타로 4 : 행성 4. SAVE_VERSION 3. 화면은 다음 커밋 |
| 2026-10-21 | T-026 | Claude | 소모품 칸 화면과 상점 타로 카드. 브라우저에서 별(무늬 변경)과 은둔자(돈 두 배) 사용 확인. D-014, D-015 |
| 2026-10-21 | T-027 | Claude | 카드 강화 8종 규칙과 강화 타로 8종. 점수 계산을 단계별 누적으로 바꿈(곱하기 단계). 행운과 유리는 판 시드 난수를 이어 씀. SAVE_VERSION 4. 화면은 다음 커밋 |
| 2026-10-21 | T-027 | Claude | 강화 카드 화면(바탕색과 표시 글자, 돌 카드 전용 그림), 계산 과정에 x 표시. 브라우저에서 유리 x2와 손에 든 강철 x1.5 계산 확인 (D-016) |
| 2026-10-21 | T-020 | 사용자, Claude | 미친 조커 그림 (1/5). 남은 것: crazy, droll, wily, clever |
| 2026-10-21 | T-020 | 사용자, Claude | 나머지 4장은 사용자가 15칸 표 한 장(art/jokers/sheets/)으로 받아 아래 줄 칸을 잘라 2:3으로 맞춤. 칸 해상도가 낮다 (crazy, droll, wily는 다시 그릴 후보) |
| 2026-10-21 | T-020 | 사용자, Claude | clever_joker를 한 장짜리 그림으로 교체 (잘린 구도와 낮은 해상도 해결) |
