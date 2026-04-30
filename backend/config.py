# backend/config.py
import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv
import logging

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = os.environ.get('DATA_DIR', '/data')
DB_PATH   = os.path.join(DATA_DIR, 'careercompass.db')
SESSION_DIR = os.path.join(DATA_DIR, 'flask_session')

Path(SESSION_DIR).mkdir(exist_ok=True, parents=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'change-this-in-production'
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DB_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = True
    SESSION_USE_SIGNER = True
    SESSION_COOKIE_NAME = 'careercompass_session'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_DOMAIN = None
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_REFRESH_EACH_REQUEST = True

    SESSION_FILE_DIR = SESSION_DIR
    SESSION_FILE_THRESHOLD = 500
    SESSION_FILE_MODE = 0o666
    SESSION_COOKIE_PATH = '/'

    BCRYPT_LOG_ROUNDS = 13
    MAX_LOGIN_ATTEMPTS = 3
    LOCKOUT_MINUTES = 5
    CORS_SUPPORTS_CREDENTIALS = True

    # ── Brevo Transactional Email (HTTPS/443 — works on Railway free tier) ────
    # 1. Sign up free at https://app.brevo.com
    # 2. Go to: SMTP & API → API Keys → Generate a new API key
    # 3. Add BREVO_API_KEY to Railway environment variables
    # 4. MAIL_USERNAME = the "from" address (your Gmail or any address you add
    #    under Brevo → Senders & IPs → Senders)
    BREVO_API_KEY   = os.environ.get('BREVO_API_KEY', '')
    MAIL_USERNAME   = os.environ.get('MAIL_USERNAME', '')       # from address
    MAIL_SENDER_NAME = os.environ.get('MAIL_SENDER_NAME', 'CareerCompass')

    # Flask-Mail is NOT used for sending — these are kept so nothing breaks
    # if any other code references them, but they do nothing.
    MAIL_SERVER  = 'smtp.gmail.com'
    MAIL_PORT    = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_USERNAME', '')

    ADZUNA_APP_ID  = os.environ.get('ADZUNA_APP_ID', '')
    ADZUNA_APP_KEY = os.environ.get('ADZUNA_APP_KEY', '')
    GROQ_API_KEY   = os.environ.get('GROQ_API_KEY', '')
    API_MODE       = os.environ.get('API_MODE', 'MOCK_MODE')