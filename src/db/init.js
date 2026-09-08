import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  try {
    await pool.query(sql);
    console.log("Database schema applied successfully.");
  } catch (err) {
    console.error("Failed to init database:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

init();
