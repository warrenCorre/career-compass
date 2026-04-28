# backend/controllers/student_controller.py - CLEANED (No UserInterest, No Career)

from flask import Blueprint, request, jsonify, session
from models import (
    db, User, CareerCategory, Course, PersonalAssessment,
    RealAssessment, AssessmentResult, JobListing
)
from services.job_api_service import JobAPIService
from utils.auth import login_required
from datetime import datetime
import json
import random
import os
import uuid
import re
import logging

logger = logging.getLogger(__name__)

student_bp = Blueprint('student', __name__)

# Expanded skill mapping
SKILL_NAME_MAP = {
    # Technology
    'troubleshooting': 'Troubleshooting',
    'technical': 'Technical Knowledge',
    'learning': 'Learning Ability',
    'adaptability': 'Adaptability',
    'digital_literacy': 'Digital Skills',
    'safety': 'Online Safety',
    'organization': 'Organization',
    'research': 'Research Skills',
    'computer_skills': 'Computer Skills',
    'apps': 'App Proficiency',
    'online_skills': 'Online Research',
    
    # Healthcare
    'first_aid': 'First Aid',
    'calmness': 'Staying Calm',
    'patient_care': 'Patient Care',
    'clinical': 'Clinical Skills',
    'empathy': 'Empathy',
    'understanding': 'Understanding Others',
    'listening': 'Active Listening',
    'support': 'Supporting Others',
    
    # Education
    'teaching': 'Teaching Ability',
    'patience': 'Patience',
    'explaining': 'Explaining Concepts',
    'instruction': 'Instruction',
    'engagement': 'Engagement',
    'public_speaking': 'Public Speaking',
    
    # Engineering
    'problem_solving': 'Problem Solving',
    'analytical': 'Analytical Thinking',
    'measurement': 'Measurement',
    'estimation': 'Estimation',
    'spatial_reasoning': 'Spatial Reasoning',
    'visualization': 'Visualization',
    'building': 'Building/Assembly',
    'fixing': 'Fixing Things',
    'following_instructions': 'Following Instructions',
    
    # Arts & Media
    'creativity': 'Creativity',
    'design': 'Design Sense',
    'photography': 'Photography',
    'writing': 'Writing',
    'storytelling': 'Storytelling',
    'aesthetic_sense': 'Aesthetic Sense',
    'content_creation': 'Content Creation',
    
    # Social Sciences
    'perspective_taking': 'Perspective Taking',
    'communication': 'Communication',
    'respect': 'Respect',
    'observation': 'Observation',
    'analysis': 'Analysis',
    'critical_thinking': 'Critical Thinking',
    
    # Hospitality
    'welcoming': 'Welcoming Others',
    'friendliness': 'Friendliness',
    'customer_service': 'Customer Service',
    'memory': 'Memory',
    'attention': 'Attention to Detail',
    'multitasking': 'Multitasking',
    'stress_management': 'Stress Management',
    'service_mindset': 'Service Mindset',
    
    # Business
    'leadership': 'Leadership',
    'initiative': 'Initiative',
    'planning': 'Planning',
    'money_management': 'Money Management',
    'responsibility': 'Responsibility',
    'decision_making': 'Decision Making',
    'persuasion': 'Persuasion',
    'time_management': 'Time Management',
    'confidence': 'Confidence',
    
    # General
    'career_goals': 'Career Goals',
    'general': 'General Skills',
    'helpfulness': 'Helpfulness'
}

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads', 'profiles')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_job_keywords(course_name, course_code):
    """Extract job-relevant keywords from course name"""
    cleaned = course_name
    cleaned = re.sub(r'Bachelor of Science in', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Bachelor of', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Master of Science in', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    
    course_keywords = {
        'Information Technology': ['Software Developer', 'IT Support', 'Web Developer', 'Programmer'],
        'Computer Science': ['Software Engineer', 'Programmer', 'Web Developer', 'Developer'],
        'Nursing': ['Staff Nurse', 'Registered Nurse', 'Clinical Nurse'],
        'Medical Technology': ['Medical Technologist', 'Lab Analyst'],
        'Education': ['Teacher', 'Instructor', 'Educator'],
        'Civil Engineering': ['Civil Engineer', 'Project Engineer', 'Site Engineer'],
        'Mechanical Engineering': ['Mechanical Engineer', 'Design Engineer'],
        'Electrical Engineering': ['Electrical Engineer', 'Electronics Engineer'],
        'Business Administration': ['Business Manager', 'Marketing Specialist', 'Operations Manager'],
        'Accountancy': ['Accountant', 'Auditor', 'Finance Associate']
    }
    
    for key, keywords in course_keywords.items():
        if key.lower() in cleaned.lower() or key.lower() in course_code.lower():
            return keywords
    
    if cleaned and len(cleaned) > 3 and not cleaned.lower() in ['bachelor', 'science', 'of']:
        return [cleaned, f"{cleaned} Junior", f"{cleaned} Trainee"]
    
    if 'IT' in course_code.upper():
        return ['Software Developer', 'IT Support', 'Web Developer']
    elif 'CS' in course_code.upper():
        return ['Software Engineer', 'Programmer', 'Developer']
    elif 'NUR' in course_code.upper() or 'BSN' in course_code.upper():
        return ['Staff Nurse', 'Registered Nurse']
    elif 'ED' in course_code.upper():
        return ['Teacher', 'Instructor']
    elif 'ENG' in course_code.upper():
        return ['Engineer', 'Project Engineer']
    elif 'ACC' in course_code.upper():
        return ['Accountant', 'Finance Associate']
    
    return ['Entry Level', 'Graduate Trainee', 'Junior Associate']


@student_bp.route('/upload-profile-picture', methods=['POST'])
@login_required
def upload_profile_picture():
    """Upload profile picture for current user"""
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if 'image' not in request.files:
            return jsonify({'msg': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'msg': 'No image selected'}), 400
        
        if file and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            
            # Delete old profile picture if exists
            if user.profile_picture and user.profile_picture.startswith('/static/uploads/profiles/'):
                old_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), user.profile_picture.lstrip('/'))
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except:
                        pass
            
            profile_url = f"/static/uploads/profiles/{filename}"
            user.profile_picture = profile_url
            db.session.commit()
            
            return jsonify({
                'msg': 'Profile picture uploaded successfully',
                'profile_picture_url': profile_url
            }), 200
        else:
            return jsonify({'msg': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp'}), 400
            
    except Exception as e:
        logger.exception("Error uploading profile picture for user: %s", e)
        return jsonify({'msg': 'Error uploading profile picture'}), 500


@student_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    """Get comprehensive user dashboard data WITHOUT JOBS (fast loading)"""
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'msg': 'User not found'}), 404
        
        # Get ALL assessment results for this user
        all_results = AssessmentResult.query.filter_by(user_id=user_id)\
            .order_by(AssessmentResult.created_at.desc()).all()
        
        # Get latest result for main dashboard
        result = all_results[0] if all_results else None
        
        # Get the category from the latest personal assessment
        latest_personal = PersonalAssessment.query.filter_by(user_id=user_id)\
            .order_by(PersonalAssessment.completed_at.desc()).first()
        
        dashboard_data = {
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'username': user.username,
                'email': user.email,
                'age': user.age,
                'profile_picture': user.profile_picture
            },
            'has_personal_assessment': latest_personal is not None,
            'has_real_assessment': RealAssessment.query.filter_by(user_id=user_id).first() is not None,
            'has_results': result is not None,
            'selected_category': latest_personal.category.to_dict() if latest_personal and latest_personal.category else None,
            'all_categories_taken': []
        }
        
        # Collect all categories the user has taken assessments for
        categories_taken = {}
        for assessment in all_results:
            category = CareerCategory.query.get(assessment.category_id)
            if category:
                if category.id not in categories_taken:
                    categories_taken[category.id] = {
                        'category_id': category.id,
                        'category_name': category.name,
                        'result_id': assessment.id,
                        'created_at': assessment.created_at
                    }
        
        dashboard_data['all_categories_taken'] = list(categories_taken.values())
        
        if result:
            # Format skill scores with proper names
            formatted_skills = []
            if result.skill_scores:
                if isinstance(result.skill_scores, dict):
                    for key, value in result.skill_scores.items():
                        skill_name = SKILL_NAME_MAP.get(key, key.replace('_', ' ').title())
                        formatted_skills.append({
                            'name': skill_name,
                            'key': key,
                            'score': value,
                            'level': 'Strong' if value >= 70 else
                                     'Developing' if value >= 50 else
                                     'Needs Work' if value >= 30 else
                                     'Foundation'
                        })
                elif isinstance(result.skill_scores, list):
                    formatted_skills = result.skill_scores
            
            if formatted_skills and isinstance(formatted_skills[0], dict) and 'score' in formatted_skills[0]:
                formatted_skills.sort(key=lambda x: x['score'], reverse=True)
            
            dashboard_data['results'] = {
                'scores': result.scores,
                'skill_scores': formatted_skills,
                'skill_gaps': result.skill_gaps if result.skill_gaps else [],
                'recommended_courses': result.recommended_courses if result.recommended_courses else [],
                'created_at': result.created_at.isoformat()
            }
            dashboard_data['jobs'] = []
            dashboard_data['jobs_count'] = 0
            dashboard_data['categories_count'] = len(categories_taken)
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        logger.exception("Error fetching dashboard: %s", e)
        return jsonify({'msg': 'Error loading dashboard'}), 500


