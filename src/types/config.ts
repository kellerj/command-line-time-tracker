
export interface ConfigOption {
  name: string;
  description: string;
  configId: string;
  valueType: 'string' | 'number' | 'boolean' | 'path' | 'date' | 'array' | 'time';
  validationFunction?: (value: string) => boolean | string;
  defaultValue?: string | number | boolean | Date;
}

export interface TtConfig {
  [key: string]: string | number | boolean | Date;
}
