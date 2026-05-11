import 'dotenv/config'
import mysql from 'mysql2/promise'

const dbUrl = new URL(process.env.DATABASE_URL!)
const poolConfig = {
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  waitForConnections: true,
  connectionLimit: 3,
  timezone: 'local',
}

function createPool() {
  return mysql.createPool(poolConfig)
}

let pool = createPool()

const RETRYABLE = new Set(['ECONNRESET', 'ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'EPIPE', 'ETIMEDOUT'])

async function exec(sql: string, params?: any[]): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await pool.query(sql, params)
    } catch (err: any) {
      if (RETRYABLE.has(err.code) && attempt < 2) {
        // recreate pool so all stale connections are discarded
        try { await pool.end() } catch {}
        pool = createPool()
        await new Promise(r => setTimeout(r, 200))
        continue
      }
      throw err
    }
  }
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await exec(sql, params)
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function run(sql: string, params?: any[]): Promise<{ insertId: number; affectedRows: number }> {
  const [result] = await exec(sql, params)
  return result
}

export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export default pool
