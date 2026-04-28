# backend/controllers/assessment_controller.py - CLEANED (No Career, No UserInterest)

from flask import Blueprint, request, jsonify, session
from models import (
    db, User, CareerCategory, 
    PersonalAssessment, RealAssessment, AssessmentResult,
    Course
)
from utils.auth import login_required
from services.question_generator import QuestionGenerator
from datetime import datetime
import json
import random
import traceback
import re

assessment_bp = Blueprint('assessment', __name__)

# Skill mapping for consistent naming
SKILL_NAME_MAP = {
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
    'first_aid': 'First Aid',
    'calmness': 'Staying Calm',
    'patient_care': 'Patient Care',
    'clinical': 'Clinical Skills',
    'empathy': 'Empathy',
    'understanding': 'Understanding Others',
    'listening': 'Active Listening',
    'support': 'Supporting Others',
    'teaching': 'Teaching Ability',
    'patience': 'Patience',
    'explaining': 'Explaining Concepts',
    'instruction': 'Instruction',
    'engagement': 'Engagement',
    'public_speaking': 'Public Speaking',
    'problem_solving': 'Problem Solving',
    'analytical': 'Analytical Thinking',
    'measurement': 'Measurement',
    'estimation': 'Estimation',
    'spatial_reasoning': 'Spatial Reasoning',
    'visualization': 'Visualization',
    'building': 'Building/Assembly',
    'fixing': 'Fixing Things',
    'following_instructions': 'Following Instructions',
    'creativity': 'Creativity',
    'design': 'Design Sense',
    'photography': 'Photography',
    'writing': 'Writing',
    'storytelling': 'Storytelling',
    'aesthetic_sense': 'Aesthetic Sense',
    'content_creation': 'Content Creation',
    'perspective_taking': 'Perspective Taking',
    'communication': 'Communication',
    'respect': 'Respect',
    'observation': 'Observation',
    'analysis': 'Analysis',
    'critical_thinking': 'Critical Thinking',
    'welcoming': 'Welcoming Others',
    'friendliness': 'Friendliness',
    'customer_service': 'Customer Service',
    'memory': 'Memory',
    'attention': 'Attention to Detail',
    'multitasking': 'Multitasking',
    'stress_management': 'Stress Management',
    'service_mindset': 'Service Mindset',
    'leadership': 'Leadership',
    'initiative': 'Initiative',
    'planning': 'Planning',
    'money_management': 'Money Management',
    'responsibility': 'Responsibility',
    'decision_making': 'Decision Making',
    'persuasion': 'Persuasion',
    'time_management': 'Time Management',
    'confidence': 'Confidence'
}


