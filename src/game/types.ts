// 게임 전체에서 쓰는 자료형. 형태를 바꿀 때는 docs/design.md 3장을 먼저 고친다.

export type Suit = "spades" | "hearts" | "clubs" | "diamonds";

/** 11=J, 12=Q, 13=K, 14=A */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  /** 예: "hearts-13" */
  id: string;
  rank: Rank;
  suit: Suit;
}

export type SortBy = "rank" | "suit";

export type HandType =
  | "high_card"
  | "pair"
  | "two_pair"
  | "three_of_a_kind"
  | "straight"
  | "flush"
  | "full_house"
  | "four_of_a_kind"
  | "straight_flush";

export interface HandResult {
  type: HandType;
  /** 점수에 들어가는 카드만, 플레이한 순서대로 */
  scoringCards: Card[];
  /** 플레이한 카드 안에 들어 있는 모든 족보 */
  contains: HandType[];
  /** 10-J-Q-K-A 스트레이트 플러시. 표시용 */
  isRoyal: boolean;
}

export type JokerEffect =
  | { kind: "flat_mult"; mult: number }
  | { kind: "suit_mult"; suit: Suit; mult: number }
  | { kind: "contains_mult"; hand: HandType; mult: number }
  | { kind: "contains_chips"; hand: HandType; chips: number }
  | { kind: "small_hand_mult"; maxCards: number; mult: number }
  | { kind: "per_joker_mult"; mult: number };

export interface JokerDef {
  id: string;
  name: string;
  price: number;
  description: string;
  effect: JokerEffect;
}

export interface PlanetDef {
  id: string;
  name: string;
  /** 이 행성이 레벨을 올리는 족보 */
  hand: HandType;
  price: number;
  /** 상점 카드의 행성 그림 색 */
  color: string;
}

export type BossEffect =
  | { kind: "debuff_suit"; suit: Suit }
  | { kind: "debuff_face" }
  | { kind: "must_play"; count: number }
  | { kind: "hands"; count: number }
  | { kind: "discards"; count: number }
  | { kind: "halve_base" }
  | { kind: "lower_level" }
  | { kind: "none" };

export interface BossDef {
  id: string;
  name: string;
  description: string;
  /** 이 앤티부터 나올 수 있다 */
  minAnte: number;
  /** 앤티 기본 점수에 곱하는 값 */
  multiplier: number;
  effect: BossEffect;
}

/** 족보별 레벨. 처음은 모두 1 */
export type HandLevels = Record<HandType, number>;

export type ShopItemKind = "joker" | "planet";

export interface ShopOffer {
  kind: ShopItemKind;
  id: string;
}

export interface OwnedJoker {
  /** 같은 조커를 두 장 가질 수 있어 defId와 따로 둔다 */
  uid: string;
  defId: string;
  paid: number;
}

/** 화면에 보여 줄 계산 과정 한 줄. chips, mult는 이 줄에서 더한 값 */
export interface ScoreStep {
  source: string;
  chips: number;
  mult: number;
  note: string;
}

export interface ScoreResult {
  hand: HandResult;
  chips: number;
  mult: number;
  total: number;
  steps: ScoreStep[];
}

export type Phase = "round" | "cash_out" | "shop" | "won" | "lost";

export type BlindIndex = 0 | 1 | 2;

export interface RoundState {
  drawPile: Card[];
  hand: Card[];
  selected: string[];
  handsLeft: number;
  discardsLeft: number;
  score: number;
  lastScore: ScoreResult | null;
  sortBy: SortBy;
}

export interface CashOutLine {
  label: string;
  amount: number;
}

export interface CashOut {
  lines: CashOutLine[];
  total: number;
}

export interface ShopState {
  /** 산 칸은 null */
  offers: (ShopOffer | null)[];
  rerollCost: number;
}

export interface RunStats {
  bestHand: number;
  handsPlayed: number;
}

export interface RunState {
  seed: number;
  rngState: number;
  phase: Phase;
  /** 1..8 */
  ante: number;
  blindIndex: BlindIndex;
  money: number;
  jokers: OwnedJoker[];
  handLevels: HandLevels;
  /** 이번 앤티의 보스 id. 앤티가 바뀔 때 새로 고른다 */
  boss: string;
  /** 이번 판에 나온 보스. 모두 한 번씩 나오기 전에는 같은 보스를 다시 고르지 않는다 */
  bossesSeen: string[];
  /** 새 조커 uid를 만들 때 쓰는 번호 */
  nextUid: number;
  round: RoundState;
  cashOut: CashOut | null;
  shop: ShopState | null;
  stats: RunStats;
}

export type Action =
  | { type: "toggle_card"; cardId: string }
  | { type: "play" }
  | { type: "discard" }
  | { type: "sort"; by: SortBy }
  | { type: "collect" }
  | { type: "buy"; slot: number }
  | { type: "sell"; uid: string }
  | { type: "reroll" }
  | { type: "move_joker"; uid: string; to: number }
  | { type: "next_round" }
  | { type: "new_run"; seed?: number };
