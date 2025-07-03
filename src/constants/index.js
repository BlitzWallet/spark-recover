// import { COLORS, FONT, SIZES, SHADOWS } from "./theme";
// import ICONS from "./icons";
// import { CENTER, BTN, Background } from "./styles";
import { SATSPERBITCOIN } from "./math";

const BLOCKED_NAVIGATION_PAYMENT_CODES = [
  "Auto Channel Rebalance",
  "Auto Channel Open",
  "Store - chatGPT",
  "Ecash -> LN swap",
  "TBC Gift Card",
  "sms4sats send sms api payment",
  "1.5",
  "4",
  "9",
  "Internal_Transfer",
];

const WEBSITE_REGEX =
  /^(https?:\/\/|www\.)[a-z\d]([a-z\d-]*[a-z\d])*(\.[a-z]{2,})+/i;
const hasSpace = /\s/;

const VALID_URL_REGEX =
  /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const VALID_USERNAME_REGEX = /^(?=.*\p{L})[\p{L}\p{N}_]+$/u;
const IS_LETTER_REGEX = /^[A-Za-z]$/;
const BITCOIN_SATS_ICON = "₿";
const BITCOIN_SAT_TEXT = "SAT";
const HIDDEN_BALANCE_TEXT = `* * * * *`;

const ECASH_TX_STORAGE_KEY = "CASHU_TRANSACTIONS";
const AUTO_CHANNEL_REBALANCE_STORAGE_KEY = "ACR_STORAGE_KEY";
const ECASH_KEYSET_STORAGE = "ECASH_KEYSET_STORAGE";
const BREEZ_WORKING_DIR_KEY = "BREEZ_WORKING_DIR";
const QUICK_PAY_STORAGE_KEY = "FAST_PAY_SETTINGS";
const LOGIN_SECUITY_MODE_KEY = "LOGIN_SECURITY_MODE";
const MIGRATE_ECASH_STORAGE_KEY = "MIGRATE_ECASH";
const THEME_LOCAL_STORAGE_KEY = "THEME_SETTINGS";
const POINT_OF_SALE_PAYOUT_DESCRIPTION = "Blitz Tips Payout";
const BLITZ_PROFILE_IMG_STORAGE_REF = "profile_pictures";
const BLITZ_DEFAULT_PAYMENT_DESCRIPTION = "Blitz Wallet";

const BLITZ_SUPPORT_DEFAULT_PAYMENT_DESCRIPTION = "Blitz support";

const CHATGPT_INPUT_COST = 10 / 1000000;
const CHATGPT_OUTPUT_COST = 30 / 1000000;

const MIN_CHANNEL_OPEN_FEE = 500_000;
const MAX_CHANNEL_OPEN_FEE = 1_000_000;
const BLITZ_RECEIVE_FEE = 0.0;
const BLITZ_SEND_FEE = 0.0;
const LIQUID_DEFAULT_FEE = 30;
const MAX_ECASH_RECEIVE = 50_000;
const MAX_ECASH_BALANCE = 50_000;
const LIQUID_NON_BITCOIN_DRAIN_LIMIT = 10;

const CONTENT_KEYBOARD_OFFSET = 10;

const BLITZ_GOAL_USER_COUNT = 1_000_000;

const IS_DONTATION_PAYMENT_BUFFER = 10_000;

const LIQUID_TYPES = {
  BitcoinAddress: "BitcoinAddress",
  LiquidAddress: "LiquidAddress",
  Bolt11: "Bolt11",
  Bolt12Offer: "Bolt12Offer",
  NodeId: "NodeId",
  Url: "Url",
  LnUrlPay: "LnUrlPay",
  LnUrlWithdraw: "LnUrlWithdraw",
  LnUrlAuth: "LnUrlAuth",
  LnUrlError: "LnUrlError",
};
const LIQUID_PAYMENT_METHOD = {
  Lightning: "Lightning",
  Bolt11Invoice: "Bolt11Invoice",
  Bolt12Offer: "Bolt12Offer",
  BitcoinAddress: "BitcoinAddress",
  LiquidAddress: "LiquidAddress",
};

export {
  //   COLORS,
  //   FONT,
  //   SIZES,
  //   SHADOWS,
  //   ICONS,
  //   CENTER,
  //   BTN,
  //   Background,
  SATSPERBITCOIN,
  BLOCKED_NAVIGATION_PAYMENT_CODES,
  WEBSITE_REGEX,
  hasSpace,
  ECASH_TX_STORAGE_KEY,
  VALID_URL_REGEX,
  CHATGPT_INPUT_COST,
  CHATGPT_OUTPUT_COST,
  MIN_CHANNEL_OPEN_FEE,
  MAX_CHANNEL_OPEN_FEE,
  EMAIL_REGEX,
  VALID_USERNAME_REGEX,
  BLITZ_RECEIVE_FEE,
  BLITZ_SEND_FEE,
  AUTO_CHANNEL_REBALANCE_STORAGE_KEY,
  ECASH_KEYSET_STORAGE,
  BREEZ_WORKING_DIR_KEY,
  QUICK_PAY_STORAGE_KEY,
  BLITZ_DEFAULT_PAYMENT_DESCRIPTION,
  LOGIN_SECUITY_MODE_KEY,
  LIQUID_DEFAULT_FEE,
  BITCOIN_SATS_ICON,
  MIGRATE_ECASH_STORAGE_KEY,
  CONTENT_KEYBOARD_OFFSET,
  HIDDEN_BALANCE_TEXT,
  MAX_ECASH_RECEIVE,
  MAX_ECASH_BALANCE,
  LIQUID_NON_BITCOIN_DRAIN_LIMIT,
  POINT_OF_SALE_PAYOUT_DESCRIPTION,
  BLITZ_GOAL_USER_COUNT,
  BLITZ_SUPPORT_DEFAULT_PAYMENT_DESCRIPTION,
  IS_DONTATION_PAYMENT_BUFFER,
  THEME_LOCAL_STORAGE_KEY,
  LIQUID_TYPES,
  LIQUID_PAYMENT_METHOD,
  BLITZ_PROFILE_IMG_STORAGE_REF,
  BITCOIN_SAT_TEXT,
  IS_LETTER_REGEX,
};
