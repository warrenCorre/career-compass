# backend/utils/helpers.py

import secrets
import random
import string
import socket
import smtplib
from datetime import datetime, timedelta
from threading import Thread
from flask import current_app
from flask_mail import Message
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


def _send_mail_async(app, msg):
    """
    Send email in a background thread.
    Uses direct smtplib instead of flask-mail's connect() context manager
    to avoid Railway TLS socket attribute errors.
    """
    with app.app_context():
        mail_username = app.config.get('MAIL_USERNAME', '')
        mail_password = app.config.get('MAIL_PASSWORD', '')
        mail_server  = app.config.get('MAIL_SERVER', 'smtp.gmail.com')
        mail_port    = int(app.config.get('MAIL_PORT', 587))
        mail_use_tls = app.config.get('MAIL_USE_TLS', True)
        mail_use_ssl = app.config.get('MAIL_USE_SSL', False)

        if not mail_username or not mail_password:
            logger.warning(
                "SMTP credentials not configured — skipping email to %s",
                msg.recipients
            )
            return

        try:
            if mail_use_ssl:
                smtp = smtplib.SMTP_SSL(mail_server, mail_port, timeout=15)
            else:
                smtp = smtplib.SMTP(mail_server, mail_port, timeout=15)
                if mail_use_tls:
                    smtp.starttls()

            smtp.login(mail_username, mail_password)

            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            mime = MIMEMultipart('alternative')
            mime['Subject'] = msg.subject
            mime['From']    = mail_username
            mime['To']      = ', '.join(msg.recipients)

            if msg.body:
                mime.attach(MIMEText(msg.body, 'plain'))
            if msg.html:
                mime.attach(MIMEText(msg.html, 'html'))

            smtp.sendmail(mail_username, msg.recipients, mime.as_string())
            smtp.quit()
            logger.info("Email sent successfully to %s", msg.recipients)

        except smtplib.SMTPAuthenticationError:
            logger.error("SMTP auth failed — check MAIL_USERNAME / MAIL_PASSWORD")
        except smtplib.SMTPConnectError:
            logger.error("Cannot connect to SMTP server — check MAIL_SERVER / MAIL_PORT")
        except socket.timeout:
            logger.error("SMTP connection timed out")
        except Exception as e:
            logger.error("Unexpected email error to %s: %s", msg.recipients, e)


# ─── Alias ────────────────────────────────────────────────────────────────────
# admin_controller.py imports this name — keep both pointing to the same function
_send_mail_thread = _send_mail_async


def send_reset_email(user, token, reset_code):
    """Queue a password-reset email in a background thread (never blocks)."""
    try:
        msg = Message(
            subject='Password Reset Code - CareerCompass',
            recipients=[user.email]
        )
        msg.html = f'''
        <!DOCTYPE html>
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
                <p>&copy; {datetime.utcnow().year} CareerCompass. All rights reserved.</p>
            </div>
        </div></body></html>'''
        msg.body = (
            f"Hello {user.first_name},\n\n"
            f"We received a request to reset your password.\n"
            f"Your reset code is: {reset_code}\n"
            f"This code will expire in 1 hour.\n\n"
            f"If you did not request this, ignore this email.\n"
        )
        app = current_app._get_current_object()
        Thread(target=_send_mail_async, args=(app, msg), daemon=True).start()
    except Exception as e:
        logger.error(f"Error queueing reset email: {e}")