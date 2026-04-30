# backend/utils/helpers.py
# Primary:  Flask-Mail → Gmail SMTP (port 587 / STARTTLS) — works on Railway.
# Fallback: Resend HTTP API (port 443) — used when Gmail creds not set.

import secrets
import random
import string
import socket
import requests
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


# ─── Email body builder ───────────────────────────────────────────────────────

def _build_reset_email(user, reset_code):
    """Returns (subject, html_body, plain_body) for the reset email."""
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

    return 'Password Reset Code - CareerCompass', html, plain


# ─── Gmail SMTP sender (Flask-Mail) ──────────────────────────────────────────

def _send_via_flask_mail(app, to_email, subject, html, plain):
    """Send using Flask-Mail / Gmail SMTP inside a background thread."""
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
            logger.info("Email sent via Gmail SMTP to %s", to_email)
        except Exception as e:
            logger.error("Flask-Mail send error to %s: %s", to_email, e)
            # Attempt Resend as fallback if key is configured
            _send_via_resend(app, to_email, subject, html, plain)


# ─── Resend HTTP API fallback ─────────────────────────────────────────────────

def _send_via_resend(app, to_email, subject, html, plain):
    """Send via Resend HTTP API (port 443). Used as fallback only."""
    resend_api_key = app.config.get('RESEND_API_KEY', '')
    mail_from      = app.config.get('MAIL_DEFAULT_SENDER', 'CareerCompass <onboarding@resend.dev>')

    if not resend_api_key:
        logger.warning("Resend fallback skipped — RESEND_API_KEY not set.")
        return

    try:
        resp = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {resend_api_key}',
                'Content-Type':  'application/json',
            },
            json={
                'from':    mail_from,
                'to':      [to_email],
                'subject': subject,
                'html':    html,
                'text':    plain,
            },
            timeout=15,
        )
        if resp.status_code in (200, 201):
            logger.info("Email sent via Resend fallback to %s", to_email)
        else:
            logger.error("Resend fallback error %s: %s", resp.status_code, resp.text)
    except Exception as e:
        logger.error("Resend fallback exception: %s", e)


# ─── Public entry point ───────────────────────────────────────────────────────

def send_reset_email(user, token, reset_code):
    """
    Queue a password-reset email in a background daemon thread.

    Strategy:
      1. Use Gmail SMTP via Flask-Mail if MAIL_USERNAME + MAIL_PASSWORD are set.
      2. Fall back to Resend HTTP API if RESEND_API_KEY is set.
      3. Log a warning if neither is configured.
    """
    try:
        app = current_app._get_current_object()
        subject, html, plain = _build_reset_email(user, reset_code)

        mail_user = app.config.get('MAIL_USERNAME', '')
        mail_pass = app.config.get('MAIL_PASSWORD', '')

        if mail_user and mail_pass:
            # Primary: Gmail SMTP
            Thread(
                target=_send_via_flask_mail,
                args=(app, user.email, subject, html, plain),
                daemon=True
            ).start()
        elif app.config.get('RESEND_API_KEY', ''):
            # Fallback: Resend
            Thread(
                target=_send_via_resend,
                args=(app, user.email, subject, html, plain),
                daemon=True
            ).start()
        else:
            logger.warning(
                "No email transport configured. "
                "Set MAIL_USERNAME + MAIL_PASSWORD (Gmail) or RESEND_API_KEY."
            )

    except Exception as e:
        logger.error("Error queueing reset email: %s", e)