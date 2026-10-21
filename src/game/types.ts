// 게임 전체에서 쓰는 자료형. 형태를 바꿀 때는 docs/design.md 3장을 먼저 고친다.

export type Suit = "spades" | "hearts" | "clubs" | "diamonds";

/** 11=J, 12=Q, 13=K, 14=A */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

/** 카드 강화. 없으면 일반 카드 (F15) */
export type Enhancement = "bonus" | "mult" | "wild" | "glass" | "steel" | "stone" | "gold" | "lucky";

/** 카드 봉인 (F15) */
export type Seal = "red" | "blue" | "gold" | "purple";

export interface Card {
  /** 처음 만든 이름. 예: "hearts-13". 무늬나 숫자가 바뀌어도 그대로 둔다 (design.md D-014) */
  id: string;
  rank: Rank;
  suit: Suit;
  enhancement?: Enhancement;
  seal?: Seal;
  /** 호일, 홀로그래픽, 폴리크롬만 (네거티브는 일반 카드에 붙지 않는다) */
  edition?: EditionId;
}

export type SortBy = "rank" | "suit";

export type HandType =
  | "flush_five"
  | "flush_house"
  | "five_of_a_kind"
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
  /** 비밀 족보 행성. 그 족보를 낸 뒤에만 나온다 */
  secret?: boolean;
}

export type BossEffect =
  | { kind: "debuff_suit"; suit: Suit }
  | { kind: "debuff_face" }
  | { kind: "must_play"; count: number }
  | { kind: "hands"; count: number }
  | { kind: "discards"; count: number }
  | { kind: "halve_base" }
  | { kind: "lower_level" }
  | { kind: "discard_random"; count: number }
  | { kind: "shuffle_jokers" }
  | { kind: "debuff_all_until_sell" }
  | { kind: "disable_random_joker" }
  | { kind: "none" };

export interface BossDef {
  id: string;
  name: string;
  description: string;
  /** 이 앤티부터 나올 수 있다 */
  minAnte: number;
  /** 앤티 기본 점수에 곱하는 값 */
  multiplier: number;
  /** 마지막 앤티에만 나오는 쇼다운 보스 */
  showdown?: boolean;
  effect: BossEffect;
}

export type TarotEffect =
  | { kind: "enhance"; enhancement: Enhancement; max: number }
  | { kind: "convert_suit"; suit: Suit; max: number }
  | { kind: "raise_rank"; max: number }
  | { kind: "destroy"; max: number }
  | { kind: "copy_left" }
  | { kind: "double_money"; max: number }
  | { kind: "joker_sell_value"; max: number }
  | { kind: "create_tarots"; count: number }
  | { kind: "create_joker" }
  | { kind: "repeat_last" }
  | { kind: "add_edition"; chance: number };

export interface TarotDef {
  id: string;
  name: string;
  /** 카드에 크게 쓰는 로마 숫자 */
  numeral: string;
  price: number;
  description: string;
  effect: TarotEffect;
}

export type TagEffect =
  | { kind: "double_money"; max: number }
  | { kind: "boss_bonus"; amount: number }
  | { kind: "money_per_hand"; amount: number }
  | { kind: "money_per_unused_discard"; amount: number }
  | { kind: "money_per_skip"; amount: number }
  | { kind: "free_shop" }
  | { kind: "free_reroll" }
  | { kind: "hand_size"; amount: number };

export interface TagDef {
  id: string;
  name: string;
  description: string;
  minAnte: number;
  effect: TagEffect;
}

/** 족보별 레벨. 처음은 모두 1 */
export type HandLevels = Record<HandType, number>;

export type ShopItemKind = "joker" | "tarot" | "planet";

export interface ShopOffer {
  kind: ShopItemKind;
  id: string;
  /** 정가 대신 받는 가격 (쿠폰 태그면 0) */
  price?: number;
  /** 조커에만 붙는다 */
  edition?: EditionId;
}

export type EditionId = "foil" | "holographic" | "polychrome" | "negative";

export type EditionEffect =
  | { kind: "chips"; chips: number }
  | { kind: "mult"; mult: number }
  | { kind: "x_mult"; xMult: number }
  | { kind: "slot" };

export interface EditionDef {
  id: EditionId;
  name: string;
  description: string;
  /** 상점 조커에 붙을 확률 */
  chance: number;
  /** 상점 가격에 더하는 값 */
  price: number;
  effect: EditionEffect;
}

export interface OwnedJoker {
  /** 같은 조커를 두 장 가질 수 있어 defId와 따로 둔다 */
  uid: string;
  defId: string;
  paid: number;
  edition?: EditionId;
}

/** 화면에 보여 줄 계산 과정 한 줄. chips, mult는 이 줄에서 더하는 값, xMult는 그다음 배수에 곱하는 값 */
export interface ScoreStep {
  source: string;
  chips: number;
  mult: number;
  xMult?: number;
  note: string;
}