@student_bp.route('/jobs-recommended', methods=['GET'])
@login_required
def get_recommended_jobs_only():
    """Get recommended jobs based on a specific or latest assessment result"""
    try:
        user_id = session['user_id']
        
        # Optional result_id to support historical results
        result_id = request.args.get('result_id', type=int)
        if result_id:
            result = AssessmentResult.query.filter_by(id=result_id, user_id=user_id).first()
            if not result:
                return jsonify({'jobs': [], 'success': False, 'msg': 'Result not found'}), 404
        else:
            result = AssessmentResult.query.filter_by(user_id=user_id)\
                .order_by(AssessmentResult.created_at.desc()).first()
        
        if not result:
            return jsonify({'jobs': [], 'success': True}), 200
        
        all_jobs_data = []
        top_courses = result.recommended_courses[:3] if result.recommended_courses else []
        
        for course_data in top_courses:
            course = Course.query.get(course_data['course_id'])
            if course:
                job_keywords = extract_job_keywords(course.course_name, course.course_code)
                
                for keyword in job_keywords[:2]:
                    db_jobs = JobListing.query.filter(
                        (JobListing.title.contains(keyword)) |
                        (JobListing.description.contains(keyword)) |
                        (JobListing.company.contains(keyword))
                    ).order_by(JobListing.created_at.desc()).limit(2).all()
                    
                    if db_jobs:
                        for job in db_jobs:
                            job_dict = job.to_dict()
                            job_dict['course_match_score'] = course_data['score']
                            job_dict['course_code'] = course.course_code
                            job_dict['course_name'] = course.course_name
                            all_jobs_data.append(job_dict)
                        break
                    else:
                        api_jobs = JobAPIService.fetch_jobs_for_career(keyword, 2)
                        if api_jobs:
                            JobAPIService.save_jobs_to_db(api_jobs)
                            for job in api_jobs:
                                job['course_match_score'] = course_data['score']
                                job['course_code'] = course.course_code
                                job['course_name'] = course.course_name
                                all_jobs_data.append(job)
                            break
        
        unique_jobs = {}
        for job in all_jobs_data:
            job_id = job.get('external_id') or job.get('id')
            if job_id not in unique_jobs:
                unique_jobs[job_id] = job
        
        jobs_list = list(unique_jobs.values())
        random.shuffle(jobs_list)
        jobs = jobs_list[:8]
        jobs.sort(key=lambda x: x.get('course_match_score', 0), reverse=True)
        
        return jsonify({
            'success': True,
            'jobs': jobs,
            'count': len(jobs)
        }), 200
        
    except Exception as e:
        logger.exception("Error fetching recommended jobs: %s", e)
        return jsonify({'jobs': [], 'success': False}), 200


