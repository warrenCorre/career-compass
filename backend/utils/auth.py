from functools import wraps
from flask import session, jsonify
from models import User  # NEW: import User model

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'msg': 'Authentication required'}), 401

        # NEW: check if the stored user still exists
        user = User.query.get(session['user_id'])
        if not user:
            session.clear()
            return jsonify({'msg': 'Account no longer exists'}), 401

        return f(*args, **kwargs)
    return decorated_function

# admin_required remains unchanged (it already calls login_required)
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'msg': 'Authentication required'}), 401
        if not session.get('is_admin', False):
            return jsonify({'msg': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function