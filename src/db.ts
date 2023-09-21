import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./time-tracker.db');
console.log(db);
