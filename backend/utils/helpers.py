# backend/utils/helpers.py
# Uses Resend HTTP API for email — avoids Railway's blocked SMTP ports (587/465).

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


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"


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


def _send_mail_async(app, mail_data: dict):
    """
    Send email via Resend HTTP API in a background thread.
    Uses HTTPS (port 443) — never blocked by Railway.

    mail_data keys:
        subject      – str
        recipients   – list[str]
        body         – str (plain text, optional)
        html         – str (HTML, optional)
    """
    with app.app_context():
        resend_api_key = app.config.get('RESEND_API_KEY', '')
        mail_from      = app.config.get('MAIL_DEFAULT_SENDER', 'CareerCompass <onboarding@resend.dev>')

        if not resend_api_key:
            logger.warning(
                "RESEND_API_KEY not configured — skipping email to %s",
                mail_data.get('recipients')
            )
            return

        payload = {
            'from':    mail_from,
            'to':      mail_data['recipients'],
            'subject': mail_data['subject'],
        }
        if mail_data.get('html'):
            payload['html'] = mail_data['html']
        if mail_data.get('body'):
            payload['text'] = mail_data['body']

        try:
            response = requests.post(
                'https://api.resend.com/emails',
                headers={
                    'Authorization': f'Bearer {resend_api_key}',
                    'Content-Type':  'application/json',
                },
                json=payload,
                timeout=15,
            )

            if response.status_code in (200, 201):
                logger.info("Email sent via Resend to %s", mail_data['recipients'])
            else:
                logger.error(
                    "Resend API error %s: %s",
                    response.status_code, response.text
                )

        except requests.exceptions.ConnectionError:
            logger.error("Cannot reach Resend API — check network connectivity")
        except requests.exceptions.Timeout:
            logger.error("Resend API request timed out")
        except Exception as e:
            logger.error("Unexpected email error to %s: %s", mail_data.get('recipients'), e)


# ─── Alias ────────────────────────────────────────────────────────────────────
# admin_controller.py imports _send_mail_thread — keep it pointing here.
_send_mail_thread = _send_mail_async


def _queue_email(app, mail_data: dict) -> None:
    """Spawn a daemon thread to send mail_data. Never blocks the caller."""
    Thread(target=_send_mail_async, args=(app, mail_data), daemon=True).start()


def send_reset_email(user, token, reset_code):
    """Queue a password-reset email in a background thread (never blocks)."""
    try:
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

        body = (
            f"Hello {user.first_name},\n\n"
            f"We received a request to reset your password.\n"
            f"Your reset code is: {reset_code}\n"
            f"This code will expire in 1 hour.\n\n"
            f"If you did not request this, ignore this email.\n"
        )

        mail_data = {
            'subject':    'Password Reset Code - CareerCompass',
            'recipients': [user.email],
            'html':       html,
            'body':       body,
        }

        app = current_app._get_current_object()
        _queue_email(app, mail_data)

    except Exception as e:
        logger.error(f"Error queueing reset email: {e}")