import sqlite3
import os
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'phishing_history.db')

def get_db_connection():
    # Make sure data folder exists
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
    cursor.execute('''
        SELECT id, url, final_url, risk_score, risk_tier, ml_prediction, ml_confidence, reputation_hit, response_time_ms, created_at
        FROM scans
        ORDER BY id DESC
        LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for r in rows:
        history.append({
            "id": r["id"],
            "url": r["url"],
            "final_url": r["final_url"],
            "risk_score": r["risk_score"],
            "risk_tier": r["risk_tier"],
            "ml_prediction": r["ml_prediction"],
            "ml_confidence": r["ml_confidence"],
            "reputation_hit": bool(r["reputation_hit"]),
            "response_time_ms": r["response_time_ms"],
            "created_at": r["created_at"]
        })
    return history
