# backend/utils/auth.py

from functools import wraps
from flask import session, jsonify

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'msg': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# backend/utils/auth.py - Check if admin_required is correct

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'msg': 'Authentication required'}), 401
        if not session.get('is_admin', False):
            return jsonify({'msg': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function