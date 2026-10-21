# 발라트로 (웹 따라 만들기)

스팀 게임 Balatro를 웹으로 따라 만드는 미니 프로젝트. 비공식 팬 제작이며 원작 에셋은 쓰지 않는다.
결과물의 중심은 게임보다 **누가 와서 작업해도 이어갈 수 있는 문서와 구조**다.

- 배포 주소: (첫 배포 후 기입)
- 현재 상태: `docs/progress.md` 참고

## 실행 방법

(프로젝트 골격 작업 T-003 이후 기입)

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
├─ art/jokers/          ChatGPT로 만든 조커 원본 그림
├─ scripts/             그림 변환 스크립트
├─ tests/               game/ 규칙 테스트
└─ docs/
   ├─ requirements.md   무엇이 되어야 하나
   ├─ design.md         어떤 구조로 만들까
   ├─ tasks.md          어떤 순서로 구현할까
   └─ progress.md       지금 어디까지 했나
```

`src/`, `data/`, `tests/`는 아직 없다. T-003에서 만든다.

## 처음 온 사람이 읽는 순서

1. `AGENTS.md`
2. `docs/progress.md` - 지금 상태와 다음 할 일
3. `docs/tasks.md` - 맡을 작업 찾기
4. 필요할 때 `docs/requirements.md`, `docs/design.md`
