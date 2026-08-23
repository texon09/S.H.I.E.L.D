import sqlite3
import os
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'phishing_history.db')

def get_db_connection():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            final_url TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            risk_tier TEXT NOT NULL,
            ml_prediction TEXT NOT NULL,
            ml_confidence REAL NOT NULL,
            reputation_hit INTEGER NOT NULL,
            response_time_ms INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS whitelist (
            url TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_scan(url: str, final_url: str, risk_score: int, risk_tier: str, 
              ml_prediction: str, ml_confidence: float, reputation_hit: bool, 
              response_time_ms: int) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO scans (url, final_url, risk_score, risk_tier, ml_prediction, ml_confidence, reputation_hit, response_time_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (url, final_url, risk_score, risk_tier, ml_prediction, ml_confidence, 1 if reputation_hit else 0, response_time_ms))
    scan_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return scan_id

def get_scan_history(limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM scans ORDER BY id DESC LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def clear_scans():
    conn = get_db_connection()
    conn.cursor().execute('DELETE FROM scans')
    conn.commit()
    conn.close()

def add_to_whitelist(url: str):
    conn = get_db_connection()
    conn.cursor().execute('INSERT OR IGNORE INTO whitelist (url) VALUES (?)', (url,))
    conn.commit()
    conn.close()

def get_whitelist():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT url FROM whitelist')
    rows = cursor.fetchall()
    conn.close()
    return [r['url'] for r in rows]

def remove_from_whitelist(url: str):
    conn = get_db_connection()
    conn.cursor().execute('DELETE FROM whitelist WHERE url = ?', (url,))
    conn.commit()
    conn.close()
