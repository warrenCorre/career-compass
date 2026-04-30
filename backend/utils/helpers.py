# backend/utils/helpers.py
# Email: Brevo (formerly Sendinblue) HTTP API — HTTPS port 443, never blocked.
# Free tier: 300 emails/day, no domain verification needed.
# Sign up: https://app.brevo.com → SMTP & API → API Keys → Generate a new API key

import secrets
import random
import string
import socket
import requests
from datetime import datetime, timedelta
from threading import Thread
from flask import current_app
from models import db, PasswordResetToken, User
import logging

logger = logging.getLogger(__name__)


# ─── Networking helpers ───────────────────────────────────────────────────────

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"


# ─── Token / code helpers ─────────────────────────────────────────────────────

def generate_reset_code():
    return ''.join(random.choices(string.digits, k=6))


def generate_reset_token(user):
    token = secrets.token_urlsafe(32)
    reset_code = generate_reset_code()
    expires_at = datetime.utcnow() + timedelta(hours=1)

    try:
        old_tokens = PasswordResetToken.query.filter_by(user_id=user.id, used=False).all()
        for old_token in old_tokens:
            old_token.used = True
        db.session.commit()
    except Exception as e:
        logger.error(f"Error invalidating old tokens: {e}")
        db.session.rollback()

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        reset_code=reset_code,
        expires_at=expires_at
    )
    db.session.add(reset_token)
    db.session.commit()

    return token, reset_code


def verify_reset_token(token):
    try:
        reset_entry = PasswordResetToken.query.filter_by(token=token, used=False).first()
        if not reset_entry or reset_entry.expires_at < datetime.utcnow():
            return None
        return User.query.get(reset_entry.user_id)
    except Exception:
        return None


def verify_reset_code(email, code):
    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return None
        reset_entry = PasswordResetToken.query.filter_by(
            user_id=user.id, reset_code=code, used=False
        ).first()
        if not reset_entry or reset_entry.expires_at < datetime.utcnow():
            return None
        return reset_entry
    except Exception:
        return None


# ─── Brevo HTTP API sender ────────────────────────────────────────────────────

def _do_send(app, to_email, to_name, subject, html, plain):
    """Send via Brevo transactional email API (HTTPS/443). Runs in a thread."""
    with app.app_context():
        api_key = app.config.get('BREVO_API_KEY', '')
        sender_email = app.config.get('MAIL_USERNAME', '')
        sender_name  = app.config.get('MAIL_SENDER_NAME', 'CareerCompass')

        if not api_key:
            logger.error("BREVO_API_KEY not set — cannot send email.")
            return
        if not sender_email:
            logger.error("MAIL_USERNAME not set — cannot send email.")
            return

        payload = {
            "sender":      {"name": sender_name, "email": sender_email},
            "to":          [{"email": to_email, "name": to_name}],
            "subject":     subject,
            "htmlContent": html,
            "textContent": plain,
        }

        try:
            resp = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key":      api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=15,
            )
            if resp.status_code in (200, 201):
                logger.info("Email sent via Brevo to %s", to_email)
            else:
                logger.error("Brevo error %s: %s", resp.status_code, resp.text)
        except requests.exceptions.Timeout:
            logger.error("Brevo API request timed out")
        except Exception as e:
            logger.error("Brevo send error to %s: %s", to_email, e)


def _queue_email(app, to_email, to_name, subject, html, plain):
    """Fire-and-forget: launches _do_send in a daemon thread."""
    Thread(
        target=_do_send,
        args=(app, to_email, to_name, subject, html, plain),
        daemon=True
    ).start()


# ─── Backward-compat shim (used by admin_controller.py) ──────────────────────

def _send_mail_thread(app, mail_data: dict):
    """
    Legacy shim so admin_controller.py needs no changes.
    mail_data keys: subject, recipients (list), html, body (plain text)
    """
    to_email = (mail_data.get('recipients') or [None])[0]
    if not to_email:
        logger.warning("_send_mail_thread called with no recipients")
        return
    _do_send(
        app,
        to_email,
        to_email,  # use email as name fallback
        mail_data.get('subject', ''),
        mail_data.get('html', ''),
        mail_data.get('body', ''),
    )


# ─── Password reset email ─────────────────────────────────────────────────────

def send_reset_email(user, token, reset_code):
    try:
        app = current_app._get_current_object()
        year = datetime.utcnow().year

        html = f'''<!DOCTYPE html>
<html>
<head><style>
    body{{font-family:Arial,sans-serif;line-height:1.6;color:#333}}
    .container{{max-width:600px;margin:0 auto;padding:20px}}
    .header{{background:linear-gradient(135deg,#4A6A3B,#A3C9A8);color:white;padding:20px;
             text-align:center;border-radius:10px 10px 0 0}}
    .content{{background:#f9f7f3;padding:30px;border-radius:0 0 10px 10px}}
    .code-box{{background:#4A6A3B;color:white;font-size:32px;font-weight:bold;
               padding:20px;text-align:center;border-radius:10px;margin:20px 0;
               letter-spacing:5px}}
    .footer{{margin-top:30px;font-size:12px;color:#666;text-align:center}}
</style></head>
<body><div class="container">
    <div class="header">
        <h1>CareerCompass</h1>
        <p>Password Reset Request</p>
    </div>
    <div class="content">
        <p>Hello {user.first_name},</p>
        <p>We received a request to reset your password.
           Enter the following 6-digit code to proceed:</p>
        <div class="code-box">{reset_code}</div>
        <p><strong>This code will expire in 1 hour.</strong></p>
        <p>If you did not request this, you can safely ignore this email.</p>
    </div>
    <div class="footer">
        <p>&copy; {year} CareerCompass. All rights reserved.</p>
    </div>
</div></body></html>'''

        plain = (
            f"Hello {user.first_name},\n\n"
            f"Your CareerCompass password reset code is: {reset_code}\n"
            f"This code expires in 1 hour.\n\n"
            f"If you did not request this, ignore this email.\n\n"
            f"© {year} CareerCompass"
        )

        _queue_email(
            app,
            user.email,
            f"{user.first_name} {user.last_name}",
            'Password Reset Code - CareerCompass',
            html,
            plain,
        )

    except Exception as e:
        logger.error("Error queueing reset email: %s", e)