@student_bp.route('/refresh-jobs', methods=['POST'])
@login_required
def refresh_jobs():
    """Manually refresh job listings based on a specific result or all recent results"""
    try:
        user_id = session['user_id']
        # Fix: accept JSON silently, avoid defaulting to type(int)
        data = request.get_json(silent=True) or {}
        result_id = data.get('result_id')  # None if absent, else actual int
        
        if result_id is not None:
            # Refresh for a specific result
            result = AssessmentResult.query.filter_by(id=result_id, user_id=user_id).first()
            if not result or not result.recommended_courses:
                return jsonify({'jobs': [], 'success': False, 'msg': 'Result not found or no courses'}), 200
            
            all_top_courses = []
            for course_data in result.recommended_courses[:3]:
                course = Course.query.get(course_data['course_id'])
                if course:
                    all_top_courses.append({
                        'course': course,
                        'score': course_data['score']
                    })
        else:
            # Existing logic: aggregate from latest 3 results
            all_results = AssessmentResult.query.filter_by(user_id=user_id)\
                .order_by(AssessmentResult.created_at.desc()).limit(3).all()
            
            all_top_courses = []
            for assessment in all_results:
                if assessment.recommended_courses and len(assessment.recommended_courses) > 0:
                    for course_data in assessment.recommended_courses[:2]:
                        course = Course.query.get(course_data['course_id'])
                        if course:
                            all_top_courses.append({
                                'course': course,
                                'score': course_data['score']
                            })
        
        # Deduplicate courses
        unique_courses = {}
        for item in all_top_courses:
            if item['course'].id not in unique_courses:
                unique_courses[item['course'].id] = item
        
        jobs = []
        for course_id, course_data in unique_courses.items():
            course = course_data['course']
            job_keywords = extract_job_keywords(course.course_name, course.course_code)
            
            for keyword in job_keywords[:2]:
                api_jobs = JobAPIService.fetch_jobs_for_career(keyword, 2)
                if api_jobs:
                    JobAPIService.save_jobs_to_db(api_jobs)
                    for job in api_jobs:
                        job['course_match_score'] = course_data['score']
                        job['course_code'] = course.course_code
                        job['course_name'] = course.course_name
                        jobs.append(job)
                    break
        
        random.shuffle(jobs)
        jobs = jobs[:8]
        jobs.sort(key=lambda x: x.get('course_match_score', 0), reverse=True)
        
        return jsonify({
            'success': True,
            'jobs': jobs,
            'count': len(jobs)
        }), 200
        
    except Exception as e:
        logger.exception("Error refreshing jobs: %s", e)
        return jsonify({'jobs': []}), 200


