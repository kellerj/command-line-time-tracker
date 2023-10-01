import fs from 'fs';
import debug from 'debug';

import { CONFIG_DIR, CONFIG_FILE_LOCATION, DEFAULT_DB_LOCATION } from "../constants.js";
import { ConfigOption } from "../types/config.js";

const LOG = debug('tt:lib:config');

export const configOptions: ConfigOption[] = [
  {
    name: 'Database Path',
    description: 'Location that the database file will be stored.',
    configId: 'dbPath',
    valueType: 'path',
  },
  {
    name: 'Projects',
    description: 'Configure project options',
    configId: 'projects',
    valueType: 'array',
  },
  {
    name: 'Time Types',
    description: 'Configure time type options',
    configId: 'timetypes',
    valueType: 'array',
  },
];

// start of day
// end of day
// default length of time entry
// include waste of time
// default to length since last entry

const defaultConfig = {
  dbPath: DEFAULT_DB_LOCATION,
  projects: ['Time Tracker Development'],
  timetypes: ['Email', 'Meeting', 'Coding', 'Research', 'Writing', 'Reading', 'Other'],
};

export function getCurrentConfig() {
  if (!fs.existsSync(CONFIG_FILE_LOCATION)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE_LOCATION, JSON.stringify(defaultConfig, null, 2), {});
  }
  const currentConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_LOCATION, 'utf8'));
  return currentConfig;
}

export function updateConfigValue(configId: string, newValue: string | number | boolean | Date) {
  const currentConfig = getCurrentConfig();
  currentConfig[configId] = newValue;
  fs.writeFileSync(CONFIG_FILE_LOCATION, JSON.stringify(currentConfig, null, 2), {});
  LOG(`Updated config value for ${configId} to ${newValue}`);
}
