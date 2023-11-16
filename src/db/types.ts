export interface TimeEntry {
  id: number;
  description: string;
  project: string;
  timeType: string;
  entryDate: string;
  minutes: number;
  insertTime: Date;
  usefulness: number;
}

export interface Project {
  name: string;
  aliases: string[];
  archived: boolean;
}
