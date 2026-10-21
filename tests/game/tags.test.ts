import { describe, expect, it } from "vitest";
import { TAG_LIST } from "../../src/game/rules";
import { instantMoney, pickBlindTags, tagDef, takeTags } from "../../src/game/tags";

describe("pickBlindTags", () => {
  it("스몰, 빅에 하나씩, 같은 시드면 같은 태그", () => {
    const picked = pickBlindTags(3, 1);
    expect(picked.tags).toHaveLength(2);
    expect(pickBlindTags(3, 1)).toEqual(picked);
  });

  it("앤티 1에는 최소 앤티 2인 태그(손재주, 쓰레기)가 나오지 않는다", () => {
    for (let seed = 0; seed < 300; seed++) {
      for (const id of pickBlindTags(seed, 1).tags) expect(tagDef(id).minAnte).toBe(1);
    }
  });

  it("앤티 2부터는 모든 태그가 나올 수 있다", () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 300; seed++) pickBlindTags(seed, 2).tags.forEach((id) => seen.add(id));
    expect(seen.size).toBe(TAG_LIST.length);
  });
});

describe("instantMoney, takeTags", () => {
  const stats = { bestHand: 0, handsPlayed: 3, skips: 2, unusedDiscards: 5 };

  it("보관하는 태그는 null", () => {
    for (const id of ["investment", "coupon", "d6", "juggle"]) expect(instantMoney(tagDef(id).effect, { money: 10, stats })).toBeNull();
  });

  it("빚이 있어도 경제 태그는 돈을 빼앗지 않는다", () => {
    expect(instantMoney(tagDef("economy").effect, { money: -3, stats })).toBe(0);
  });

  it("종류가 맞는 태그만 꺼내고 나머지 순서는 그대로", () => {
    const { taken, rest } = takeTags(["coupon", "juggle", "coupon", "d6"], "free_shop");
    expect(taken.map((t) => t.id)).toEqual(["coupon", "coupon"]);
    expect(rest).toEqual(["juggle", "d6"]);
  });
});
