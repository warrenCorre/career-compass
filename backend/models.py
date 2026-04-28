# backend/models.py - JobListing connected to AssessmentResult

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
from sqlalchemy import Index
import json

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    age = db.Column(db.Integer)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    profile_picture = db.Column(db.String(255))
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    last_activity = db.Column(db.DateTime)  # NEW: Track last activity
    failed_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime)
    
    # Relationships
    personal_assessments = db.relationship('PersonalAssessment', backref='user', lazy='dynamic')
    real_assessments = db.relationship('RealAssessment', backref='user', lazy='dynamic')
    assessment_results = db.relationship('AssessmentResult', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        # Always append 'Z' to UTC datetimes so browsers parse them as UTC,
        # not as local time. Without 'Z', new Date("2026-04-21T13:51:00") is
        # treated as LOCAL time (UTC+8 in PH), making activity checks wrong.
        def utc_iso(dt):
            if dt is None:
                return None
            return dt.strftime('%Y-%m-%dT%H:%M:%S') + 'Z'

        result = {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'username': self.username,
            'email': self.email,
            'age': self.age,
            'profile_picture': self.profile_picture,
            'is_admin': self.is_admin,
            'is_active': self.is_active,
            'created_at': utc_iso(self.created_at),
            'last_login': utc_iso(self.last_login),
        }

        # Safely add last_activity if it exists
        try:
            result['last_activity'] = utc_iso(self.last_activity)
        except AttributeError:
            result['last_activity'] = None

        return result

class CareerCategory(db.Model):
    __tablename__ = 'career_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))
    color = db.Column(db.String(20))
    display_order = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(500))
    
    courses = db.relationship('Course', backref='category', lazy='dynamic')
    personal_assessments = db.relationship('PersonalAssessment', backref='category', lazy='dynamic')
    real_assessments = db.relationship('RealAssessment', backref='category', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'display_order': self.display_order,
            'image_url': self.image_url
        }

class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('career_categories.id'), nullable=False)
    course_code = db.Column(db.String(20), unique=True, nullable=False)
    course_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    duration = db.Column(db.String(50), default="4 years")
    icon = db.Column(db.String(50))
    color = db.Column(db.String(20))
    
    # Relationships
    assessment_results = db.relationship('AssessmentResult', backref='top_course', foreign_keys='AssessmentResult.top_course_id', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'course_code': self.course_code,
            'course_name': self.course_name,
            'description': self.description,
            'duration': self.duration,
            'icon': self.icon,
            'color': self.color
        }

class PersonalAssessment(db.Model):
    __tablename__ = 'personal_assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('career_categories.id'), nullable=False)
    answers = db.Column(db.JSON, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    real_assessments = db.relationship('RealAssessment', backref='personal_assessment', lazy='dynamic')
    assessment_results = db.relationship('AssessmentResult', backref='personal_assessment', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'answers': self.answers,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'has_real_assessment': self.real_assessments.count() > 0
        }

class RealAssessment(db.Model):
    __tablename__ = 'real_assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('career_categories.id'), nullable=True)
    personal_assessment_id = db.Column(db.Integer, db.ForeignKey('personal_assessments.id'), nullable=True)
    answers = db.Column(db.JSON, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    time_spent = db.Column(db.Integer)
    
    # Relationships
    assessment_results = db.relationship('AssessmentResult', backref='real_assessment', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'personal_assessment_id': self.personal_assessment_id,
            'answers': self.answers,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'time_spent': self.time_spent
        }

class AssessmentResult(db.Model):
    __tablename__ = 'assessment_results'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    personal_assessment_id = db.Column(db.Integer, db.ForeignKey('personal_assessments.id'), nullable=False)
    real_assessment_id = db.Column(db.Integer, db.ForeignKey('real_assessments.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('career_categories.id'), nullable=False)
    top_course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=True)
    
    # Core result data
    scores = db.Column(db.JSON, nullable=False)
    skill_scores = db.Column(db.JSON, nullable=True)
    skill_gaps = db.Column(db.JSON, nullable=True)
    recommended_courses = db.Column(db.JSON, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    category = db.relationship('CareerCategory')
    
    # ✅ NEW: Relationship to job listings
    job_listings = db.relationship('JobListing', backref='assessment_result', lazy='dynamic')
    
    __table_args__ = (
        Index('idx_assessment_results_top_course_id', 'top_course_id'),
        Index('idx_assessment_results_user_id', 'user_id'),
        Index('idx_assessment_results_category_id', 'category_id'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'top_course_id': self.top_course_id,
            'top_course_code': self.top_course.course_code if self.top_course else None,
            'top_course_name': self.top_course.course_name if self.top_course else None,
            'scores': self.scores,
            'skill_scores': self.skill_scores if self.skill_scores else {},
            'skill_gaps': self.skill_gaps if self.skill_gaps else [],
            'recommended_courses': self.recommended_courses if self.recommended_courses else [],
            'job_count': self.job_listings.count(),
            'created_at': self.created_at.isoformat()
        }

class JobListing(db.Model):
    __tablename__ = 'job_listings'
    
    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(255), unique=True, nullable=True)
    assessment_result_id = db.Column(db.Integer, db.ForeignKey('assessment_results.id'), nullable=True)  # ✅ NEW FK
    company = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(100))
    description = db.Column(db.Text)
    skills = db.Column(db.JSON)
    salary_min = db.Column(db.Float)
    salary_max = db.Column(db.Float)
    currency = db.Column(db.String(10), default='₱')
    job_url = db.Column(db.String(500))
    source = db.Column(db.String(50))
    posted_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_job_listings_assessment_result_id', 'assessment_result_id'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'assessment_result_id': self.assessment_result_id,
            'company': self.company,
            'title': self.title,
            'location': self.location,
            'description': self.description,
            'skills': self.skills or [],
            'salary_min': self.salary_min,
            'salary_max': self.salary_max,
            'currency': self.currency,
            'job_url': self.job_url,
            'source': self.source,
            'posted_at': self.posted_at.isoformat() if self.posted_at else None
        }

class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(128), unique=True, nullable=False)
    reset_code = db.Column(db.String(6))
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='reset_tokens')

class Setting(db.Model):
    """Simple key-value store for application settings"""
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Setting {self.key}={self.value}>'