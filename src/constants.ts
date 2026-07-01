export const MAX_VOTES = 3;
export const MAX_REQUESTS = 2;
export const POST_TIMEOUT = 5 * 60 * 1000;
export const REQUEST_TIMEOUT = 10 * 60 * 1000;
export const TELEGRAM_STICKER_FILE_ID =
  "CAACAgUAAxkBAAIX12Rci3DXLH_h_hjgvbkmM6YSMEhUAAIvBAAC3gABcVWicSZoSZsiti8E";
export const TELEGRAM_RM6785_CHANNEL =
  parseInt(process.env.TELEGRAM_RM6785_CHANNEL as string) || -1001384382397;
export const TELEGRAM_RM6785_CHAT =
  parseInt(process.env.TELEGRAM_RM6785_CHAT as string) || -1001754321934;
export const TELEGRAM_R7_CHAT = -1001167300698;
export const TELEGRAM_TESTING_CHAT = -1001801695556;
export const TELEGRAM_RELEASE_CHAT = -1001299514785;
export const TELEGRAM_SU_ID = [1138003186, 1583181351, 1024853832];
export const TEST_MODE = !!process.env.TEST_MODE || false;
