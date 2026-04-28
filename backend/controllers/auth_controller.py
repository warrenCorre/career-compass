# backend/controllers/auth_controller.py - Cleaned logs

from flask import Blueprint, request, jsonify, session, current_app
from datetime import datetime, timedelta
from models import db, User, PasswordResetToken
from utils.helpers import generate_reset_token, verify_reset_token, send_reset_email
import re
import traceback
import logging

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

def is_mobile_request():
    user_agent = request.headers.get('User-Agent', '').lower()
    mobile_patterns = ['expo', 'react-native', 'okhttp', 'android', 'iphone', 'ipad', 'mobile']
    x_platform = request.headers.get('X-Platform', '').lower()
    x_app = request.headers.get('X-App', '').lower()
    return any(pattern in user_agent for pattern in mobile_patterns) or \
           x_platform in ['android', 'ios', 'mobile'] or \
           x_app in ['careercompass-mobile', 'expo']

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'msg': 'No data provided'}), 400
            
        required_fields = ['firstName', 'lastName', 'age', 'username', 'email', 'password']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'msg': f'Missing fields: {", ".join(missing_fields)}'}), 400
        
        try:
            age = int(data['age'])
            if age < 17:
                return jsonify({'msg': 'You must be at least 17 years old to register'}), 400
            if age > 120:
                return jsonify({'msg': 'Please enter a valid age'}), 400
        except ValueError:
            return jsonify({'msg': 'Invalid age format'}), 400
        
        if not validate_email(data['email']):
            return jsonify({'msg': 'Invalid email format'}), 400
        
        is_valid, msg = validate_password(data['password'])
        if not is_valid:
            return jsonify({'msg': msg}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'msg': 'Username already taken'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'msg': 'Email already registered'}), 400
        
        user = User(
            first_name=data['firstName'],
            last_name=data['lastName'],
            age=int(data['age']),
            username=data['username'],
            email=data['email'],
            is_admin=False
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        return jsonify({'msg': 'User created successfully'}), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'msg': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'msg': 'Username and password required'}), 400
        
        is_mobile = is_mobile_request()
        username_or_email = data['username']
        user = User.query.filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user:
            return jsonify({'msg': 'Invalid credentials'}), 401
        
        if (user.username == 'admin' or user.is_admin) and is_mobile:
            return jsonify({'msg': 'Invalid credentials'}), 401
        
        if user.locked_until and user.locked_until > datetime.utcnow():
            remaining_seconds = int((user.locked_until - datetime.utcnow()).total_seconds())
            remaining_minutes = remaining_seconds // 60
            remaining_seconds %= 60
            return jsonify({
                'msg': f'Account temporarily locked. Try again in {remaining_minutes}m {remaining_seconds}s.',
                'locked': True,
                'locked_until': user.locked_until.isoformat()
            }), 403
        
        if user.check_password(data['password']):
            user.failed_attempts = 0
            user.locked_until = None
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            session.clear()
            session['user_id'] = user.id
            session['is_admin'] = user.is_admin
            session.permanent = True
            session.modified = True
            
            return jsonify({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': user.is_admin,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'age': user.age
                }
            }), 200
        else:
            user.failed_attempts += 1
            if user.failed_attempts >= 3:
                user.locked_until = datetime.utcnow() + timedelta(minutes=2)
            db.session.commit()
            
            if user.locked_until and user.locked_until > datetime.utcnow():
                return jsonify({'msg': 'Account temporarily locked. Try again after 2 minutes.', 'locked': True}), 403
            
            attempts_left = 3 - user.failed_attempts
            return jsonify({
                'msg': f'Invalid credentials. {attempts_left} attempt(s) remaining.',
                'failed_attempts': user.failed_attempts
            }), 401
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'msg': 'Login failed'}), 500

@auth_bp.route('/debug/session-file', methods=['GET'])
def debug_session_file():
    import os
    session_dir = current_app.config.get('SESSION_FILE_DIR')
    files = []
    if session_dir and os.path.exists(session_dir):
        files = os.listdir(session_dir)
    return jsonify({
        'session_dir': session_dir,
        'session_exists': os.path.exists(session_dir) if session_dir else False,
        'files': files,
        'current_session': dict(session),
        'session_id': session.get('_id')
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'msg': 'Logged out'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'msg': 'Not logged in'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        session.clear()
        return jsonify({'msg': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'age': user.age,
        'profile_picture': user.profile_picture,
        'created_at': user.created_at.isoformat() if user.created_at else None
    }), 200

@auth_bp.route('/check-username', methods=['POST'])
def check_username_availability():
    try:
        data = request.get_json()
        username = data.get('username')
        if not username:
            return jsonify({'available': False}), 400
        user = User.query.filter_by(username=username).first()
        return jsonify({'available': user is None}), 200
    except Exception as e:
        logger.error(f"Error checking username: {e}")
        return jsonify({'available': False}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        if not data or not data.get('identifier'):
            return jsonify({'msg': 'Username or email required'}), 400
            
        identifier = data.get('identifier')
        user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
        if not user:
            return jsonify({'msg': 'No account found with that username or email.'}), 404

        token, reset_code = generate_reset_token(user)
        try:
            send_reset_email(user, token, reset_code)
        except Exception as e:
            logger.error(f"Email error: {e}")
            return jsonify({'msg': 'Failed to send reset email. Please try again.'}), 500

        return jsonify({'msg': 'Reset code sent.', 'email': user.email}), 200
        
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return jsonify({'msg': 'Something went wrong'}), 500

@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'msg': 'No data provided'}), 400
            
        email = data.get('email')
        code = data.get('code')
        if not email or not code:
            return jsonify({'msg': 'Email and code required'}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'msg': 'Invalid code'}), 400
        
        reset_entry = PasswordResetToken.query.filter_by(
            user_id=user.id, reset_code=code, used=False
        ).first()
        if not reset_entry or reset_entry.expires_at < datetime.utcnow():
            return jsonify({'msg': 'Invalid code'}), 400
        
        return jsonify({'msg': 'Code verified', 'token': reset_entry.token}), 200
        
    except Exception as e:
        logger.error(f"Verify code error: {str(e)}")
        return jsonify({'msg': 'Something went wrong'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('newPassword')
        if not token or not new_password:
            return jsonify({'msg': 'Token and new password required'}), 400
        
        is_valid, msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'msg': msg}), 400
        
        user = verify_reset_token(token)
        if not user:
            return jsonify({'msg': 'Invalid or expired token'}), 400
        
        user.set_password(new_password)
        reset_token = PasswordResetToken.query.filter_by(token=token).first()
        if reset_token:
            reset_token.used = True
        db.session.commit()
        return jsonify({'msg': 'Password reset successful'}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Password reset error: {str(e)}")
        return jsonify({'msg': 'Password reset failed'}), 500

@auth_bp.route('/debug/session', methods=['GET'])
def debug_session():
    return jsonify({
        'session': dict(session),
        'user_id': session.get('user_id'),
        'is_admin': session.get('is_admin')
    }), 200

@auth_bp.route('/heartbeat', methods=['POST'])
def heartbeat():
    if 'user_id' not in session:
        return jsonify({'msg': 'Not authenticated'}), 401
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        if user:
            user.last_activity = datetime.utcnow()
            db.session.commit()
            return jsonify({'msg': 'ok', 'server_time': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S') + 'Z'}), 200
    except Exception:
        db.session.rollback()
    return jsonify({'msg': 'ok'}), 200