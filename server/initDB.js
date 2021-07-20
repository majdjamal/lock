
// initDB.js - creates and initializes the database used
// to store user information, such as usernames and passwords.

// __author__ = Majd Jamal

'use strict';

const sqlite3 = require('sqlite3').verbose();

const databasen = 'db.sqlite';
const db = new sqlite3.Database(databasen);

const tabellen = 'profil';

db.run(`CREATE TABLE ${tabellen}(namn TEXT, password TEXT)`);

db.close();
