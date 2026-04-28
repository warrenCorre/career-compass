# backend/services/job_api_service.py - Cleaned logs

import requests
import random
from datetime import datetime, timedelta
from models import JobListing, db
from flask import current_app
import time
import re
import logging

logger = logging.getLogger(__name__)

class JobAPIService:
    
    @staticmethod
    def fetch_jobs_for_career(career_title, limit=5):
        try:
            api_mode = current_app.config.get('API_MODE', 'MOCK_MODE')
            adzuna_app_id = current_app.config.get('ADZUNA_APP_ID', '')
            adzuna_app_key = current_app.config.get('ADZUNA_APP_KEY', '')
            
            if api_mode == 'REALTIME_MODE' and adzuna_app_id and adzuna_app_key:
                jobs = JobAPIService._fetch_from_adzuna(career_title, adzuna_app_id, adzuna_app_key, limit)
                if jobs:
                    return jobs
            
            return JobAPIService._generate_philippines_mock_jobs(career_title, limit)
                
        except Exception as e:
            logger.error(f"Error fetching jobs: {e}")
            return JobAPIService._generate_philippines_mock_jobs(career_title, limit)
    
    @staticmethod
    def _fetch_from_adzuna(career_title, app_id, app_key, limit):
        try:
            url = "https://api.adzuna.com/v1/api/jobs/sg/search/1"
            locations = ["Singapore", "Manila", "Philippines", "Remote"]
            all_jobs = []
            
            for location in locations:
                params = {
                    "app_id": app_id,
                    "app_key": app_key,
                    "results_per_page": limit,
                    "what": career_title,
                    "where": location,
                    "content-type": "application/json",
                    "sort_by": "date"
                }
                response = requests.get(url, params=params, timeout=10)
                if response.status_code != 200:
                    continue
                data = response.json()
                jobs = data.get("results", [])
                if not jobs:
                    continue
                for job in jobs:
                    if len(all_jobs) >= limit:
                        break
                    salary_min = job.get("salary_min")
                    salary_max = job.get("salary_max")
                    if salary_min and salary_min > 0 and salary_min < 5000:
                        salary_min *= 42
                        if salary_max:
                            salary_max *= 42
                    description = job.get("description", "")
                    if description:
                        description = re.sub(r'<[^>]+>', '', description)[:500]
                    formatted_job = {
                        "external_id": f"adzuna_{job.get('id', '')}_{location}",
                        "company": job.get("company", {}).get("display_name", "Singapore Company"),
                        "title": job.get("title", career_title),
                        "location": f"{job.get('location', {}).get('display_name', location)}",
                        "description": description,
                        "skills": JobAPIService._extract_skills_from_text(description, [career_title]),
                        "salary_min": salary_min,
                        "salary_max": salary_max,
                        "currency": "₱",
                        "job_url": job.get("redirect_url", ""),
                        "source": "adzuna",
                        "posted_at": datetime.now() - timedelta(days=random.randint(1, 14)),
                        "tags": [career_title],
                        "career_title": career_title
                    }
                    all_jobs.append(formatted_job)
                if len(all_jobs) >= limit:
                    break
            return all_jobs[:limit]
        except Exception as e:
            logger.error(f"Adzuna API error: {e}")
            return []
    
    @staticmethod
    def _generate_philippines_mock_jobs(career_title, limit):
        ph_companies = {
            'tech': ["Accenture Philippines", "IBM Philippines", "Google Philippines", "Amazon Philippines", "Microsoft Philippines", "Globe Telecom", "PLDT", "Smart Communications", "Converge ICT", "Pointwest Technologies", "GCash", "PayMaya"],
            'healthcare': ["St. Luke's Medical Center", "Makati Medical Center", "The Medical City", "Asian Hospital", "Philippine General Hospital", "Cardinal Santos", "Mercury Drug", "Unilab", "Johnson & Johnson PH"],
            'education': ["Department of Education", "University of the Philippines", "Ateneo de Manila University", "De La Salle University", "University of Santo Tomas", "Far Eastern University"],
            'engineering': ["DMCI Homes", "EEI Corporation", "Meralco", "San Miguel Corporation", "Aboitiz Power", "First Gen Corporation", "SMDC", "Ayala Land", "Megaworld"],
            'business': ["Jollibee Foods Corporation", "SM Investments", "Ayala Corporation", "BDO Unibank", "Metrobank", "BPI", "RCBC", "Security Bank"]
        }
        locations = ["Makati City", "BGC, Taguig", "Ortigas, Pasig", "Quezon City", "Bonifacio Global City", "Eastwood City", "Alabang, Muntinlupa", "Cebu City", "Davao City", "Clark, Pampanga", "Iloilo City"]
        
        career_lower = career_title.lower()
        industry = 'tech'
        if any(word in career_lower for word in ['nurse', 'doctor', 'medical', 'health', 'clinical']):
            industry = 'healthcare'
        elif any(word in career_lower for word in ['teacher', 'professor', 'education', 'instructor']):
            industry = 'education'
        elif any(word in career_lower for word in ['engineer', 'civil', 'mechanical', 'electrical']):
            industry = 'engineering'
        elif any(word in career_lower for word in ['accountant', 'finance', 'bank', 'business']):
            industry = 'business'
        
        companies = ph_companies.get(industry, ph_companies['tech'])
        jobs = []
        for i in range(min(limit, 8)):
            title = career_title
            if random.random() > 0.5:
                title = random.choice(["Junior ", "Senior ", "Lead ", ""]) + career_title
            company = random.choice(companies)
            location = random.choice(locations)
            salary_min = random.choice([18000, 20000, 22000, 25000, 28000, 30000, 35000, 40000])
            salary_max = salary_min + random.choice([5000, 8000, 10000, 15000, 20000])
            job = {
                'external_id': f"ph_mock_{industry}_{i}_{int(time.time())}",
                'company': company, 'title': title, 'location': location,
                'description': f"We are looking for a {title} to join our team at {company} in {location}.",
                'skills': ['Communication', 'Teamwork', 'Problem Solving', 'Adaptability'],
                'salary_min': salary_min, 'salary_max': salary_max, 'currency': '₱',
                'job_url': f"https://www.jobstreet.com.ph/jobs/{i}", 'source': 'ph_mock',
                'posted_at': datetime.now() - timedelta(days=random.randint(1, 14)),
                'tags': [career_title], 'career_title': career_title
            }
            jobs.append(job)
        return jobs
    
    @staticmethod
    def _extract_skills_from_text(text, base_tags):
        common_skills = ['python', 'java', 'javascript', 'sql', 'excel', 'word', 'powerpoint', 'communication', 'teamwork', 'leadership', 'customer service', 'teaching', 'writing', 'research', 'analysis', 'management']
        skills = list(base_tags) if base_tags else []
        text_lower = text.lower()
        for skill in common_skills:
            if skill not in skills and skill in text_lower:
                skills.append(skill)
                if len(skills) >= 5:
                    break
        return skills[:5]

    @staticmethod
    def save_jobs_to_db(jobs):
        try:
            week_ago = datetime.now() - timedelta(days=7)
            JobListing.query.filter(JobListing.created_at < week_ago).delete()
            saved_count = 0
            for job_data in jobs:
                existing = None
                if job_data.get('external_id'):
                    existing = JobListing.query.filter_by(external_id=job_data['external_id']).first()
                if existing:
                    existing.company = job_data['company']
                    existing.title = job_data['title']
                    existing.location = job_data.get('location', 'Philippines')
                    existing.description = job_data.get('description', '')
                    existing.skills = job_data.get('skills', [])
                    existing.salary_min = job_data.get('salary_min')
                    existing.salary_max = job_data.get('salary_max')
                    existing.job_url = job_data.get('job_url')
                    existing.source = job_data.get('source', 'api')
                    existing.posted_at = job_data.get('posted_at')
                    saved_count += 1
                else:
                    job = JobListing(
                        external_id=job_data.get('external_id'),
                        company=job_data['company'],
                        title=job_data['title'],
                        location=job_data.get('location', 'Philippines'),
                        description=job_data.get('description', ''),
                        skills=job_data.get('skills', []),
                        salary_min=job_data.get('salary_min'),
                        salary_max=job_data.get('salary_max'),
                        currency=job_data.get('currency', '₱'),
                        job_url=job_data.get('job_url'),
                        source=job_data.get('source', 'api'),
                        posted_at=job_data.get('posted_at'),
                        created_at=datetime.now()
                    )
                    db.session.add(job)
                    saved_count += 1
            db.session.commit()
            return True
        except Exception as e:
            logger.error(f"Error saving jobs: {e}")
            db.session.rollback()
            return False