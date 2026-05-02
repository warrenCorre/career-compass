# backend/utils/auth.py

from functools import wraps
from flask import session, jsonify
from models import User


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'msg': 'Authentication required'}), 401

        # Check if the stored user still exists and hasn't been anonymised
        user = User.query.get(session['user_id'])
        if not user or user.username.startswith('deleted_'):
            session.clear()
            return jsonify({'msg': 'Account no longer exists'}), 401

        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    @login_required          # <--- ensures deleted admins are also blocked (belt and braces)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin', False):
            return jsonify({'msg': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function