export interface ScoreResult {
  hand: HandResult;
  chips: number;
  mult: number;
  total: number;
  steps: ScoreStep[];
  /** 행운 카드로 번 돈 */
  money: number;
  /** 점수 계산 뒤 깨지는 유리 카드 id */
  shattered: string[];
}

export type Phase = "blind_select" | "round" | "cash_out" | "shop" | "pack_open" | "won" | "lost";

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
  /** 신록의 잎: 이번 라운드에 조커를 팔아 효과를 풀었는지 */
  bossCleared?: boolean;
}

export interface CashOutLine {
  label: string;
  amount: number;
}

export interface CashOut {
  lines: CashOutLine[];
  total: number;
}

export type VoucherEffect =
  | { kind: "shop_slots"; amount: number }
  | { kind: "discount"; percent: number }
  | { kind: "edition_rate"; multiplier: number }
  | { kind: "reroll_discount"; amount: number }
  | { kind: "consumable_slots"; amount: number }
  | { kind: "hands"; amount: number }
  | { kind: "discards"; amount: number }
  | { kind: "shop_weight"; item: ShopItemKind; multiplier: number }
  | { kind: "interest_cap"; cap: number }
  | { kind: "hand_size"; amount: number }
  | { kind: "telescope" };

export interface VoucherDef {
  id: string;
  name: string;
  description: string;
  price: number;
  effect: VoucherEffect;
}

export type PackContent = "tarot" | "planet" | "card" | "joker";

export interface PackDef {
  id: string;
  name: string;
  description: string;
  price: number;
  /** 보여 주는 장수. 그중 1장을 고른다 */
  choices: number;
  weight: number;
  content: PackContent;
}

export interface PackOffer {
  id: string;
  /** 정가 대신 받는 가격 (쿠폰 태그면 0) */
  price?: number;
}

export type PackChoice =
  | { kind: "tarot"; id: string }
  | { kind: "planet"; id: string }
  | { kind: "joker"; id: string; edition?: EditionId }
  | { kind: "card"; card: Card };

export interface OpenPack {
  id: string;
  choices: PackChoice[];
}

export interface ShopState {
  /** 산 칸은 null */
  offers: (ShopOffer | null)[];
  /** 부스터 팩 칸. 다시 굴리기로 바뀌지 않는다. 산 칸은 null */
  packs: (PackOffer | null)[];
  rerollCost: number;
}

export interface RunStats {
  bestHand: number;
  handsPlayed: number;
  /** 건너뛴 블라인드 수 (속도 태그) */
  skips: number;
  /** 이긴 라운드마다 남은 버리기를 더한 값 (쓰레기 태그) */
  unusedDiscards: number;
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
  /** 이번 판의 덱 전체. 라운드마다 이 덱을 섞어 나눈다. 타로가 바꾼 카드는 여기에 남는다 */
  deck: Card[];
  /** 소모품 칸의 타로 id */
  consumables: string[];
  /** 마지막으로 쓴 타로 (바보 제외). 바보 카드가 만든다 */
  lastTarot: string | null;
  /** 산 바우처 id. 판 내내 규칙을 바꾼다 */
  vouchers: string[];
  /** 이번 앤티 상점의 바우처. 사면 null, 앤티가 바뀌면 새로 고른다 */
  voucherOffer: string | null;
  handLevels: HandLevels;
  /** 족보별로 낸 횟수 (비밀 행성, 망원경) */
  handPlays: Partial<Record<HandType, number>>;
  /** 이번 앤티의 보스 id. 앤티가 바뀔 때 새로 고른다 */
  boss: string;
  /** 이번 판에 나온 보스. 모두 한 번씩 나오기 전에는 같은 보스를 다시 고르지 않는다 */
  bossesSeen: string[];
  /** 이번 앤티의 스몰, 빅 블라인드를 건너뛰면 받는 태그 id */
  blindTags: string[];
  /** 받아 두고 아직 발동하지 않은 태그 id. 받은 순서대로 */
  tags: string[];
  /** 새 조커 uid를 만들 때 쓰는 번호 */
  nextUid: number;
  round: RoundState;
  cashOut: CashOut | null;
  shop: ShopState | null;
  /** 연 부스터 팩. phase가 pack_open일 때만 있다 */
  pack: OpenPack | null;
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
  | { type: "buy_pack"; slot: number }
  | { type: "buy_voucher" }
  | { type: "pick_pack"; index: number }
  | { type: "skip_pack" }
  | { type: "move_joker"; uid: string; to: number }
  | { type: "next_round" }
  | { type: "select_blind" }
  | { type: "use_consumable"; index: number }
  | { type: "sell_consumable"; index: number }
  | { type: "skip_blind" }
  | { type: "new_run"; seed?: number };
