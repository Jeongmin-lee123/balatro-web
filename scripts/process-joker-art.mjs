// art/jokers/*.png(ChatGPT 원본, 1024 x 1536)를 화면용 public/jokers/*.png(256 x 384, 16색)로 바꾼다.
// 사용: npm run art
//
// 배경은 지우지 않는다. 원본의 크림색 배경과 광대 얼굴색이 거의 같아서 배경을 지우면 얼굴이 함께 지워진다.
// 최근접 축소가 픽셀 경계를 가장 깨끗하게 남기고, 디더링을 끄면 생성 그림의 번진 색이 단색 면으로 정리된다.
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "art/jokers";
const OUTPUT_DIR = "public/jokers";
const WIDTH = 256;
const HEIGHT = 384;
const COLORS = 16;

await mkdir(OUTPUT_DIR, { recursive: true });
const files = (await readdir(SOURCE_DIR)).filter((name) => name.endsWith(".png"));

for (const name of files) {
  const output = path.join(OUTPUT_DIR, name);
  await sharp(path.join(SOURCE_DIR, name))
    .resize(WIDTH, HEIGHT, { kernel: "nearest", fit: "cover" })
    .png({ palette: true, colors: COLORS, dither: 0 })
    .toFile(output);
  console.log(`${name} -> ${output}`);
}

console.log(`${files.length}장 변환`);
