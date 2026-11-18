import { databasePath, getSqlite } from "./client";

getSqlite();
console.log(`Tether database is migrated at ${databasePath()}`);
