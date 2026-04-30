# backend/utils/helpers.py
# Email: Flask-Mail → Gmail SMTP (port 587 / STARTTLS) — works on Railway.

import secrets
import random
import string
import socket
from datetime import datetime, timedelta
from threading import Thread
from flask import current_app
from flask_mail import Mail, Message
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


# ─── Email sender (Flask-Mail / Gmail SMTP) ───────────────────────────────────

def _do_send(app, to_email, subject, html, plain):
    """Runs inside a background thread — sends via Gmail SMTP."""
    with app.app_context():
        try:
            mail = Mail(app)
            msg = Message(
                subject=subject,
                recipients=[to_email],
                html=html,
                body=plain,
                sender=app.config.get('MAIL_DEFAULT_SENDER') or app.config.get('MAIL_USERNAME'),
            )
            mail.send(msg)
            logger.info("Email sent to %s", to_email)
        except Exception as e:
            logger.error("Failed to send email to %s: %s", to_email, e)


def _queue_email(app, to_email, subject, html, plain):
    """Fire-and-forget: launches _do_send in a daemon thread."""
    Thread(target=_do_send, args=(app, to_email, subject, html, plain), daemon=True).start()


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
    _do_send(app, to_email,
             mail_data.get('subject', ''),
             mail_data.get('html', ''),
             mail_data.get('body', ''))


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

        _queue_email(app, user.email, 'Password Reset Code - CareerCompass', html, plain)

    except Exception as e:
        logger.error("Error queueing reset email: %s", e)