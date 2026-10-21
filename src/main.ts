import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app 요소가 없습니다");

app.innerHTML = `
  <div class="table">
    <aside class="table__side panel"><h1 class="title">발라트로</h1></aside>
    <main class="table__main"></main>
    <footer class="table__foot">Balatro(LocalThunk) 비공식 팬 제작. 원작 그림과 소리는 쓰지 않았습니다.</footer>
  </div>
`;