@assessment_bp.route('/personal/questions/<int:category_id>', methods=['GET'])
@login_required
def get_personal_questions(category_id):
    """Get personal assessment questions - FRESH GENERATED FOR EACH USER"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'msg': 'Not authenticated'}), 401
            
        category = CareerCategory.query.get(category_id)
        if not category:
            return jsonify({'msg': 'Category not found'}), 404
            
        print(f"\n🔍 Generating fresh PERSONAL questions for user {user_id} in {category.name}...")
        
        generated = QuestionGenerator.generate_personal_questions(
            category_name=category.name,
            num_questions=8
        )
        
        if not generated:
            generated = QuestionGenerator._get_interest_based_fallback_personal(category.name, 8)
        
        questions = []
        for idx, q_data in enumerate(generated):
            questions.append({
                'id': idx + 1,
                'text': q_data['text'],
                'options': q_data['options'],
                'order_index': idx + 1
            })
        
        print(f"✅ Generated {len(questions)} fresh personal questions for user {user_id}")
        
        return jsonify({'questions': questions}), 200
        
    except Exception as e:
        print(f"Error generating personal questions: {e}")
        traceback.print_exc()
        return jsonify({'msg': 'Error loading questions'}), 500


@assessment_bp.route('/personal/submit', methods=['POST'])
@login_required
def submit_personal_assessment():
    """Submit personal assessment answers - KEEP ALL HISTORY (no deletion)"""
    print(f"\n=== PERSONAL ASSESSMENT SUBMIT ===")
    
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'msg': 'Not authenticated'}), 401
            
        data = request.get_json()
        
        if not data:
            return jsonify({'msg': 'No data provided'}), 400
            
        category_id = data.get('category_id')
        answers = data.get('answers')
        
        if not category_id or not answers:
            return jsonify({'msg': 'Missing category_id or answers'}), 400
        
        category = CareerCategory.query.get(category_id)
        if not category:
            return jsonify({'msg': 'Category not found'}), 404
        
        # Create a new personal assessment (keep history)
        personal_assessment = PersonalAssessment(
            user_id=user_id,
            category_id=category_id,
            answers=answers
        )
        db.session.add(personal_assessment)
        
        # Calculate interest level
        answer_values = list(answers.values())
        avg_score = sum(answer_values) / len(answer_values) if answer_values else 0
        
        interest_tags = []
        if avg_score > 3.2:
            interest_tags = ['high_interest', 'passionate']
        elif avg_score > 2.5:
            interest_tags = ['moderate_interest', 'interested']
        else:
            interest_tags = ['exploring', 'curious']
        
        db.session.commit()
        print(f"✅ Personal assessment saved for user {user_id} with avg score {avg_score}")
        
        return jsonify({
            'msg': 'Personal assessment saved',
            'interest_tags': interest_tags,
            'next': 'real_assessment'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'msg': f'Error: {str(e)}'}), 500


@assessment_bp.route('/real/questions', methods=['GET'])
@login_required
def get_real_questions():
    """Get real assessment questions - FRESH GENERATED FOR EACH USER"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'msg': 'Not authenticated'}), 401
            
        # Get the MOST RECENT personal assessment
        personal = PersonalAssessment.query.filter_by(user_id=user_id)\
            .order_by(PersonalAssessment.completed_at.desc()).first()
        if not personal:
            return jsonify({'msg': 'Please complete personal assessment first'}), 400
        
        category_id = personal.category_id
        category = CareerCategory.query.get(category_id)
        
        personal_answers = personal.answers if personal else None
        
        print(f"\n🔍 Generating fresh REAL questions for user {user_id} in {category.name}...")
        
        generated = QuestionGenerator.generate_real_questions(
            category_name=category.name,
            interest_tags=None,
            personal_answers=personal_answers,
            num_questions=12
        )
        
        if not generated:
            teaching_preference = None
            if category.name == 'Education' and personal_answers:
                for value in personal_answers.values():
                    if value in [1, 2]:
                        teaching_preference = 'elementary'
                    elif value in [3, 4]:
                        teaching_preference = 'secondary'
                        break
            
            generated = QuestionGenerator._get_skill_based_fallback_real(
                category_name=category.name,
                interest_tags=None,
                teaching_preference=teaching_preference,
                num_questions=12
            )
        
        questions = []
        for idx, q_data in enumerate(generated):
            questions.append({
                'id': idx + 1,
                'text': q_data['text'],
                'options': q_data['options'],
                'order_index': idx + 1,
                'tags': q_data.get('tags', ['general'])
            })
        
        print(f"✅ Generated {len(questions)} fresh real questions for user {user_id}")
        
        return jsonify({'questions': questions}), 200
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        return jsonify({'msg': 'Error loading questions'}), 500


# In assessment_controller.py - submit_real_assessment function
# Replace the real_assessment creation section with this:

