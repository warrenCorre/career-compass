# backend/controllers/job_controller.py - FIXED (No Career import)

from flask import Blueprint, request, jsonify, session
from models import JobListing, AssessmentResult
from utils.auth import login_required
from services.job_api_service import JobAPIService

job_bp = Blueprint('jobs', __name__)


@job_bp.route('/listings', methods=['GET'])
def get_job_listings():
    """Get job listings - real-time from APIs"""
    try:
        career_title = request.args.get('career_title', '')
        limit = request.args.get('limit', 5, type=int)
        
        jobs = []
        
        # Search in database first
        if career_title:
            db_jobs = JobListing.query.filter(
                (JobListing.title.contains(career_title)) |
                (JobListing.description.contains(career_title))
            ).order_by(JobListing.created_at.desc()).limit(limit).all()
            
            if db_jobs:
                jobs.extend([j.to_dict() for j in db_jobs])
        
        # If we don't have enough jobs, fetch from API
        if len(jobs) < limit and career_title:
            # Fetch from free APIs
            api_jobs = JobAPIService.fetch_jobs_for_career(career_title, limit - len(jobs))
            
            # Save to database for future use
            if api_jobs:
                JobAPIService.save_jobs_to_db(api_jobs)
                jobs.extend(api_jobs)
        
        return jsonify({
            'success': True,
            'jobs': jobs,
            'count': len(jobs),
            'source': 'real-time' if jobs else 'none'
        }), 200
        
    except Exception as e:
        print(f"Error fetching job listings: {e}")
        return jsonify({
            'success': False,
            'jobs': [],
            'count': 0,
            'error': str(e)
        }), 200


@job_bp.route('/recommended', methods=['GET'])
@login_required
def get_recommended_jobs():
    """Get jobs recommended for the user based on their results"""
    try:
        user_id = session['user_id']
        limit = request.args.get('limit', 5, type=int)
        
        # Get user's latest results
        result = AssessmentResult.query.filter_by(user_id=user_id)\
            .order_by(AssessmentResult.created_at.desc()).first()
        
        jobs = []
        
        if result and result.recommended_courses:
            # Get top course
            top_course = result.recommended_courses[0] if result.recommended_courses else None
            if top_course:
                course_name = top_course.get('course_name', '')
                
                # Try database first
                db_jobs = JobListing.query.filter(
                    JobListing.title.contains(course_name)
                ).order_by(JobListing.created_at.desc()).limit(limit).all()
                
                if db_jobs:
                    jobs.extend([j.to_dict() for j in db_jobs])
                
                # If not enough, fetch from API
                if len(jobs) < limit:
                    api_jobs = JobAPIService.fetch_jobs_for_career(course_name, limit - len(jobs))
                    if api_jobs:
                        JobAPIService.save_jobs_to_db(api_jobs)
                        jobs.extend(api_jobs)
        
        return jsonify({
            'success': True,
            'jobs': jobs,
            'count': len(jobs)
        }), 200
        
    except Exception as e:
        print(f"Error fetching recommended jobs: {e}")
        return jsonify({'success': False, 'jobs': []}), 200


@job_bp.route('/search', methods=['GET'])
def search_jobs():
    """Search jobs by keyword - real-time"""
    try:
        keyword = request.args.get('q', '')
        limit = request.args.get('limit', 10, type=int)
        
        if not keyword:
            return jsonify({'jobs': []}), 200
        
        # Search in database first
        db_jobs = JobListing.query.filter(
            (JobListing.title.contains(keyword)) |
            (JobListing.company.contains(keyword)) |
            (JobListing.description.contains(keyword))
        ).order_by(JobListing.created_at.desc()).limit(limit).all()
        
        jobs = [j.to_dict() for j in db_jobs]
        
        # If not enough, fetch from API
        if len(jobs) < limit:
            api_jobs = JobAPIService.fetch_jobs_for_career(keyword, limit - len(jobs))
            jobs.extend(api_jobs)
        
        return jsonify({
            'success': True,
            'jobs': jobs
        }), 200
        
    except Exception as e:
        print(f"Error searching jobs: {e}")
        return jsonify({'jobs': []}), 200