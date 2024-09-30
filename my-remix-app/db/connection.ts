import mysql from "mysql2/promise";

export async function createConnection() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // パスワードを設定
    database: "expenses_db",
  });
}