@assessment_bp.route('/real/submit', methods=['POST'])
@login_required
def submit_real_assessment():
    """Submit real assessment answers - KEEP ALL HISTORY (no deletion)"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'msg': 'Not authenticated'}), 401
            
        data = request.get_json()
        
        if not data:
            return jsonify({'msg': 'No data provided'}), 400
            
        answers = data.get('answers')
        time_spent = data.get('time_spent', 0)
        
        if not answers:
            return jsonify({'msg': 'Missing answers'}), 400
        
        # Get the MOST RECENT personal assessment to link
        personal = PersonalAssessment.query.filter_by(user_id=user_id)\
            .order_by(PersonalAssessment.completed_at.desc()).first()
        
        if not personal:
            return jsonify({'msg': 'Please complete personal assessment first'}), 400
        
        # ✅ CREATE REAL ASSESSMENT WITH LINK TO PERSONAL ASSESSMENT
        real_assessment = RealAssessment(
            user_id=user_id,
            category_id=personal.category_id,
            personal_assessment_id=personal.id,  # ✅ LINK TO PERSONAL ASSESSMENT
            answers=answers,
            time_spent=time_spent
        )
        db.session.add(real_assessment)
        db.session.flush()
        
        print(f"✅ Real assessment {real_assessment.id} linked to personal assessment {personal.id}")
        
        # Get all courses in this category
        courses = Course.query.filter_by(category_id=personal.category_id).all()
        
        if not courses:
            return jsonify({'msg': 'No courses available'}), 404
        
        # Normalize function (1-4 scale to 0-100)
        def normalize(score):
            return ((score - 1) / 3) * 100
        
        # Process answers to create differentiated skill scores
        answer_values = list(answers.values())
        
        # Calculate distribution of answers
        high_answers = [v for v in answer_values if v >= 3]
        high_percentage = len(high_answers) / len(answer_values) if answer_values else 0
        avg_normalized = normalize(sum(answer_values) / len(answer_values) if answer_values else 2.5)
        
        print(f"High answer percentage: {high_percentage:.2%}")
        print(f"Average normalized score: {avg_normalized}")
        
        # ===== GENERATE SKILL SCORES BASED ON CATEGORY =====
        skill_scores = {}
        
        # TECHNOLOGY SKILLS
        if personal.category.name == 'Technology':
            skill_scores = {
                'web_development': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'software_engineering': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'database_management': round(15 + (high_percentage * 85) + random.randint(-8, 8)),
                'system_analysis': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'networking': round(10 + (high_percentage * 90) + random.randint(-8, 8)),
                'cybersecurity': round(15 + (high_percentage * 85) + random.randint(-8, 8)),
                'tech_support': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'project_management': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'programming': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'algorithms': round(20 + (high_percentage * 80) + random.randint(-8, 8))
            }
        
        # HEALTH & MEDICAL SCIENCE SKILLS
        elif personal.category.name == 'Health & Medical Science':
            skill_scores = {
                'patient_care': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'clinical': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'empathy': round(35 + (high_percentage * 65) + random.randint(-8, 8)),
                'first_aid': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'medical_knowledge': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'anatomy': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'emergency_response': round(15 + (high_percentage * 85) + random.randint(-8, 8)),
                'health_education': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'nutrition': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'mental_health': round(25 + (high_percentage * 75) + random.randint(-8, 8))
            }
        
        # EDUCATION SKILLS
        elif personal.category.name == 'Education':
            skill_scores = {
                'elementary_teaching': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'secondary_teaching': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'special_education': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'curriculum_development': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'educational_leadership': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'instructional_design': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'classroom_management': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'lesson_planning': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'student_assessment': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'educational_technology': round(25 + (high_percentage * 75) + random.randint(-8, 8))
            }
        
        # ENGINEERING SKILLS
        elif personal.category.name == 'Engineering':
            skill_scores = {
                'civil_engineering': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'mechanical_engineering': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'electrical_engineering': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'computer_engineering': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'structural_engineering': round(15 + (high_percentage * 85) + random.randint(-8, 8)),
                'thermodynamics': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'circuit_design': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'robotics': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'materials_science': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'quality_control': round(20 + (high_percentage * 80) + random.randint(-8, 8))
            }
        
        # ARTS, MEDIA & COMMUNICATION SKILLS
        elif personal.category.name == 'Arts, Media, & Communication':
            skill_scores = {
                'graphic_design': round(35 + (high_percentage * 65) + random.randint(-8, 8)),
                'writing': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'photography': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'video_editing': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'public_relations': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'journalism': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'animation': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'illustration': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'content_creation': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'digital_marketing': round(20 + (high_percentage * 80) + random.randint(-8, 8))
            }
        
        # SOCIAL SCIENCES SKILLS
        elif personal.category.name == 'Social Sciences':
            skill_scores = {
                'psychology': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'sociology': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'political_science': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'anthropology': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'counseling': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'social_work': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'research_methods': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'data_analysis': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'public_policy': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'community_development': round(25 + (high_percentage * 75) + random.randint(-8, 8))
            }
        
        # HOSPITALITY & TOURISM SKILLS
        elif personal.category.name == 'Hospitality & Tourism':
            skill_scores = {
                'hotel_management': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'event_planning': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'culinary_arts': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'tour_guiding': round(35 + (high_percentage * 65) + random.randint(-8, 8)),
                'travel_consulting': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'restaurant_management': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'customer_service': round(35 + (high_percentage * 65) + random.randint(-8, 8)),
                'food_safety': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'destination_management': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'cultural_awareness': round(30 + (high_percentage * 70) + random.randint(-8, 8))
            }
        
        # BUSINESS & MANAGEMENT SKILLS
        elif personal.category.name == 'Business & Management':
            skill_scores = {
                'marketing': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'finance': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'human_resources': round(30 + (high_percentage * 70) + random.randint(-8, 8)),
                'entrepreneurship': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'operations_management': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'business_analytics': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'accounting': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'strategic_planning': round(20 + (high_percentage * 80) + random.randint(-8, 8)),
                'organizational_behavior': round(25 + (high_percentage * 75) + random.randint(-8, 8)),
                'supply_chain': round(20 + (high_percentage * 80) + random.randint(-8, 8))
            }
        
        else:
            skill_scores = {
                'general': round(avg_normalized),
                'adaptability': round(avg_normalized + random.randint(-15, 15)),
                'communication': round(avg_normalized + random.randint(-15, 15)),
                'problem_solving': round(avg_normalized + random.randint(-15, 15))
            }
        
        # Ensure scores are within 0-100
        for key in skill_scores:
            skill_scores[key] = max(0, min(100, skill_scores[key]))
        
        print(f"Skill scores: {skill_scores}")
        
        # ===== COURSE TO SKILL MAPPING =====
        course_skill_mapping = {
            # Technology
            'BSIT': ['web_development', 'tech_support', 'networking', 'database_management'],
            'BSCS': ['software_engineering', 'programming', 'algorithms', 'system_analysis'],
            'BSIS': ['system_analysis', 'database_management', 'project_management', 'business_analytics'],
            
            # Health & Medical Science
            'BSN': ['patient_care', 'empathy', 'clinical', 'medical_knowledge'],
            'BSMLS': ['clinical', 'medical_knowledge', 'research_methods', 'anatomy'],
            'BSPT': ['patient_care', 'empathy', 'clinical', 'anatomy'],
            
            # Education
            'BEED': ['elementary_teaching', 'classroom_management', 'lesson_planning', 'educational_technology'],
            'BSED-English': ['secondary_teaching', 'writing', 'lesson_planning', 'student_assessment'],
            'BSED-Math': ['secondary_teaching', 'instructional_design', 'lesson_planning', 'student_assessment'],
            
            # Engineering
            'BSCE': ['civil_engineering', 'structural_engineering', 'project_management', 'quality_control'],
            'BSME': ['mechanical_engineering', 'thermodynamics', 'materials_science', 'quality_control'],
            'BSEE': ['electrical_engineering', 'circuit_design', 'robotics', 'quality_control'],
            
            # Arts, Media & Communication
            'ABComm': ['public_relations', 'writing', 'digital_marketing', 'content_creation'],
            'ABJourn': ['journalism', 'writing', 'research_methods', 'digital_marketing'],
            'BFA': ['graphic_design', 'illustration', 'animation', 'content_creation'],
            
            # Social Sciences
            'ABPsych': ['psychology', 'counseling', 'research_methods', 'data_analysis'],
            'ABPolSci': ['political_science', 'public_policy', 'research_methods', 'data_analysis'],
            'ABSociology': ['sociology', 'anthropology', 'research_methods', 'community_development'],
            
            # Hospitality & Tourism
            'BSHM': ['hotel_management', 'restaurant_management', 'event_planning', 'customer_service'],
            'BST': ['travel_consulting', 'tour_guiding', 'destination_management', 'cultural_awareness'],
            'BSCA': ['culinary_arts', 'food_safety', 'restaurant_management', 'customer_service'],
            
            # Business & Management
            'BSBA': ['marketing', 'finance', 'human_resources', 'operations_management'],
            'BSA': ['accounting', 'finance', 'business_analytics', 'strategic_planning'],
            'BSEntrep': ['entrepreneurship', 'marketing', 'finance', 'strategic_planning']
        }
        
        # ===== CALCULATE COURSE SCORES =====
        course_scores = {}
        for course in courses:
            relevant_skills = course_skill_mapping.get(course.course_code, ['general'])
            
            total_score = 0
            matched_skills = 0
            
            for skill in relevant_skills:
                if skill in skill_scores:
                    total_score += skill_scores[skill]
                    matched_skills += 1
            
            if matched_skills > 0:
                course_score = total_score / matched_skills
            else:
                course_score = avg_normalized * 0.7
            
            course_scores[str(course.id)] = round(course_score)
        
        print(f"Course scores: {course_scores}")
        
        # ===== GENERATE RECOMMENDED COURSES =====
        sorted_courses = sorted(courses, key=lambda c: course_scores.get(str(c.id), 0), reverse=True)
        recommended_courses = []
        
        for course in sorted_courses[:5]:
            score = course_scores.get(str(course.id), 0)
            recommended_courses.append({
                'course_id': course.id,
                'course_code': course.course_code,
                'course_name': course.course_name,
                'score': score,
                'description': course.description or '',
                'match_level': 'Excellent' if score >= 80 else
                              'Good' if score >= 65 else
                              'Potential' if score >= 50 else
                              'Basic'
            })
        
        # ===== GENERATE SKILL GAPS =====
        skill_gaps = []
        weak_skills = [(tag, score) for tag, score in skill_scores.items() if score < 60]
        weak_skills.sort(key=lambda x: x[1])
        
        gap_messages = {
            'web_development': 'Practice building websites and web applications',
            'software_engineering': 'Take coding courses to improve programming skills',
            'programming': 'Practice coding regularly to build programming skills',
            'patient_care': 'Practice empathy and communication with patients',
            'clinical': 'Develop clinical knowledge through courses',
            'teaching': 'Develop patience and creative teaching methods',
            'problem_solving': 'Practice solving puzzles and logic problems',
            'communication': 'Practice explaining concepts clearly',
            'creativity': 'Explore creative projects and design exercises',
            'leadership': 'Take initiative in group projects',
        }
        
        for tag, score in weak_skills[:4]:
            if tag in gap_messages:
                skill_gaps.append(gap_messages[tag])
            else:
                skill_gaps.append(f"Keep developing your {tag.replace('_', ' ')} skills")
        
        if not skill_gaps:
            skill_gaps.append("Keep building on your solid foundation")
        
        # ===== SAVE RESULTS =====
        try:
            result = AssessmentResult(
                user_id=user_id,
                personal_assessment_id=personal.id,
                real_assessment_id=real_assessment.id,
                category_id=personal.category_id,
                scores=course_scores,
                skill_scores=skill_scores,
                skill_gaps=skill_gaps,
                recommended_courses=recommended_courses
            )
            db.session.add(result)
            db.session.commit()
            print(f"Results saved for user {user_id}")
        except Exception as e:
            db.session.rollback()
            print(f"Error saving results: {e}")
            raise e
        
        return jsonify({
            'msg': 'Assessment completed successfully',
            'result_id': result.id,
            'scores': course_scores,
            'skill_scores': skill_scores,
            'skill_gaps': skill_gaps,
            'recommended_courses': recommended_courses,
            'summary': {
                'avg_score': round(avg_normalized),
                'time_spent': time_spent,
                'total_questions': len(answers),
                'strength_level': 'Advanced' if avg_normalized > 80 else 
                                 'Intermediate' if avg_normalized > 60 else 
                                 'Beginner' if avg_normalized > 40 else 
                                 'Foundation'
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        traceback.print_exc()
        return jsonify({'msg': f'Error: {str(e)}'}), 500


@assessment_bp.route('/latest', methods=['GET'])
@login_required
def get_latest_results():
    """Get user's latest assessment results"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'msg': 'Not authenticated'}), 401
            
        result = AssessmentResult.query.filter_by(user_id=user_id)\
            .order_by(AssessmentResult.created_at.desc()).first()
        
        if not result:
            return jsonify({'msg': 'No results found'}), 404
        
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
        
        if formatted_skills:
            formatted_skills.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            'result_id': result.id,
            'category_id': result.category_id,
            'category_name': result.category.name if result.category else None,
            'scores': result.scores,
            'skill_scores': formatted_skills,
            'skill_gaps': result.skill_gaps if result.skill_gaps else [],
            'recommended_courses': result.recommended_courses if result.recommended_courses else [],
            'created_at': result.created_at.strftime('%B %d, %Y')
        }), 200
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        return jsonify({'msg': 'Error loading results'}), 500


