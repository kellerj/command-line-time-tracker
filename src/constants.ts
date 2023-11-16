export const CONFIG_DIR = process.env.TT_CONFIG_DIR || `${process.env.HOME}/.config/tt`;
export const CONFIG_FILE_LOCATION = `${CONFIG_DIR}/config.json`;
export const DEFAULT_DB_LOCATION = CONFIG_DIR;
export const DB_FILE_NAME = 'tt.sqlite';