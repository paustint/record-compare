export const CHAR_TO_PIXEL_RATIO = 8.00000000000007;

export const FILETYPE_REGEX = {
  CSV: /\.csv$/i,
  XLSX: /\.(xls|xlsx)$/i,
};

export const NOOP = () => {};

export const IPC_EVENT_NAMES = {
  GET_WINDOW_IDS: 'GET_WINDOW_IDS',
  GET_PATH: 'GET_PATH',
  WORKER_MESSAGE_EV: 'WORKER_MESSAGE',
  WORKER_RESPONSE_EV: 'WORKER_RESPONSE',
};