@assessment_bp.route('/history', methods=['GET'])
@login_required
def get_assessment_history():
    """Get user's assessment history with categories and dates"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'msg': 'Not authenticated'}), 401
            
        results = AssessmentResult.query.filter_by(user_id=user_id)\
            .order_by(AssessmentResult.created_at.desc())\
            .all()
        
        history = []
        for result in results:
            category = CareerCategory.query.get(result.category_id)
            
            top_course = None
            if result.recommended_courses and len(result.recommended_courses) > 0:
                top_course = result.recommended_courses[0]
            
            skills_assessed = 0
            if result.skill_scores:
                if isinstance(result.skill_scores, dict):
                    skills_assessed = len(result.skill_scores)
                elif isinstance(result.skill_scores, list):
                    skills_assessed = len(result.skill_scores)
            
            history.append({
                'id': result.id,
                'category_id': result.category_id,
                'category_name': category.name if category else 'Unknown',
                'completed_at': result.created_at.isoformat(),
                'top_match': {
                    'course_code': top_course.get('course_code') if top_course else None,
                    'course_name': top_course.get('course_name') if top_course else None,
                    'score': top_course.get('score') if top_course else None
                } if top_course else None,
                'skills_assessed': skills_assessed
            })
        
        return jsonify({
            'history': history,
            'count': len(history)
        }), 200
        
    except Exception as e:
        print(f"Error fetching assessment history: {e}")
        traceback.print_exc()
        return jsonify({'msg': 'Error loading history'}), 500


@assessment_bp.route('/result/<int:result_id>', methods=['GET'])
@login_required
def get_result_by_id(result_id):
    """Get specific assessment result by ID"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'msg': 'Not authenticated'}), 401
            
        result = AssessmentResult.query.get(result_id)
        
        if not result:
            return jsonify({'msg': 'Result not found'}), 404
        
        if result.user_id != user_id:
            return jsonify({'msg': 'Access denied'}), 403
        
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
        
        if formatted_skills:
            formatted_skills.sort(key=lambda x: x['score'], reverse=True)
        
        scores_list = list(result.scores.values()) if result.scores else []
        avg_score = sum(scores_list) / len(scores_list) if scores_list else 0
        
        return jsonify({
            'result_id': result.id,
            'category_id': result.category_id,
            'category_name': result.category.name if result.category else None,
            'scores': result.scores,
            'skill_scores': formatted_skills,
            'skill_gaps': result.skill_gaps if result.skill_gaps else [],
            'recommended_courses': result.recommended_courses if result.recommended_courses else [],
            'created_at': result.created_at.strftime('%B %d, %Y'),
            'summary': {
                'avg_score': round(avg_score),
                'total_questions': 12,
                'strength_level': 'Advanced' if avg_score > 80 else 
                                 'Intermediate' if avg_score > 60 else 
                                 'Beginner' if avg_score > 40 else 
                                 'Foundation'
            }
        }), 200
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        return jsonify({'msg': 'Error loading result'}), 500