import sqlite3
import hashlib

DB_NAME = "users.db"


# =========================
# HASH PASSWORD
# =========================
def hash_password(password: str):
    if not password:
        return ""
    return hashlib.sha256(password.encode()).hexdigest()


# =========================
# INIT USERS TABLE
# =========================
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            password TEXT,
            role TEXT,
            app_password TEXT
        )
    """)

    # Backward-compatible migration: old DBs may not have app_password.
    cursor.execute("PRAGMA table_info(users)")
    cols = [row[1] for row in cursor.fetchall()]
    if "app_password" not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN app_password TEXT")

    conn.commit()
    conn.close()


# =========================
# CREATE USER
# =========================
def create_user(name, email, phone, password, role, app_password=None):
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        hashed_password = hash_password(password)

        cursor.execute("""
            INSERT INTO users (name, email, phone, password, role, app_password)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            name,
            email,
            phone,
            hashed_password,
            role,
            app_password or None
        ))

        conn.commit()
        conn.close()
        return True

    except Exception as e:
        print("DB ERROR:", e)
        return False


# =========================
# VERIFY USER LOGIN
# =========================
def verify_user(email, password):
    user = get_user_by_email(email)

    if not user:
        return None

    if user["password"] == hash_password(password):
        return user

    return None


# =========================
# GET USER
# =========================
def get_user_by_email(email):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "phone": row[3],
            "password": row[4],
            "role": row[5],
            "app_password": row[6],
        }

    return None


# =========================
# CREATE SENDERS TABLE
# =========================
def create_senders_table():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS senders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT,
            organization_name TEXT,
            email TEXT,
            password TEXT
        )
    """)

    conn.commit()
    conn.close()


# =========================
# ADD SENDER
# =========================
def add_sender(user_id, name, org_name, email, password):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO senders (user_id, name, organization_name, email, password)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, name, org_name, email, password))

    conn.commit()
    conn.close()


# =========================
# GET SENDERS
# =========================
def get_senders(user_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, organization_name, email
        FROM senders
        WHERE user_id = ?
    """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "name": r[1],
            "organization_name": r[2],
            "email": r[3],
        }
        for r in rows
    ]


# =========================
# GET SINGLE SENDER
# =========================
def get_sender_by_id(sender_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM senders WHERE id = ?", (sender_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "id": row[0],
            "user_id": row[1],
            "name": row[2],
            "organization_name": row[3],
            "email": row[4],
            "password": row[5],
        }

    return None


# =========================
# INIT ALL TABLES
# =========================
def setup_database():
    init_db()
    create_senders_table()


setup_database()