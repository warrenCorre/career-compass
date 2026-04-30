# backend/controllers/admin_controller.py - UPDATED: 2-stage inactivity + Tabs support

from threading import Thread
from flask import Blueprint, request, jsonify, session, current_app
from models import (
    db, User, CareerCategory, Course,
    JobListing, PersonalAssessment, RealAssessment, 
    AssessmentResult, PasswordResetToken, Setting
)
from utils.auth import admin_required
from sqlalchemy import func, desc, or_, and_
from datetime import datetime, timedelta
from flask_mail import Message
import json
import os
import uuid
from werkzeug.utils import secure_filename
from utils.helpers import _send_mail_thread

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads', 'categories')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

admin_bp = Blueprint('admin', __name__)

# ============================================================
# INACTIVITY THRESHOLDS
# ============================================================
NOT_ACTIVE_DAYS = 7      # "Not Active Kinda" – 7 days
INACTIVE_DAYS  = 30      # "Inactive" – 30 days

# ============================================================
# DASHBOARD
# ============================================================
@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    try:
        total_users = User.query.filter(User.username != 'admin').count()
        total_categories = CareerCategory.query.count()
        total_courses = Course.query.count()
        total_assessments = AssessmentResult.query.count()
        total_jobs = JobListing.query.count()
        
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_users = User.query.filter(
            User.created_at >= week_ago,
            User.username != 'admin'
        ).count()
        
        new_assessments = AssessmentResult.query.filter(
            AssessmentResult.created_at >= week_ago
        ).count()
        
        new_jobs = JobListing.query.filter(
            JobListing.created_at >= week_ago
        ).count()
        
        category_distribution = []
        categories = CareerCategory.query.all()
        for cat in categories:
            count = AssessmentResult.query.filter_by(category_id=cat.id).count()
            if count > 0:
                category_distribution.append({'name': cat.name, 'count': count})
        
        recent_users = User.query.filter(User.username != 'admin')\
            .order_by(User.created_at.desc()).limit(5).all()
        
        recent_assessments = AssessmentResult.query.order_by(
            AssessmentResult.created_at.desc()
        ).limit(5).all()
        
        return jsonify({
            'total_users': total_users,
            'total_categories': total_categories,
            'total_courses': total_courses,
            'total_assessments': total_assessments,
            'total_jobs': total_jobs,
            'new_users': new_users,
            'new_assessments': new_assessments,
            'new_jobs': new_jobs,
            'category_distribution': category_distribution,
            'recent_users': [u.to_dict() for u in recent_users],
            'recent_assessments': [{
                'id': a.id,
                'user': f"{a.user.first_name} {a.user.last_name}",
                'category': a.category.name if a.category else None,
                'date': a.created_at.strftime('%Y-%m-%d')
            } for a in recent_assessments]
        }), 200
        
    except Exception as e:
        print(f"ERROR in admin dashboard: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'msg': 'Error loading dashboard'}), 500


# ============================================================
# USER MANAGEMENT
# ============================================================
@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """
    Get users with pagination, search, and tab support.
    
    Query params:
      - tab: 'all' (all users, newest first), 'inactive' (7d+ not-active + 30d+ inactive)
      - inactive_stage: '7d', '30d', or 'all' (only used when tab='inactive')
      - page, per_page, search, sort_by, sort_order
      
    Default sort: created_at desc (newest first)
    """
    try:
        page       = request.args.get('page', 1, type=int)
        per_page   = request.args.get('per_page', 10, type=int)
        search     = request.args.get('search', '')
        tab        = request.args.get('tab', 'all')          # 'all' | 'inactive'
        inactive_stage = request.args.get('inactive_stage', 'all')  # '7d' | '30d' | 'all'
        sort_by    = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Base query – always exclude admin
        query = User.query.filter(User.username != 'admin')
        
        # ── Tab logic ──────────────────────────────────────────
        now = datetime.utcnow()
        threshold_7d  = now - timedelta(days=NOT_ACTIVE_DAYS)
        threshold_30d = now - timedelta(days=INACTIVE_DAYS)
        
        if tab == 'all':
            # "All Users" tab → ALL users (active + inactive), no activity filter
            # Inactive users naturally appear at the bottom since they registered earlier
            pass  # no filter – show everyone
        elif tab == 'inactive':
            # "Inactive" tab → users not active for 7+ days
            if inactive_stage == '7d':
                # 7-29 days: "Not Active Kinda"
                query = query.filter(
                    User.last_activity < threshold_7d,
                    User.last_activity >= threshold_30d
                )
            elif inactive_stage == '30d':
                # 30+ days: "Inactive"
                query = query.filter(
                    or_(
                        User.last_activity < threshold_30d,
                        User.last_activity == None
                    )
                )
            else:
                # 'all' – both stages
                query = query.filter(
                    or_(
                        User.last_activity < threshold_7d,
                        User.last_activity == None
                    )
                )
        # else: no tab param → return everything (no filter)
        
        # ── Search ─────────────────────────────────────────────
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%')
                )
            )
        
        # ── Sort (default: newest first) ──────────────────────
        sort_col = getattr(User, sort_by, User.created_at)
        if sort_order == 'desc':
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(sort_col)
        
        total_count = query.count()
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'users': [u.to_dict() for u in paginated.items],
            'total': total_count,
            'pages': paginated.pages,
            'current_page': paginated.page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        print(f"Error fetching users: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'msg': 'Error loading users'}), 500


@admin_bp.route('/users/counts', methods=['GET'])
@admin_required
def get_user_counts():
    """Return counts for the tab badges."""
    try:
        now = datetime.utcnow()
        threshold_7d  = now - timedelta(days=NOT_ACTIVE_DAYS)
        threshold_30d = now - timedelta(days=INACTIVE_DAYS)
        
        base = User.query.filter(User.username != 'admin')
        
        total      = base.count()
        active     = base.filter(User.last_activity >= threshold_30d, User.last_activity != None).count()
        not_active = base.filter(
            User.last_activity < threshold_7d,
            User.last_activity >= threshold_30d
        ).count()
        inactive   = base.filter(
            or_(User.last_activity < threshold_30d, User.last_activity == None)
        ).count()
        
        return jsonify({
            'total': total,
            'active': active,
            'not_active_7d': not_active,
            'inactive_30d': inactive
        }), 200
        
    except Exception as e:
        print(f"Error fetching user counts: {e}")
        return jsonify({'total': 0, 'active': 0, 'not_active_7d': 0, 'inactive_30d': 0}), 200


@admin_bp.route('/users/inactive-count', methods=['GET'])
@admin_required
def get_inactive_users_count():
    """Get total inactive count (30d+) for the header badge."""
    try:
        threshold = datetime.utcnow() - timedelta(days=INACTIVE_DAYS)
        count = User.query.filter(
            User.username != 'admin',
            or_(User.last_activity < threshold, User.last_activity == None)
        ).count()
        return jsonify({
            'inactive_count': count,
            'not_active_count': User.query.filter(
                User.username != 'admin',
                User.last_activity < datetime.utcnow() - timedelta(days=NOT_ACTIVE_DAYS),
                User.last_activity >= datetime.utcnow() - timedelta(days=INACTIVE_DAYS)
            ).count(),
            'threshold_7d': NOT_ACTIVE_DAYS,
            'threshold_30d': INACTIVE_DAYS
        }), 200
    except Exception as e:
        return jsonify({'inactive_count': 0, 'not_active_count': 0}), 200


# ── CRUD (unchanged from previous version) ─────────────────────
@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        if user.username == 'admin':
            return jsonify({'msg': 'Cannot modify the default admin account'}), 403
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'is_admin' in data:
            user.is_admin = data['is_admin']
        db.session.commit()
        return jsonify({'msg': 'User updated successfully', 'user': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Error updating user'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        if user.username == 'admin':
            return jsonify({'msg': 'Cannot delete the default admin account'}), 403
        if user.id == session.get('user_id'):
            return jsonify({'msg': 'Cannot delete your own account'}), 403
        PersonalAssessment.query.filter_by(user_id=user_id).delete()
        RealAssessment.query.filter_by(user_id=user_id).delete()
        AssessmentResult.query.filter_by(user_id=user_id).delete()
        PasswordResetToken.query.filter_by(user_id=user_id).delete()
        db.session.delete(user)
        db.session.commit()
        return jsonify({'msg': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error deleting user: {str(e)}'}), 500

@admin_bp.route('/users/new-count', methods=['GET'])
@admin_required
def get_new_users_count():
    try:
        since = request.args.get('since')
        if since:
            try:
                since_date = datetime.fromisoformat(since.replace('Z', '+00:00'))
            except:
                since_date = datetime.utcnow() - timedelta(days=7)
        else:
            since_date = datetime.utcnow() - timedelta(days=7)
        count = User.query.filter(User.created_at >= since_date, User.username != 'admin').count()
        return jsonify({'new_count': count, 'since': since_date.isoformat()}), 200
    except Exception as e:
        return jsonify({'new_count': 0}), 200

@admin_bp.route('/users/new-users-stats', methods=['GET'])
@admin_required
def get_new_users_stats():
    try:
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        prev_month_ago = month_ago - timedelta(days=30)
        today_count = User.query.filter(User.created_at >= today_start, User.username != 'admin').count()
        this_week_count = User.query.filter(User.created_at >= week_ago, User.username != 'admin').count()
        this_month_count = User.query.filter(User.created_at >= month_ago, User.username != 'admin').count()
        total_count = User.query.filter(User.username != 'admin').count()
        prev_month_count = User.query.filter(
            User.created_at >= prev_month_ago, User.created_at < month_ago, User.username != 'admin'
        ).count()
        growth_rate = 0
        if prev_month_count > 0:
            growth_rate = round(((this_month_count - prev_month_count) / prev_month_count) * 100, 1)
        elif this_month_count > 0:
            growth_rate = 100.0
        return jsonify({
            'today': today_count, 'this_week': this_week_count,
            'this_month': this_month_count, 'total': total_count,
            'growth_rate': growth_rate, 'prev_month': prev_month_count
        }), 200
    except Exception as e:
        return jsonify({'msg': 'Error fetching stats'}), 500


# ============================================================
# EMAIL INACTIVE USERS
# ============================================================
@admin_bp.route('/users/email-inactive', methods=['POST'])
@admin_required
def email_inactive_users():
    try:
        data = request.get_json(silent=True) or {}
        days = int(data.get('days', INACTIVE_DAYS))
        dry_run = data.get('dry_run', False)
        specific_ids = data.get('user_ids', None)
        threshold = datetime.utcnow() - timedelta(days=days)
        
        query = User.query.filter(
            User.username != 'admin',
            User.is_admin == False,
            User.email.isnot(None),
            User.email != '',
            or_(User.last_activity < threshold, User.last_activity == None)
        )
        if specific_ids:
            query = query.filter(User.id.in_(specific_ids))
        inactive_users = query.all()
        
        mail = current_app.extensions.get('mail')
        if not mail:
            return jsonify({'msg': 'Email system is not configured'}), 500
        
        sent_count = 0
        failed_count = 0
        failed_emails = []
        emailed_users = []
        
        for user in inactive_users:
            try:
                if not dry_run:
                    msg = Message(
                        subject=f"We Miss You at CareerCompass, {user.first_name}!",
                        recipients=[user.email],
                        html=f'''
                        <!DOCTYPE html>
                        <html>
                        <head><style>
                            body{{font-family:Arial,sans-serif;line-height:1.6;color:#333}}
                            .container{{max-width:600px;margin:0 auto;padding:20px}}
                            .header{{background:linear-gradient(135deg,#4A6A3B,#A3C9A8);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}}
                            .content{{background:#f9f7f3;padding:30px;border-radius:0 0 10px 10px}}
                            .button{{display:inline-block;background:#4A6A3B;color:white;padding:14px 32px;text-decoration:none;border-radius:30px;font-weight:bold;margin:20px 0}}
                            .footer{{margin-top:30px;font-size:12px;color:#666;text-align:center}}
                        </style></head>
                        <body><div class="container">
                            <div class="header"><h1>CareerCompass</h1><p>We Miss You!</p></div>
                            <div class="content">
                                <p>Hello {user.first_name},</p>
                                <p>It's been a while since we last saw you on <strong>CareerCompass</strong>. We noticed you haven't been active for over {days} days, and we wanted to check in.</p>
                                <p>Whether you're still exploring career paths or ready to discover new opportunities, we're here to help you navigate your future.</p>
                                <p style="text-align: center;"><a href="http://localhost:3000/login" class="button">Return to CareerCompass</a></p>
                                <p>Here's what you can do:</p>
                                <ul>
                                    <li><strong>Explore new career categories</strong> and find your perfect fit</li>
                                    <li><strong>Take an assessment</strong> to discover matching programs</li>
                                    <li><strong>View job opportunities</strong> tailored to your results</li>
                                </ul>
                                <p>Your career journey is important to us. Come back anytime!</p>
                                <p>Best regards,<br>The CareerCompass Team</p>
                            </div>
                            <div class="footer"><p>&copy; {datetime.utcnow().year} CareerCompass. All rights reserved.</p></div>
                        </div></body></html>''',
                        body=f"Hello {user.first_name},\n\nIt's been a while since we last saw you on CareerCompass. We noticed you haven't been active for over {days} days.\n\nVisit http://localhost:3000/login to return.\n\n– The CareerCompass Team"
                    )
                    app = current_app._get_current_object()
                    Thread(target=_send_mail_thread, args=(app, msg), daemon=True).start()
                sent_count += 1
                emailed_users.append({
                    'id': user.id, 'username': user.username,
                    'first_name': user.first_name, 'last_name': user.last_name,
                    'email': user.email,
                    'last_activity': user.last_activity.isoformat() if user.last_activity else None
                })
            except Exception as e:
                failed_count += 1
                failed_emails.append({'id': user.id, 'email': user.email, 'error': str(e)})
        
        return jsonify({
            'msg': f'{"Dry run: " if dry_run else ""}{"Would have sent" if dry_run else "Sent"} {sent_count} email(s){", " + str(failed_count) + " failed" if failed_count > 0 else ""}',
            'dry_run': dry_run, 'sent_count': sent_count, 'failed_count': failed_count,
            'total_inactive': len(inactive_users), 'days_threshold': days,
            'emailed_users': emailed_users,
            'failed_emails': failed_emails if failed_emails else None
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'msg': f'Error: {str(e)}'}), 500

@admin_bp.route('/users/inactive-preview', methods=['GET'])
@admin_required
def preview_inactive_users():
    try:
        days = request.args.get('days', INACTIVE_DAYS, type=int)
        threshold = datetime.utcnow() - timedelta(days=days)
        users = User.query.filter(
            User.username != 'admin', User.is_admin == False,
            User.email.isnot(None), User.email != '',
            or_(User.last_activity < threshold, User.last_activity == None)
        ).all()
        data = [{
            'id': u.id, 'username': u.username,
            'first_name': u.first_name, 'last_name': u.last_name, 'email': u.email,
            'last_activity': u.last_activity.isoformat() if u.last_activity else None,
            'created_at': u.created_at.isoformat() if u.created_at else None
        } for u in users]
        return jsonify({'count': len(data), 'days_threshold': days, 'users': data}), 200
    except Exception as e:
        return jsonify({'msg': 'Error'}), 500


# ============================================================
# CATEGORIES, COURSES, JOBS, REPORTS (unchanged – abbreviated)
# ============================================================

@admin_bp.route('/categories', methods=['GET'])
@admin_required
def get_categories():
    try:
        search = request.args.get('search', '')
        query = CareerCategory.query
        if search:
            query = query.filter(CareerCategory.name.ilike(f'%{search}%'))
        return jsonify([c.to_dict() for c in query.order_by(CareerCategory.display_order).all()]), 200
    except Exception as e:
        return jsonify({'msg': 'Error loading categories'}), 500

@admin_bp.route('/categories', methods=['POST'])
@admin_required
def create_category():
    try:
        data = request.get_json()
        if not data.get('name'):
            return jsonify({'msg': 'Category name required'}), 400
        if CareerCategory.query.filter_by(name=data['name']).first():
            return jsonify({'msg': 'Category already exists'}), 400
        cat = CareerCategory(
            name=data['name'], description=data.get('description', ''),
            icon=data.get('icon', 'FolderIcon'), color=data.get('color', 'gray'),
            display_order=data.get('display_order', 0), image_url=data.get('image_url', None)
        )
        db.session.add(cat)
        db.session.commit()
        return jsonify({'msg': 'Category created', 'id': cat.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Error creating category'}), 500

@admin_bp.route('/categories/<int:category_id>', methods=['PUT'])
@admin_required
def update_category(category_id):
    try:
        cat = CareerCategory.query.get_or_404(category_id)
        data = request.get_json()
        for f in ['name','description','icon','color','display_order','image_url']:
            if f in data: setattr(cat, f, data[f])
        db.session.commit()
        return jsonify({'msg': 'Category updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Error updating category'}), 500

@admin_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    try:
        cat = CareerCategory.query.get_or_404(category_id)
        Course.query.filter_by(category_id=category_id).delete()
        AssessmentResult.query.filter_by(category_id=category_id).delete()
        PersonalAssessment.query.filter_by(category_id=category_id).delete()
        db.session.delete(cat)
        db.session.commit()
        return jsonify({'msg': 'Category deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error: {str(e)}'}), 500

@admin_bp.route('/categories/upload-image', methods=['POST'])
@admin_required
def upload_category_image():
    try:
        if 'image' not in request.files:
            return jsonify({'msg': 'No image'}), 400
        file = request.files['image']
        if file.filename == '':
            return jsonify({'msg': 'No image selected'}), 400
        if file and allowed_file(file.filename):
            ext = file.filename.rsplit('.',1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            return jsonify({'msg': 'Uploaded', 'image_url': f"/static/uploads/categories/{filename}"}), 200
        return jsonify({'msg': 'Invalid file type'}), 400
    except Exception as e:
        return jsonify({'msg': 'Error uploading'}), 500

@admin_bp.route('/categories/<int:category_id>/users', methods=['GET'])
@admin_required
def get_category_assessment_users(category_id):
    try:
        cat = CareerCategory.query.get_or_404(category_id)
        results = db.session.query(AssessmentResult, User).join(
            User, AssessmentResult.user_id == User.id
        ).filter(
            AssessmentResult.category_id == category_id,
            User.username != 'admin', User.is_admin == False
        ).order_by(AssessmentResult.created_at.desc()).all()
        seen, data = set(), []
        for r, u in results:
            if u.id in seen: continue
            seen.add(u.id)
            tc = r.recommended_courses[0] if r.recommended_courses else None
            data.append({
                'user_id': u.id, 'user_name': f"{u.first_name} {u.last_name}",
                'username': u.username, 'profile_picture': u.profile_picture,
                'top_match_score': tc.get('score') if tc else None,
                'top_match_course': tc.get('course_code') if tc else None,
                'assessed_at': r.created_at.isoformat()
            })
        return jsonify({'category': cat.to_dict(), 'users': data, 'count': len(data)}), 200
    except Exception as e:
        return jsonify({'msg': 'Error'}), 500

# Courses
@admin_bp.route('/courses', methods=['GET'])
@admin_required
def get_courses():
    try:
        page = request.args.get('page',1,type=int)
        per_page = request.args.get('per_page',100,type=int)
        search = request.args.get('search','')
        category_id = request.args.get('category_id',type=int)
        query = Course.query
        if search:
            query = query.filter(or_(Course.course_code.ilike(f'%{search}%'), Course.course_name.ilike(f'%{search}%')))
        if category_id:
            query = query.filter_by(category_id=category_id)
        paginated = query.order_by(Course.course_code).paginate(page=page,per_page=per_page,error_out=False)
        return jsonify({'courses':[c.to_dict() for c in paginated.items],'total':paginated.total,'pages':paginated.pages,'current_page':paginated.page,'per_page':per_page}),200
    except Exception as e:
        return jsonify({'msg':'Error loading courses'}),500

@admin_bp.route('/courses', methods=['POST'])
@admin_required
def create_course():
    try:
        data = request.get_json()
        if not all(k in data for k in ['course_code','course_name','category_id']):
            return jsonify({'msg':'Missing required fields'}),400
        if Course.query.filter_by(course_code=data['course_code']).first():
            return jsonify({'msg':'Course code already exists'}),400
        c = Course(course_code=data['course_code'].upper(),course_name=data['course_name'],
                   description=data.get('description',''),category_id=data['category_id'],
                   duration=data.get('duration','4 years'),icon=data.get('icon','📘'),color=data.get('color','gray'))
        db.session.add(c); db.session.commit()
        return jsonify({'msg':'Course created','id':c.id}),201
    except Exception as e:
        db.session.rollback(); return jsonify({'msg':'Error'}),500

@admin_bp.route('/courses/<int:course_id>', methods=['PUT'])
@admin_required
def update_course(course_id):
    try:
        c = Course.query.get_or_404(course_id)
        data = request.get_json()
        for f in ['course_code','course_name','description','category_id','duration','icon','color']:
            if f in data:
                setattr(c, f, data[f].upper() if f=='course_code' else data[f])
        db.session.commit(); return jsonify({'msg':'Course updated'}),200
    except Exception as e:
        db.session.rollback(); return jsonify({'msg':'Error'}),500

@admin_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@admin_required
def delete_course(course_id):
    try:
        c = Course.query.get_or_404(course_id)
        db.session.delete(c); db.session.commit()
        return jsonify({'msg':'Course deleted'}),200
    except Exception as e:
        db.session.rollback(); return jsonify({'msg':str(e)}),500

@admin_bp.route('/courses/<int:course_id>/matches', methods=['GET'])
@admin_required
def get_course_matches(course_id):
    try:
        c = Course.query.get_or_404(course_id)
        results = AssessmentResult.query.filter_by(category_id=c.category_id).order_by(AssessmentResult.created_at.desc()).all()
        best = {}
        for r in results:
            if r.recommended_courses:
                for rec in r.recommended_courses:
                    if rec.get('course_id')==c.id:
                        u = User.query.get(r.user_id)
                        if u and (u.id not in best or rec.get('score',0) > best[u.id]['score']):
                            best[u.id] = {'user_id':u.id,'user_name':f"{u.first_name} {u.last_name}",'username':u.username,'profile_picture':u.profile_picture,'score':rec.get('score',0),'assessed_at':r.created_at.isoformat(),'match_level':rec.get('match_level','')}
                        break
        matches = sorted(best.values(), key=lambda x:(-x['score'],x['assessed_at']))
        return jsonify({'course':c.to_dict(),'matches':matches[:20]}),200
    except Exception as e:
        return jsonify({'msg':'Error'}),500

# Jobs
@admin_bp.route('/jobs', methods=['GET'])
@admin_required
def get_jobs():
    try:
        page=request.args.get('page',1,type=int); per_page=request.args.get('per_page',10,type=int)
        search=request.args.get('search',''); source=request.args.get('source','')
        query=JobListing.query
        if search: query=query.filter(or_(JobListing.title.ilike(f'%{search}%'),JobListing.company.ilike(f'%{search}%'),JobListing.description.ilike(f'%{search}%')))
        if source: query=query.filter_by(source=source)
        paginated=query.order_by(JobListing.created_at.desc()).paginate(page=page,per_page=per_page,error_out=False)
        return jsonify({'jobs':[j.to_dict() for j in paginated.items],'total':paginated.total,'pages':paginated.pages,'current_page':paginated.page}),200
    except Exception as e:
        return jsonify({'msg':'Error'}),500

@admin_bp.route('/jobs', methods=['POST'])
@admin_required
def create_job():
    try:
        data=request.get_json()
        if not all(k in data for k in ['company','title']): return jsonify({'msg':'Missing fields'}),400
        j=JobListing(external_id=data.get('external_id'),company=data['company'],title=data['title'],location=data.get('location','Philippines'),description=data.get('description',''),skills=data.get('skills',[]),salary_min=data.get('salary_min'),salary_max=data.get('salary_max'),currency=data.get('currency','₱'),job_url=data.get('job_url'),source=data.get('source','admin'),posted_at=data.get('posted_at',datetime.utcnow()))
        db.session.add(j); db.session.commit()
        return jsonify({'msg':'Job created','id':j.id}),201
    except Exception as e:
        db.session.rollback(); return jsonify({'msg':'Error'}),500

@admin_bp.route('/jobs/<int:job_id>', methods=['PUT'])
@admin_required
def update_job(job_id):
    try:
        j=JobListing.query.get_or_404(job_id); data=request.get_json()
        for f in ['company','title','location','description','skills','salary_min','salary_max','currency','job_url','source']:
            if f in data: setattr(j,f,data[f])
        if 'posted_at' in data and data['posted_at']: j.posted_at=datetime.fromisoformat(data['posted_at'].replace('Z','+00:00'))
        db.session.commit(); return jsonify({'msg':'Job updated'}),200
    except Exception as e:
        db.session.rollback(); return jsonify({'msg':'Error'}),500

@admin_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@admin_required
def delete_job(job_id):
    try:
        j=JobListing.query.get_or_404(job_id); db.session.delete(j); db.session.commit()
        return jsonify({'msg':'Job deleted'}),200
    except Exception as e:
        db.session.rollback(); return jsonify({'msg':'Error'}),500

@admin_bp.route('/jobs/stats', methods=['GET'])
@admin_required
def get_job_stats():
    """Return job statistics, removing legacy Jooble references."""
    try:
        total = JobListing.query.count()
        # Combine mock sources (mock, ph_mock, admin) under one 'mock' count
        mock_jobs = JobListing.query.filter(
            JobListing.source.in_(['mock', 'ph_mock', 'admin'])
        ).count()
        # Real jobs from API (Adzuna) – anything not mock
        adzuna_jobs = total - mock_jobs
        return jsonify({
            'total_jobs': total,
            'adzuna_jobs': adzuna_jobs,
            'mock_jobs': mock_jobs
        }), 200
    except Exception as e:
        print(f"Error fetching job stats: {e}")
        return jsonify({'msg': 'Error fetching job stats'}), 500

# API Config
@admin_bp.route('/api-config', methods=['GET'])
@admin_required
def get_api_config():
    s=Setting.query.filter_by(key='api_mode').first()
    return jsonify({'api_mode':s.value if s else 'MOCK_MODE'}),200

@admin_bp.route('/api-mode', methods=['POST'])
@admin_required
def set_api_mode():
    try:
        data=request.get_json(); mode=data.get('mode')
        if mode not in ['MOCK_MODE','REALTIME_MODE']: return jsonify({'msg':'Invalid mode'}),400
        s=Setting.query.filter_by(key='api_mode').first()
        if s: s.value=mode
        else: s=Setting(key='api_mode',value=mode); db.session.add(s)
        db.session.commit(); current_app.config['API_MODE']=mode
        return jsonify({'msg':f'API mode set to {mode}','mode':mode}),200
    except Exception as e:
        db.session.rollback(); return jsonify({'msg':'Error'}),500

@admin_bp.route('/api-status', methods=['GET'])
@admin_required
def get_api_status():
    """Return API configuration status (Adzuna instead of Jooble)."""
    s = Setting.query.filter_by(key='api_mode').first()
    mode = s.value if s else 'MOCK_MODE'
    return jsonify({
        'api_mode': mode,
        'adzuna_configured': bool(current_app.config.get('ADZUNA_APP_ID') and
                                  current_app.config.get('ADZUNA_APP_KEY')),
        'groq_configured': bool(current_app.config.get('GROQ_API_KEY'))
    }), 200

# Reports
@admin_bp.route('/reports/categories', methods=['GET'])
@admin_required
def category_reports():
    try:
        result=[]
        for cat in CareerCategory.query.all():
            total=AssessmentResult.query.filter_by(category_id=cat.id).count()
            scores=[]
            for r in AssessmentResult.query.filter_by(category_id=cat.id).all():
                if r.scores: scores.extend([float(s) for s in r.scores.values()])
            avg=round(sum(scores)/len(scores),1) if scores else 0
            result.append({'category_id':cat.id,'category_name':cat.name,'total_assessments':total,'avg_score':avg})
        return jsonify(result),200
    except Exception as e:
        return jsonify({'msg':'Error'}),500

@admin_bp.route('/reports/courses', methods=['GET'])
@admin_required
def course_reports():
    try:
        result=[]
        for c in Course.query.all():
            rec_count=0; scores=[]
            for r in AssessmentResult.query.filter_by(category_id=c.category_id).all():
                if r.recommended_courses:
                    for rec in r.recommended_courses:
                        if rec.get('course_id')==c.id: rec_count+=1
                if r.scores and str(c.id) in r.scores: scores.append(float(r.scores[str(c.id)]))
            avg=round(sum(scores)/len(scores),1) if scores else 0
            result.append({'course_id':c.id,'course_code':c.course_code,'course_name':c.course_name,'category_name':c.category.name if c.category else None,'recommendation_count':rec_count,'avg_score':avg})
        return jsonify(result),200
    except Exception as e:
        return jsonify({'msg':'Error'}),500

@admin_bp.route('/reports/daily-growth', methods=['GET'])
@admin_required
def get_daily_growth():
    try:
        days=request.args.get('days',7,type=int)
        daily=[]; cumulative=0
        start=datetime.utcnow().date()-timedelta(days=days)
        cumulative=User.query.filter(User.created_at<datetime.combine(start,datetime.min.time()),User.username!='admin').count()
        for i in range(days-1,-1,-1):
            date=datetime.utcnow().date()-timedelta(days=i)
            ds=datetime.combine(date,datetime.min.time()); de=datetime.combine(date,datetime.max.time())
            uc=User.query.filter(User.created_at>=ds,User.created_at<=de,User.username!='admin').count()
            cumulative+=uc
            ac=AssessmentResult.query.filter(AssessmentResult.created_at>=ds,AssessmentResult.created_at<=de).count()
            daily.append({'date':date.strftime('%b %d'),'users':uc,'assessments':ac,'cumulative_users':cumulative,'full_date':date.isoformat()})
        return jsonify({'daily_data':daily,'total_users':sum(d['users'] for d in daily),'total_assessments':sum(d['assessments'] for d in daily),'current_total_users':cumulative}),200
    except Exception as e:
        return jsonify({'msg':'Error'}),500