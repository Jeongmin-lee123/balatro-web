import { describe, expect, it } from "vitest";
import { bossDef, canPlayCount, isDebuffed, pickBoss, roundLimits } from "../../src/game/bosses";
import { BOSS_LIST, RULES } from "../../src/game/rules";
import { cards } from "./cards";

describe("pickBoss", () => {
  it("같은 시드면 같은 보스", () => {
    expect(pickBoss(42, 3, [])).toEqual(pickBoss(42, 3, []));
  });

  it("앤티 1에는 최소 앤티가 1인 보스만 나온다", () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(bossDef(pickBoss(seed, 1, []).boss).minAnte).toBe(1);
    }
  });

  it("일반 보스가 모두 한 번씩 나오기 전에는 반복하지 않고, 다 나오면 다시 처음부터", () => {
    const regular = BOSS_LIST.filter((boss) => !boss.showdown);
    let seen: string[] = [];
    let rng = 7;
    for (let i = 0; i < regular.length; i++) {
      const picked = pickBoss(rng, 7, seen);
      expect(seen).not.toContain(picked.boss);
      seen = picked.seen;
      rng = picked.rngState;
    }
    expect(new Set(seen).size).toBe(regular.length);
    expect(pickBoss(rng, 7, seen).seen).toHaveLength(1);
  });

  it("마지막 앤티는 쇼다운 보스만, 그 전에는 쇼다운 보스가 나오지 않는다", () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(bossDef(pickBoss(seed, 8, []).boss).showdown).toBe(true);
      expect(bossDef(pickBoss(seed, 7, []).boss).showdown).toBeFalsy();
    }
  });
});

describe("isDebuffed", () => {
  const [kc, kh, sevenClub] = cards("Kc Kh 7c");

  it("무늬 보스는 그 무늬만", () => {
    const club = bossDef("club").effect;
    expect([kc, kh, sevenClub].map((c) => isDebuffed(club, c!))).toEqual([true, false, true]);
  });

  it("화초는 J, Q, K만", () => {
    const plant = bossDef("plant").effect;
    expect(cards("Jd Qs Kh Ac Tc").map((c) => isDebuffed(plant, c))).toEqual([true, true, true, false, false]);
  });
});

describe("roundLimits, canPlayCount", () => {
  it("바늘은 핸드 1, 물은 버리기 0, 보스가 아니면 받은 기본값 그대로", () => {
    const base = { hands: RULES.hands, discards: RULES.discards };
    expect(roundLimits(bossDef("needle").effect, base).hands).toBe(1);
    expect(roundLimits(bossDef("water").effect, base).discards).toBe(0);
    expect(roundLimits(null, { hands: 5, discards: 4 })).toEqual({ hands: 5, discards: 4 });
  });

  it("점쟁이는 5장일 때만", () => {
    const psychic = bossDef("psychic").effect;
    expect([1, 4, 5].map((n) => canPlayCount(psychic, n))).toEqual([false, false, true]);
    expect(canPlayCount(null, 0)).toBe(false);
  });
});
