# 발라트로 (웹 따라 만들기)

스팀 게임 Balatro를 웹으로 따라 만드는 미니 프로젝트. 비공식 팬 제작이며 원작 에셋은 쓰지 않는다.
결과물의 중심은 게임보다 **누가 와서 작업해도 이어갈 수 있는 문서와 구조**다.

- 배포 주소: https://balatro-web-two.vercel.app
- 저장소: https://github.com/Jeongmin-lee123/balatro-web
- 현재 상태: `docs/progress.md` 참고

## 실행 방법

```
npm install
npm run dev        개발 서버
npm test           규칙 테스트
npm run build      배포용 빌드 (dist/)
```

지금은 게임 규칙만 완성되어 있고 화면은 만드는 중이다. 진행 상황은 `docs/progress.md`.

## 폴더 구조

```
.
├─ README.md            실행과 사용 방법 (이 파일)
├─ AGENTS.md            모든 AI와 사람이 따르는 작업 지침
├─ CLAUDE.md            AGENTS.md를 불러오기만 한다
├─ index.html           웹 페이지 시작점
├─ src/
│  ├─ main.ts           화면과 게임 규칙을 연결하는 시작점
│  ├─ game/             게임 규칙. 화면, DOM, 저장소를 모른다
│  ├─ ui/               그리기와 입력 처리
│  ├─ storage/          최고 기록 등 브라우저 저장
│  └─ styles/           CSS와 디자인 토큰
├─ data/                족보 수치, 블라인드, 조커 목록 같은 고정 자료 (JSON)
├─ public/jokers/       화면에 쓰는 조커 그림 (art/에서 변환)
├─ art/                 ChatGPT로 만든 조커 원본(jokers/)과 그림 견본(sample/)
├─ scripts/             그림 변환 스크립트
├─ tests/               game/ 규칙 테스트
└─ docs/
   ├─ requirements.md   무엇이 되어야 하나
   ├─ design.md         어떤 구조로 만들까
   ├─ tasks.md          어떤 순서로 구현할까
   └─ progress.md       지금 어디까지 했나
```

## 작업에 참여하는 방법

1. 저장소 주인에게 Collaborator 초대를 받거나, 저장소를 fork한다.
2. 받아서 준비한다.
   ```
   git clone https://github.com/Jeongmin-lee123/balatro-web.git
   cd balatro-web
   npm install
   npm test
   ```
3. 아래 "처음 온 사람이 읽는 순서"대로 문서를 읽고, `docs/tasks.md`에서 상태가 "대기"인 작업 중 선행 작업이 끝난 것을 하나 고른다.
4. 작업 중에는 `AGENTS.md` 규칙을 지킨다. 특히 작업 번호를 붙인 커밋, `docs/progress.md` 갱신, 이모지 금지.
5. Collaborator는 main에 push, fork한 사람은 Pull Request를 보낸다.

AI에게 맡길 때는 이렇게 시작하면 된다.

```
AGENTS.md와 docs/progress.md를 먼저 읽고, docs/tasks.md의 다음 작업을 진행해줘.
작업 하나를 끝낼 때마다 progress.md와 tasks.md를 갱신하고 작업 번호를 붙여 커밋해줘.
```

## 처음 온 사람이 읽는 순서

1. `AGENTS.md`
2. `docs/progress.md` - 지금 상태와 다음 할 일
3. `docs/tasks.md` - 맡을 작업 찾기
4. 필요할 때 `docs/requirements.md`, `docs/design.md`
