"""
Create admin user directly in DB. Only run once.
Email: admin@obvis.me
Password: ObvisAdmin2026!
"""
import sys, uuid, datetime

try:
    import psycopg2 as pg
    SYNC_DRV = True
except ImportError:
    try:
        import asyncpg as pg
        SYNC_DRV = False
    except ImportError:
        print("Install psycopg2 or asyncpg: pip install psycopg2-binary OR pip install asyncpg")
        sys.exit(1)

from argon2 import PasswordHasher

EMAIL = "admin@obvis.me"
PASSWORD = "ObvisAdmin2026!"
CONN = "postgresql://neondb_owner:npg_lQ6EvyzWYsj5@ep-red-bread-ameof786.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
CONN_POOLER = "postgresql://neondb_owner:npg_lQ6EvyzWYsj5@ep-red-bread-ameof786-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"


def run_sync():
    import psycopg2
    for conn_str in [CONN, CONN_POOLER]:
        conn = None
        try:
            conn = psycopg2.connect(conn_str)
            conn.autocommit = True
            cur = conn.cursor()

            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE")
            print("[OK] is_admin column ready")

            ph = PasswordHasher()
            hashed = ph.hash(PASSWORD)

            cur.execute("SELECT id, is_admin FROM users WHERE email = %s", (EMAIL,))
            row = cur.fetchone()
            if row:
                if not row[1]:
                    cur.execute("UPDATE users SET is_admin = TRUE WHERE email = %s", (EMAIL,))
                    print('[OK] Admin user updated to admin!')
                else:
                    print('[INFO] Admin already exists:', EMAIL)
                return

            cur.execute(
                """INSERT INTO users (id, name, email, hashed_password, is_admin, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, TRUE, %s, %s)""",
                (str(uuid.uuid4()), "Super Admin", EMAIL, hashed,
                 datetime.datetime.now(datetime.timezone.utc),
                 datetime.datetime.now(datetime.timezone.utc))
            )
            print("[OK] Admin created:")
            print(f"  Email: {EMAIL}")
            print(f"  Password: {PASSWORD}")
            print("")
            print("  Isko kisi ko mat dena — admin access sirf tumhara hai.")
            return

        except psycopg2.OperationalError:
            if conn:
                conn.close()
            continue
    print("[FAIL] Could not connect to database")


async def run_async():
    import asyncpg
    for conn_str in [CONN, CONN_POOLER]:
        conn = None
        try:
            conn = await asyncpg.connect(conn_str)
            await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE")
            print("[OK] is_admin column ready")

            ph = PasswordHasher()
            hashed = ph.hash(PASSWORD)

            row = await conn.fetchrow("SELECT id, is_admin FROM users WHERE email = $1", EMAIL)
            if row:
                if not row['is_admin']:
                    await conn.execute("UPDATE users SET is_admin = TRUE WHERE email = $1", EMAIL)
                    print('[OK] Admin user updated to admin!')
                else:
                    print('[INFO] Admin already exists:', EMAIL)
                return

            await conn.execute(
                """INSERT INTO users (id, name, email, hashed_password, is_admin, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, TRUE, $5, $6)""",
                str(uuid.uuid4()), "Super Admin", EMAIL, hashed,
                datetime.datetime.now(datetime.timezone.utc), datetime.datetime.now(datetime.timezone.utc)
            )
            print("[OK] Admin created:")
            print(f"  Email: {EMAIL}")
            print(f"  Password: {PASSWORD}")
            return

        except Exception:
            if conn:
                await conn.close()
            continue
    print("[FAIL] Could not connect to database")


if SYNC_DRV:
    run_sync()
else:
    import asyncio
    asyncio.run(run_async())