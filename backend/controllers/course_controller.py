# backend/controllers/course_controller.py - ENHANCED

from flask import Blueprint, jsonify, session
from models import Course, AssessmentResult, db
from utils.auth import login_required

course_bp = Blueprint('courses', __name__)


@course_bp.route('/', methods=['GET'])
def get_all_courses():
    """Get all courses"""
    try:
        courses = Course.query.all()
        return jsonify([c.to_dict() for c in courses]), 200
    except Exception as e:
        print(f"Error fetching courses: {e}")
        return jsonify({'msg': 'Error loading courses'}), 500


@course_bp.route('/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """Get single course details"""
    try:
        course = Course.query.get_or_404(course_id)
        return jsonify(course.to_dict()), 200
    except Exception as e:
        print(f"Error fetching course: {e}")
        return jsonify({'msg': 'Course not found'}), 404

@course_bp.route('/recommended', methods=['GET'])
@login_required
def get_recommended_course():
    """Get recommended course based on latest assessment"""
    try:
        user_id = session['user_id']

        latest_result = AssessmentResult.query.filter_by(user_id=user_id)\
            .order_by(AssessmentResult.created_at.desc()).first()

        if latest_result and latest_result.recommended_courses:
            top_course_data = latest_result.recommended_courses[0]
            course = Course.query.get(top_course_data['course_id'])

            if course:
                return jsonify({
                    'course': course.to_dict(),
                    'score': top_course_data['score']
                }), 200

        return jsonify({'msg': 'No recommendations yet'}), 404

    except Exception as e:
        print(f"Error getting recommended course: {e}")
        return jsonify({'msg': 'Error'}), 500