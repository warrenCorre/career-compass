# backend/app.py - Cleaned logs, kept essential startup info

from flask import Flask, session, jsonify, g, request
from flask_cors import CORS
from flask_session import Session
from flask_mail import Mail
from config import Config
from models import db, bcrypt, Setting, User
import os
import sys
import socket
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mail = Mail()
sess = Session()

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    local_ip = get_local_ip()

    instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    # os.makedirs(instance_path, exist_ok=True)
    session_path = os.path.join(instance_path, 'flask_session')
    os.makedirs(session_path, exist_ok=True)

    # db_path = os.path.join(instance_path, 'careercompass.db')
    # app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

    db.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)

    with app.app_context():
        try:
            setting = Setting.query.filter_by(key='api_mode').first()
            if setting:
                app.config['API_MODE'] = setting.value
            else:
                app.config['API_MODE'] = 'MOCK_MODE'
                db.session.add(Setting(key='api_mode', value='MOCK_MODE'))
                db.session.commit()
        except Exception as e:
            app.config['API_MODE'] = 'MOCK_MODE'
            logger.error(f"Could not load API mode: {e}")

    sess.init_app(app)

    @app.before_request
    def track_user_activity():
        if 'user_id' in session:
            try:
                user_id = session.get('user_id')
                user = User.query.get(user_id)
                if user:
                    user.last_activity = datetime.utcnow()
                    db.session.commit()
            except Exception:
                db.session.rollback()

    @app.after_request
    def after_request_handler(response):
        session.modified = True
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        f"http://{local_ip}:3000",
        "http://192.168.10.213:3000",
        "http://192.168.10.160:3000",
        "http://192.168.1.14:3000",
        "http://192.168.0.100:3000",
        "http://10.0.0.100:3000",
        "http://172.21.95.234:3000",
        "http://172.29.112.1:3000",
        "http://10.128.149.234:3000",
        "http://192.168.100.102:3000",
        "http://192.168.1.11:3000",
        "*"
    ]

    CORS(app, supports_credentials=True, origins=origins,
         allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Cookie", "X-CSRF-Token"],
         expose_headers=["Content-Type", "Authorization", "Set-Cookie", "Cookie"],
         methods=["GET", "HEAD", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
         max_age=86400)

    from controllers.auth_controller import auth_bp
    from controllers.student_controller import student_bp
    from controllers.assessment_controller import assessment_bp
    from controllers.job_controller import job_bp
    from controllers.admin_controller import admin_bp
    from controllers.course_controller import course_bp
    from controllers.category_controller import category_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
    app.register_blueprint(job_bp, url_prefix='/api/jobs')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(course_bp, url_prefix='/api/courses')
    app.register_blueprint(category_bp, url_prefix='/api/categories')

    with app.app_context():
        db.create_all()
        try:
            db.session.execute('ALTER TABLE users ADD COLUMN last_activity DATETIME')
            db.session.commit()
        except:
            pass

        # ✅ Safe seeding – log errors, don't crash
        try:
            seed_essential_data()
        except Exception as e:
            logger.error(f"Seeding failed (app will still run): {e}")

        @app.route('/')
        def health():
            return jsonify({"status": "ok", "message": "CareerCompass API is running"})

    return app

def seed_essential_data():
    from models import User, CareerCategory, Course, JobListing
    import random
    from datetime import datetime, timedelta
    import time

    try:
        categories_data = [
            {'name': 'Technology', 'description': 'Explore careers in programming, IT support, web development, and software engineering.', 'icon': 'ComputerDesktopIcon', 'color': 'blue', 'display_order': 1},
            {'name': 'Health & Medical Science', 'description': 'Discover careers in nursing, medicine, physical therapy, and healthcare.', 'icon': 'HeartIcon', 'color': 'red', 'display_order': 2},
            {'name': 'Education', 'description': 'Learn about teaching, curriculum development, and educational leadership.', 'icon': 'AcademicCapIcon', 'color': 'green', 'display_order': 3},
            {'name': 'Engineering', 'description': 'Explore civil, mechanical, electrical, and computer engineering paths.', 'icon': 'WrenchScrewdriverIcon', 'color': 'yellow', 'display_order': 4},
            {'name': 'Arts, Media, & Communication', 'description': 'Discover careers in design, journalism, public relations, and content creation.', 'icon': 'PaintBrushIcon', 'color': 'purple', 'display_order': 5},
            {'name': 'Social Sciences', 'description': 'Explore psychology, sociology, political science, and community work.', 'icon': 'UserGroupIcon', 'color': 'orange', 'display_order': 6},
            {'name': 'Hospitality & Tourism', 'description': 'Learn about hotel management, travel, culinary arts, and event planning.', 'icon': 'BuildingOfficeIcon', 'color': 'pink', 'display_order': 7},
            {'name': 'Business & Management', 'description': 'Discover accounting, marketing, entrepreneurship, and business administration.', 'icon': 'ChartBarIcon', 'color': 'indigo', 'display_order': 8}
        ]

        categories = {}
        for cat_data in categories_data:
            category = CareerCategory.query.filter_by(name=cat_data['name']).first()
            if not category:
                category = CareerCategory(**cat_data)
                db.session.add(category)
            categories[cat_data['name']] = category
        db.session.commit()

        courses_data = {
            'Technology': [
                {'course_code': 'BSIT', 'course_name': 'Bachelor of Science in Information Technology', 'icon': 'ComputerDesktopIcon', 'color': 'blue'},
                {'course_code': 'BSCS', 'course_name': 'Bachelor of Science in Computer Science', 'icon': 'CodeBracketIcon', 'color': 'indigo'},
                {'course_code': 'BSIS', 'course_name': 'Bachelor of Science in Information Systems', 'icon': 'ServerIcon', 'color': 'cyan'},
                {'course_code': 'BSDS', 'course_name': 'Bachelor of Science in Data Science', 'icon': 'ChartBarIcon', 'color': 'teal'},
                {'course_code': 'BSCyber', 'course_name': 'Bachelor of Science in Cybersecurity', 'icon': 'ShieldCheckIcon', 'color': 'emerald'},
                {'course_code': 'BSGD', 'course_name': 'Bachelor of Science in Game Development', 'icon': 'SparklesIcon', 'color': 'purple'},
                {'course_code': 'BSAI', 'course_name': 'Bachelor of Science in Artificial Intelligence', 'icon': 'CpuChipIcon', 'color': 'violet'},
                {'course_code': 'BSIT-Multimedia', 'course_name': 'Bachelor of Science in Information Technology major in Multimedia', 'icon': 'PaintBrushIcon', 'color': 'pink'},
            ],
            'Health & Medical Science': [
                {'course_code': 'BSN', 'course_name': 'Bachelor of Science in Nursing', 'icon': 'HeartIcon', 'color': 'red'},
                {'course_code': 'BSMLS', 'course_name': 'Bachelor of Science in Medical Laboratory Science', 'icon': 'BeakerIcon', 'color': 'pink'},
                {'course_code': 'BSPT', 'course_name': 'Bachelor of Science in Physical Therapy', 'icon': 'UserIcon', 'color': 'orange'},
                {'course_code': 'BSPharmacy', 'course_name': 'Bachelor of Science in Pharmacy', 'icon': 'BeakerIcon', 'color': 'violet'},
                {'course_code': 'BSRadTech', 'course_name': 'Bachelor of Science in Radiologic Technology', 'icon': 'CameraIcon', 'color': 'cyan'},
                {'course_code': 'BSNutrition', 'course_name': 'Bachelor of Science in Nutrition and Dietetics', 'icon': 'FireIcon', 'color': 'amber'},
                {'course_code': 'BSMT', 'course_name': 'Bachelor of Science in Midwifery', 'icon': 'HeartIcon', 'color': 'rose'},
                {'course_code': 'BSOPT', 'course_name': 'Bachelor of Science in Occupational Therapy', 'icon': 'UserIcon', 'color': 'teal'},
            ],
            'Education': [
                {'course_code': 'BEED', 'course_name': 'Bachelor of Elementary Education', 'icon': 'BookOpenIcon', 'color': 'green'},
                {'course_code': 'BSED-English', 'course_name': 'Bachelor of Secondary Education major in English', 'icon': 'PencilIcon', 'color': 'emerald'},
                {'course_code': 'BSED-Math', 'course_name': 'Bachelor of Secondary Education major in Mathematics', 'icon': 'CalculatorIcon', 'color': 'teal'},
                {'course_code': 'BSED-Science', 'course_name': 'Bachelor of Secondary Education major in Science', 'icon': 'BeakerIcon', 'color': 'blue'},
                {'course_code': 'BSED-Social', 'course_name': 'Bachelor of Secondary Education major in Social Studies', 'icon': 'GlobeAltIcon', 'color': 'orange'},
                {'course_code': 'BSED-Filipino', 'course_name': 'Bachelor of Secondary Education major in Filipino', 'icon': 'BookOpenIcon', 'color': 'yellow'},
                {'course_code': 'BSED-MAPEH', 'course_name': 'Bachelor of Secondary Education major in MAPEH', 'icon': 'MusicalNoteIcon', 'color': 'pink'},
                {'course_code': 'BECEd', 'course_name': 'Bachelor of Early Childhood Education', 'icon': 'SparklesIcon', 'color': 'pink'},
                {'course_code': 'BSPE', 'course_name': 'Bachelor of Special Needs Education', 'icon': 'UserGroupIcon', 'color': 'purple'},
            ],
            'Engineering': [
                {'course_code': 'BSCE', 'course_name': 'Bachelor of Science in Civil Engineering', 'icon': 'BuildingOffice2Icon', 'color': 'yellow'},
                {'course_code': 'BSME', 'course_name': 'Bachelor of Science in Mechanical Engineering', 'icon': 'WrenchScrewdriverIcon', 'color': 'amber'},
                {'course_code': 'BSEE', 'course_name': 'Bachelor of Science in Electrical Engineering', 'icon': 'BoltIcon', 'color': 'orange'},
                {'course_code': 'BSCpE', 'course_name': 'Bachelor of Science in Computer Engineering', 'icon': 'CpuChipIcon', 'color': 'purple'},
                {'course_code': 'BSIE', 'course_name': 'Bachelor of Science in Industrial Engineering', 'icon': 'ChartBarIcon', 'color': 'indigo'},
                {'course_code': 'BSEEcE', 'course_name': 'Bachelor of Science in Electronics Engineering', 'icon': 'DevicePhoneMobileIcon', 'color': 'cyan'},
                {'course_code': 'BSChemE', 'course_name': 'Bachelor of Science in Chemical Engineering', 'icon': 'BeakerIcon', 'color': 'green'},
                {'course_code': 'BSEnvE', 'course_name': 'Bachelor of Science in Environmental Engineering', 'icon': 'GlobeAltIcon', 'color': 'emerald'},
                {'course_code': 'BSMechatronics', 'course_name': 'Bachelor of Science in Mechatronics Engineering', 'icon': 'CpuChipIcon', 'color': 'teal'},
            ],
            'Arts, Media, & Communication': [
                {'course_code': 'ABComm', 'course_name': 'Bachelor of Arts in Communication', 'icon': 'MegaphoneIcon', 'color': 'purple'},
                {'course_code': 'ABJourn', 'course_name': 'Bachelor of Arts in Journalism', 'icon': 'NewspaperIcon', 'color': 'violet'},
                {'course_code': 'BFA', 'course_name': 'Bachelor of Fine Arts', 'icon': 'PaintBrushIcon', 'color': 'fuchsia'},
                {'course_code': 'ABFilm', 'course_name': 'Bachelor of Arts in Film and Media Studies', 'icon': 'FilmIcon', 'color': 'red'},
                {'course_code': 'ABMultimedia', 'course_name': 'Bachelor of Arts in Multimedia Arts', 'icon': 'SparklesIcon', 'color': 'pink'},
                {'course_code': 'ABTheater', 'course_name': 'Bachelor of Arts in Theater Arts', 'icon': 'VideoCameraIcon', 'color': 'amber'},
                {'course_code': 'ABBroadcast', 'course_name': 'Bachelor of Arts in Broadcast Communication', 'icon': 'RadioIcon', 'color': 'blue'},
                {'course_code': 'BDes', 'course_name': 'Bachelor of Design', 'icon': 'PaintBrushIcon', 'color': 'indigo'},
                {'course_code': 'ABCreativeWriting', 'course_name': 'Bachelor of Arts in Creative Writing', 'icon': 'PencilIcon', 'color': 'green'},
            ],
            'Social Sciences': [
                {'course_code': 'ABPsych', 'course_name': 'Bachelor of Arts in Psychology', 'icon': 'UserGroupIcon', 'color': 'orange'},
                {'course_code': 'ABPolSci', 'course_name': 'Bachelor of Arts in Political Science', 'icon': 'BuildingLibraryIcon', 'color': 'gray'},
                {'course_code': 'ABSociology', 'course_name': 'Bachelor of Arts in Sociology', 'icon': 'UsersIcon', 'color': 'stone'},
                {'course_code': 'ABAnthro', 'course_name': 'Bachelor of Arts in Anthropology', 'icon': 'GlobeAltIcon', 'color': 'amber'},
                {'course_code': 'ABHistory', 'course_name': 'Bachelor of Arts in History', 'icon': 'CalendarIcon', 'color': 'brown'},
                {'course_code': 'ABEconomics', 'course_name': 'Bachelor of Arts in Economics', 'icon': 'ChartBarIcon', 'color': 'green'},
                {'course_code': 'ABInternational', 'course_name': 'Bachelor of Arts in International Studies', 'icon': 'GlobeAltIcon', 'color': 'blue'},
                {'course_code': 'ABPhilosophy', 'course_name': 'Bachelor of Arts in Philosophy', 'icon': 'AcademicCapIcon', 'color': 'purple'},
                {'course_code': 'ABSocialWork', 'course_name': 'Bachelor of Arts in Social Work', 'icon': 'UserGroupIcon', 'color': 'rose'},
            ],
            'Hospitality & Tourism': [
                {'course_code': 'BSHM', 'course_name': 'Bachelor of Science in Hospitality Management', 'icon': 'BuildingOfficeIcon', 'color': 'pink'},
                {'course_code': 'BST', 'course_name': 'Bachelor of Science in Tourism', 'icon': 'MapIcon', 'color': 'rose'},
                {'course_code': 'BSCA', 'course_name': 'Bachelor of Science in Culinary Arts', 'icon': 'FireIcon', 'color': 'red'},
                {'course_code': 'BSEvent', 'course_name': 'Bachelor of Science in Event Management', 'icon': 'CalendarIcon', 'color': 'purple'},
                {'course_code': 'BSIntlTourism', 'course_name': 'Bachelor of Science in International Tourism', 'icon': 'GlobeAltIcon', 'color': 'blue'},
                {'course_code': 'BSAviation', 'course_name': 'Bachelor of Science in Aviation Management', 'icon': 'RocketLaunchIcon', 'color': 'cyan'},
                {'course_code': 'BSHotel', 'course_name': 'Bachelor of Science in Hotel and Restaurant Management', 'icon': 'BuildingOfficeIcon', 'color': 'amber'},
                {'course_code': 'BSTourismMgt', 'course_name': 'Bachelor of Science in Tourism Management', 'icon': 'MapIcon', 'color': 'teal'},
                {'course_code': 'BSLeisure', 'course_name': 'Bachelor of Science in Leisure and Recreation Management', 'icon': 'SparklesIcon', 'color': 'green'},
            ],
            'Business & Management': [
                {'course_code': 'BSBA', 'course_name': 'Bachelor of Science in Business Administration', 'icon': 'ChartBarIcon', 'color': 'indigo'},
                {'course_code': 'BSA', 'course_name': 'Bachelor of Science in Accountancy', 'icon': 'CalculatorIcon', 'color': 'blue'},
                {'course_code': 'BSEntrep', 'course_name': 'Bachelor of Science in Entrepreneurship', 'icon': 'RocketLaunchIcon', 'color': 'purple'},
                {'course_code': 'BSFM', 'course_name': 'Bachelor of Science in Financial Management', 'icon': 'CurrencyDollarIcon', 'color': 'green'},
                {'course_code': 'BSMM', 'course_name': 'Bachelor of Science in Marketing Management', 'icon': 'MegaphoneIcon', 'color': 'orange'},
                {'course_code': 'BSHRM', 'course_name': 'Bachelor of Science in Human Resource Management', 'icon': 'UserGroupIcon', 'color': 'teal'},
                {'course_code': 'BSBA-OM', 'course_name': 'Bachelor of Science in Business Administration major in Operations Management', 'icon': 'TruckIcon', 'color': 'amber'},
                {'course_code': 'BSBA-MM', 'course_name': 'Bachelor of Science in Business Administration major in Marketing Management', 'icon': 'ChartBarIcon', 'color': 'rose'},
                {'course_code': 'BSBA-FM', 'course_name': 'Bachelor of Science in Business Administration major in Financial Management', 'icon': 'CurrencyDollarIcon', 'color': 'emerald'},
                {'course_code': 'BSBA-HR', 'course_name': 'Bachelor of Science in Business Administration major in Human Resource Management', 'icon': 'UserGroupIcon', 'color': 'cyan'},
                {'course_code': 'BSLegalMgt', 'course_name': 'Bachelor of Science in Legal Management', 'icon': 'BuildingLibraryIcon', 'color': 'violet'},
                {'course_code': 'BSPA', 'course_name': 'Bachelor of Science in Public Administration', 'icon': 'BuildingOfficeIcon', 'color': 'slate'},
            ]
        }

        courses = {}
        for cat_name, cat_courses in courses_data.items():
            category = categories.get(cat_name)
            if category:
                for course_data in cat_courses:
                    existing_course = Course.query.filter_by(course_code=course_data['course_code']).first()
                    if not existing_course:
                        course = Course(
                            category_id=category.id,
                            course_code=course_data['course_code'],
                            course_name=course_data['course_name'],
                            description=f"Study {course_data['course_name']}. This program prepares students for careers in {cat_name.lower()}.",
                            icon=course_data.get('icon', 'AcademicCapIcon'),
                            color=course_data.get('color', 'slate')
                        )
                        db.session.add(course)
                        courses[course_data['course_code']] = course
                    else:
                        courses[course_data['course_code']] = existing_course
        db.session.commit()

        ph_companies = {
            'tech': ["Accenture Philippines", "IBM Philippines", "Google Philippines", "Amazon Philippines", "Microsoft Philippines", "Globe Telecom", "PLDT", "Smart Communications", "Converge ICT", "Pointwest Technologies", "GCash", "PayMaya"],
            'healthcare': ["St. Luke's Medical Center", "Makati Medical Center", "The Medical City", "Asian Hospital", "Philippine General Hospital", "Cardinal Santos", "Mercury Drug", "Unilab", "Johnson & Johnson PH"],
            'education': ["Department of Education", "University of the Philippines", "Ateneo de Manila University", "De La Salle University", "University of Santo Tomas", "Far Eastern University"],
            'engineering': ["DMCI Homes", "EEI Corporation", "Meralco", "San Miguel Corporation", "Aboitiz Power", "First Gen Corporation", "SMDC", "Ayala Land", "Megaworld"],
            'business': ["Jollibee Foods Corporation", "SM Investments", "Ayala Corporation", "BDO Unibank", "Metrobank", "BPI", "RCBC", "Security Bank"]
        }

        locations = ["Makati City", "BGC, Taguig", "Ortigas, Pasig", "Quezon City", "Bonifacio Global City", "Eastwood City", "Alabang, Muntinlupa", "Cebu City", "Davao City", "Clark, Pampanga", "Iloilo City"]

        job_titles = {
            'Technology': ["Software Engineer", "Web Developer", "IT Support Specialist", "Data Analyst", "Systems Administrator", "QA Tester", "Mobile App Developer", "DevOps Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Cloud Engineer"],
            'Health & Medical Science': ["Staff Nurse", "Medical Technologist", "Pharmacist", "Physical Therapist", "Radiologic Technologist", "Clinical Nurse", "ICU Nurse", "Emergency Room Nurse", "Medical Laboratory Scientist"],
            'Education': ["Elementary Teacher", "High School Teacher", "College Instructor", "Special Education Teacher", "ESL Teacher", "Preschool Teacher", "Guidance Counselor", "Education Coordinator"],
            'Engineering': ["Civil Engineer", "Mechanical Engineer", "Electrical Engineer", "Project Engineer", "Design Engineer", "Site Engineer", "Structural Engineer", "Electronics Engineer", "Industrial Engineer"],
            'Arts, Media, & Communication': ["Graphic Designer", "Content Writer", "Social Media Manager", "Video Editor", "Multimedia Artist", "Copywriter", "Public Relations Officer", "Journalist", "Photographer"],
            'Social Sciences': ["HR Associate", "Research Assistant", "Community Organizer", "Guidance Counselor", "Social Worker", "Policy Analyst"],
            'Hospitality & Tourism': ["Hotel Manager", "Restaurant Manager", "Event Coordinator", "Travel Consultant", "Tour Guide", "Chef", "Pastry Chef"],
            'Business & Management': ["Accountant", "Financial Analyst", "Marketing Specialist", "Business Manager", "Operations Manager", "HR Manager", "Sales Representative", "Entrepreneur", "Business Consultant"]
        }

        for category_name, titles in job_titles.items():
            industry = 'tech'
            if 'Health' in category_name:
                industry = 'healthcare'
            elif 'Education' in category_name:
                industry = 'education'
            elif 'Engineering' in category_name:
                industry = 'engineering'
            elif 'Business' in category_name:
                industry = 'business'
            companies = ph_companies.get(industry, ph_companies['tech'])
            for i in range(min(3, len(titles))):
                title = titles[i % len(titles)]
                company = random.choice(companies)
                location = random.choice(locations)
                salary_min = random.choice([18000, 20000, 22000, 25000, 28000, 30000, 35000, 40000, 45000, 50000])
                salary_max = salary_min + random.choice([5000, 8000, 10000, 15000, 20000])
                skills_pool = {
                    'tech': ["Python", "JavaScript", "React", "Node.js", "SQL", "Java", "C#", "AWS", "Docker", "Git"],
                    'healthcare': ["Patient Care", "Vital Signs", "EMR", "CPR", "First Aid", "Wound Care", "Medication Administration"],
                    'education': ["Lesson Planning", "Classroom Management", "Curriculum Development", "Student Assessment", "Parent Communication"],
                    'engineering': ["AutoCAD", "Project Management", "Site Inspection", "Technical Drawing", "Quality Control"],
                    'business': ["Financial Analysis", "Bookkeeping", "Tax Preparation", "QuickBooks", "MS Excel"]
                }
                skills = random.sample(skills_pool.get(industry, skills_pool['tech']), 4)
                job = JobListing(
                    external_id=f"ph_mock_{category_name.replace(' ', '_')}_{i}_{int(time.time()*1000)}_{random.randint(0,9999)}",
                    company=company, title=title, location=location,
                    description=f"We are looking for a {title} to join our team at {company}.",
                    skills=skills, salary_min=salary_min, salary_max=salary_max, currency='₱',
                    job_url=f"https://www.jobstreet.com.ph/jobs/{i}", source='ph_mock',
                    posted_at=datetime.now() - timedelta(days=random.randint(1, 14))
                )
                db.session.add(job)
        db.session.commit()

        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@careercompass.com')
        existing_admin = User.query.filter((User.username == admin_username) | (User.email == admin_email)).first()
        if not existing_admin:
            admin = User(first_name='Admin', last_name='User', username=admin_username, email=admin_email, is_admin=True)
            admin.set_password(admin_password)
            db.session.add(admin)
            db.session.commit()
        else:
            if not existing_admin.is_admin:
                existing_admin.is_admin = True
                db.session.commit()
    except Exception as e:
        logger.error(f"Seeding error: {e}")
        db.session.rollback()
        raise e
    
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)