@student_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """Get user profile with results"""
    try:
        user = User.query.get(session['user_id'])
        
        latest_personal = PersonalAssessment.query.filter_by(user_id=user.id)\
            .order_by(PersonalAssessment.completed_at.desc()).first()
        result = AssessmentResult.query.filter_by(user_id=user.id)\
            .order_by(AssessmentResult.created_at.desc()).first()
        
        profile_data = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'age': user.age,
            'email': user.email,
            'username': user.username,
            'profile_picture': user.profile_picture,
            'selected_category': latest_personal.category.to_dict() if latest_personal and latest_personal.category else None,
            'has_results': result is not None
        }
        
        if result:
            profile_data['results'] = {
                'skill_gaps': result.skill_gaps if result.skill_gaps else [],
                'recommended_courses': result.recommended_courses if result.recommended_courses else []
            }
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        logger.exception("Error fetching profile: %s", e)
        return jsonify({'msg': 'Error loading profile'}), 500


@student_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update user profile with optional password change"""
    try:
        user = User.query.get(session['user_id'])
        data = request.get_json()
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        
        if 'username' in data:
            new_username = data['username'].lower()
            existing = User.query.filter(
                User.username == new_username, 
                User.id != user.id
            ).first()
            if existing:
                return jsonify({'msg': 'Username already taken'}), 400
            if not re.match(r'^[a-z0-9_]+$', new_username):
                return jsonify({'msg': 'Username can only contain lowercase letters, numbers, and underscores'}), 400
            user.username = new_username
        
        if 'age' in data:
            try:
                age = int(data['age'])
                if age < 17:
                    return jsonify({'msg': 'You must be at least 17 years old'}), 400
                if age > 100:
                    return jsonify({'msg': 'Please enter a valid age'}), 400
                user.age = age
            except ValueError:
                return jsonify({'msg': 'Invalid age format'}), 400
                
        if 'email' in data:
            if User.query.filter(User.email == data['email'], User.id != user.id).first():
                return jsonify({'msg': 'Email already in use'}), 400
            user.email = data['email']
            
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
        
        if 'old_password' in data and 'new_password' in data:
            if not user.check_password(data['old_password']):
                return jsonify({'msg': 'Current password is incorrect'}), 400
            if len(data['new_password']) < 8:
                return jsonify({'msg': 'New password must be at least 8 characters long'}), 400
            user.set_password(data['new_password'])
        
        db.session.commit()
        return jsonify({'msg': 'Profile updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception("Error updating profile: %s", e)
        return jsonify({'msg': 'Error updating profile'}), 500


@student_bp.route('/categories-taken', methods=['GET'])
@login_required
def get_categories_taken():
    """Get all categories the user has completed assessments for"""
    try:
        user_id = session['user_id']
        
        results = AssessmentResult.query.filter_by(user_id=user_id)\
            .order_by(AssessmentResult.created_at.desc()).all()
        
        categories = []
        category_ids = set()
        
        for result in results:
            if result.category_id not in category_ids:
                category_ids.add(result.category_id)
                category = CareerCategory.query.get(result.category_id)
                if category:
                    categories.append({
                        'id': category.id,
                        'name': category.name,
                        'icon': category.icon,
                        'color': category.color,
                        'completed_at': result.created_at.isoformat()
                    })
        
        return jsonify({
            'categories': categories,
            'count': len(categories)
        }), 200
        
    except Exception as e:
        logger.exception("Error fetching categories taken: %s", e)
        return jsonify({'msg': 'Error loading categories'}), 500