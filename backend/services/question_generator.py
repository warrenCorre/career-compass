# backend/services/question_generator.py - Use config for API key
# UPDATED: Dynamically generate prompts for categories not hardcoded

import requests
import json
import os
import random
import re
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import current_app
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class QuestionGenerator:
    
    # CLEAN CATEGORY PROMPTS with personalization instructions
    CATEGORY_PROMPTS = {
        'Technology': {
            'personal': """Generate INTEREST-BASED personal questions about TECHNOLOGY for Grade 12 students.

CRITICAL: Ask ONLY about INTERESTS and CURIOSITY. NEVER ask about skills or abilities.

CORE TECHNOLOGY DOMAINS (ask about curiosity/interest in these):
- Hardware/computers → How curious are you about how devices work?
- Software/apps → How interested are you in learning how apps are made?
- Programming/coding → How curious are you about how websites/apps are built?
- Gaming → How interested are you in how video games work?
- Tech support → How often do you wonder how to fix tech problems?
- Cybersecurity → How curious are you about online safety?
- Emerging tech → How interested are you in AI, VR, new gadgets?
- Networks/internet → How curious are you about how the internet works?

IMPORTANT RULES:
1. Ask about INTERESTS only - use phrases like:
   - "How curious are you about..."
   - "Are you interested in..."
   - "Do you wonder how..."
   - "How often do you think about..."
2. DO NOT ask about abilities - avoid:
   - "How well can you..."
   - "Are you good at..."
   - "Do you enjoy doing..."
   - "Can you..."
3. DO NOT mention specific careers or job titles
4. Questions should be about CURIOSITY and INTEREST, not skill level

For answer choices, use:
- FREQUENCY: ["Never", "Sometimes", "Often", "Very often"]
- INTEREST LEVEL: ["Not interested", "A little interested", "Interested", "Very interested"]
- CURIOSITY: ["Not curious", "A little curious", "Curious", "Very curious"]

Generate EXACTLY 8 questions that ask about INTERESTS and CURIOSITY only.""",
            
            'real': """Generate SKILL-BASED questions about TECHNOLOGY for Grade 12 students.

CORE TECHNOLOGY SKILLS:
- Troubleshooting tech problems
- Learning new software quickly
- Understanding how devices work
- Basic coding/logic concepts
- Online research skills
- Cyber safety awareness
- File/organization skills
- Explaining tech to others

CRITICAL PERSONALIZATION: Based on the student's personal assessment answers below, focus questions on the areas they showed interest in.

The student's interests in Technology:
- If they like PROGRAMMING/CODING: Focus questions on coding logic, debugging, algorithms
- If they like HARDWARE: Focus questions on computer parts, building PCs, troubleshooting hardware
- If they like TECH SUPPORT: Focus questions on helping others, explaining tech, problem diagnosis
- If they like CYBERSECURITY: Focus questions on online safety, data protection, privacy
- If they like GAMING: Focus questions on game mechanics, performance optimization, modding
- If they like SOFTWARE/APPS: Focus questions on learning new software, app design, user experience
- If they like EMERGING TECH: Focus questions on AI, VR, automation, future tech

Keep questions SIMPLE and practical for 17-year olds.
Do NOT mention specific careers in the question text.
"""
        },
        
        'Health & Medical Science': {
            'personal': """Generate INTEREST-BASED personal questions about HEALTH & MEDICAL SCIENCE for Grade 12 students.

CRITICAL: Ask ONLY about INTERESTS and CURIOSITY. NEVER ask about skills or abilities.

CORE HEALTH DOMAINS (ask about curiosity/interest in these):
- Human biology/body → How curious are you about how the body works?
- Healthcare/medicine → How interested are you in how hospitals work?
- First aid/emergency → How curious are you about helping in emergencies?
- Fitness/wellness → How interested are you in exercise and health?
- Nutrition → How curious are you about food and diet?
- Mental health → How interested are you in understanding emotions?
- Patient care → How often do you think about helping sick people?

IMPORTANT RULES:
1. Ask about INTERESTS only - use phrases like:
   - "How curious are you about..."
   - "Are you interested in..."
   - "Do you wonder how..."
   - "How often do you think about..."
2. DO NOT ask about abilities - avoid:
   - "How well can you..."
   - "Are you good at..."
   - "Do you know how to..."
3. DO NOT mention specific careers or job titles

Generate EXACTLY 8 questions that ask about INTERESTS and CURIOSITY only.""",
            
            'real': """Generate SKILL-BASED questions about HEALTH & MEDICAL SCIENCE for Grade 12 students.

CORE HEALTH SKILLS:
- Basic first aid knowledge
- Staying calm in emergencies
- Understanding medical instructions
- Empathy and compassion
- Attention to detail
- Following procedures
- Memorizing terminology
- Health awareness

CRITICAL PERSONALIZATION: Based on the student's personal assessment answers below, focus questions on the areas they showed interest in.

The student's interests in Health & Medical Science:
- If they like PATIENT CARE: Focus questions on empathy, bedside manner, communication with patients
- If they like EMERGENCY/FIRST AID: Focus questions on quick decision-making, staying calm, emergency procedures
- If they like BIOLOGY/BODY: Focus questions on anatomy, physiology, how the body works
- If they like FITNESS/WELLNESS: Focus questions on exercise science, nutrition, healthy habits
- If they like MENTAL HEALTH: Focus questions on emotional intelligence, counseling approaches
- If they like CLINICAL/HOSPITAL WORK: Focus questions on procedures, attention to detail, lab work

Keep questions SIMPLE and practical.
Do NOT mention specific careers in the question text.
"""
        },
        
        'Education': {
            'personal': """Generate INTEREST-BASED personal questions about EDUCATION for Grade 12 students.

            
CRITICAL: Ask ONLY about INTERESTS and CURIOSITY. NEVER ask about skills or abilities.

CORE EDUCATION DOMAINS (ask about curiosity/interest in these):
- Teaching/explaining → How interested are you in helping others learn?
- Working with children/teens → Do you prefer working with younger or older students?
- Creating learning materials → How curious are you about making study guides?
- Mentoring/guiding → How interested are you in supporting others' growth?
- Subject passion → How curious are you about sharing your favorite subjects?
- Learning processes → How interested are you in how people learn?

CRITICAL: MUST include a question about preference between:
- Teaching young children (elementary)
- Teaching teenagers (high school)

IMPORTANT RULES:
1. Ask about INTERESTS only - use phrases like:
   - "How interested are you in..."
   - "Do you prefer..."
   - "How curious are you about..."
2. DO NOT ask about abilities - avoid:
   - "How well can you..."
   - "Are you good at..."
   - "Can you..."
3. DO NOT mention specific careers or job titles

Generate EXACTLY 8 questions that ask about INTERESTS and CURIOSITY only.""",
            
            'real': """Generate SKILL-BASED questions about EDUCATION for Grade 12 students.

CORE EDUCATION SKILLS:
- Explaining concepts clearly
- Patience with learners
- Adapting to different levels
- Public speaking
- Creating engaging materials
- Giving constructive feedback
- Classroom management
- Understanding learning needs

CRITICAL PERSONALIZATION: Based on the student's personal assessment answers below, focus questions on the areas they showed interest in.

The student's interests in Education:
- If they prefer ELEMENTARY EDUCATION: Focus questions on patience with young children, creativity in teaching, play-based learning
- If they prefer SECONDARY EDUCATION: Focus questions on subject matter expertise, explaining complex topics, discussion facilitation
- If they like MENTORING/GUIDING: Focus questions on giving advice, helping others grow
- If they like CREATING MATERIALS: Focus questions on lesson planning, resource creation
- If they like TEACHING/EXPLAINING: Focus questions on communication, breaking down concepts

Do NOT mention specific careers in the question text.
"""
        },
        
        'Engineering': {
            'personal': """Generate INTEREST-BASED personal questions about ENGINEERING for Grade 12 students.

CRITICAL: Ask ONLY about INTERESTS and CURIOSITY. NEVER ask about skills or abilities.

CORE ENGINEERING DOMAINS (ask about curiosity/interest in these):
- Building/construction → How curious are you about how things are built?
- How things work → How interested are you in how machines work?
- Taking apart/fixing → How curious are you about what's inside devices?
- Design/drawing → How interested are you in creating plans or designs?
- Problem-solving → How curious are you about solving puzzles?
- Math/physics → How interested are you in technical subjects?
- Vehicles/transport → How curious are you about how cars/planes work?
- Structures → How interested are you in buildings and bridges?

IMPORTANT RULES:
1. Ask about INTERESTS only - use phrases like:
   - "How curious are you about..."
   - "Are you interested in..."
   - "Do you wonder how..."
   - "How often do you think about..."
2. DO NOT ask about abilities - avoid:
   - "How well can you..."
   - "Are you good at..."
   - "Can you..."
3. DO NOT mention specific careers or job titles

Generate EXACTLY 8 questions that ask about INTERESTS and CURIOSITY only.""",
            
            'real': """Generate SKILL-BASED questions about ENGINEERING for Grade 12 students.

CORE ENGINEERING SKILLS:
- Following instructions/diagrams
- Estimating measurements
- Problem-solving approach
- Spatial visualization (3D thinking)
- Breaking down complex problems
- Attention to how things are built
- Basic math application
- Analytical thinking

CRITICAL PERSONALIZATION: Based on the student's personal assessment answers below, focus questions on the areas they showed interest in.

The student's interests in Engineering:
- If they like CIVIL/STRUCTURES: Focus questions on building, bridges, construction
- If they like MECHANICAL/VEHICLES: Focus questions on how machines work, cars, engines
- If they like ELECTRICAL/ELECTRONICS: Focus questions on circuits, electricity, devices
- If they like PROBLEM-SOLVING: Focus questions on puzzles, optimization, finding solutions
- If they like DESIGN/DRAWING: Focus questions on blueprints, CAD, visualization
- If they like BUILDING/FIXING: Focus questions on assembly, repair, hands-on work

Keep questions SIMPLE and practical.
Do NOT mention specific careers in the question text.
"""
        },
        
        'Arts, Media, & Communication': {
            'personal': """Generate INTEREST-BASED personal questions about ARTS, MEDIA & COMMUNICATION for Grade 12 students.

CRITICAL: Ask ONLY about INTERESTS and CURIOSITY. NEVER ask about skills or abilities.

CORE ARTS DOMAINS (ask about curiosity/interest in these):
- Visual arts → How interested are you in drawing or painting?
- Performing arts → How curious are you about music, dance, or theater?
- Writing → How interested are you in writing stories or poems?
- Digital content → How curious are you about creating videos or photos?
- Design → How interested are you in fashion or visual design?
- Media → How curious are you about how movies or animations are made?

IMPORTANT RULES:
1. Ask about INTERESTS only - use phrases like:
   - "How interested are you in..."
   - "How curious are you about..."
   - "Do you enjoy watching/learning about..."
2. DO NOT ask about abilities - avoid:
   - "How well can you..."
   - "Are you good at..."
   - "Can you..."
3. DO NOT mention specific careers or job titles

Generate EXACTLY 8 questions that ask about INTERESTS and CURIOSITY only.""",
            
            'real': """Generate SKILL-BASED questions about ARTS, MEDIA & COMMUNICATION for Grade 12 students.

CORE ARTS SKILLS:
- Drawing/design abilities
- Writing clarity and creativity
- Photography/video skills
- Content creation abilities
- Performance/presentation skills
- Storytelling ability
- Aesthetic sense
- Creative expression

CRITICAL PERSONALIZATION: Based on the student's personal assessment answers below, focus questions on the areas they showed interest in.

The student's interests in Arts, Media & Communication:
- If they like VISUAL ARTS: Focus questions on drawing, painting, digital art, composition
- If they like PERFORMING ARTS: Focus questions on stage presence, expression, practice habits
- If they like WRITING: Focus questions on storytelling, clarity, creative writing
- If they like DIGITAL CONTENT: Focus questions on video editing, photography, content planning
- If they like DESIGN: Focus questions on color theory, layout, user experience
- If they like MEDIA/FILM: Focus questions on storytelling, shot composition, editing

Keep questions SIMPLE and practical.
Do NOT mention specific careers in the question text.
"""
        },
        
        'Social Sciences': {
            'personal': """Generate INTEREST-BASED personal questions about SOCIAL SCIENCES for Grade 12 students.

CRITICAL: Ask ONLY about INTERESTS and CURIOSITY. NEVER ask about skills or abilities.

CORE SOCIAL SCIENCE DOMAINS (ask about curiosity/interest in these):
- Understanding people → How curious are you about why people behave the way they do?
- Society/culture → How interested are you in different cultures and traditions?
- Current events → How curious are you about news and politics?
- History → How interested are you in learning about the past?
- Helping others → How curious are you about supporting people through problems?
- Justice/equality → How interested are you in fairness and rights?
- Community → How curious are you about volunteering and local issues?

IMPORTANT RULES:
1. Ask about INTERESTS only - use phrases like:
   - "How curious are you about..."
   - "Are you interested in..."
   - "Do you wonder why..."
   - "How often do you think about..."
2. DO NOT ask about abilities - avoid:
   - "How well can you..."
   - "Are you good at..."
   - "Can you..."
3. DO NOT mention specific careers or job titles

Generate EXACTLY 8 questions that ask about INTERESTS and CURIOSITY only.""",
            
            'real': """Generate SKILL-BASED questions about SOCIAL SCIENCES for Grade 12 students.

CORE SOCIAL SCIENCE SKILLS:
- Understanding others' perspectives
- Listening without judgment
- Discussing different opinions respectfully
- Identifying reliable information
- Showing empathy
- Recognizing patterns in behavior
- Working with diverse groups
- Research and analysis

CRITICAL PERSONALIZATION: Based on the student's personal assessment answers below, focus questions on the areas they showed interest in.

The student's interests in Social Sciences:
- If they like PSYCHOLOGY/BEHAVIOR: Focus questions on understanding emotions, motivations, mental processes
- If they like SOCIETY/CULTURE: Focus questions on group dynamics, traditions, social structures
- If they like POLITICS/CURRENT EVENTS: Focus questions on analyzing news, understanding systems
- If they like HISTORY: Focus questions on patterns, cause and effect, research
- If they like HELPING/COUNSELING: Focus questions on empathy, active listening, support
- If they like JUSTICE/ADVOCACY: Focus questions on fairness, rights, argumentation

Keep questions SIMPLE and practical.
Do NOT mention specific careers in the question text.
"""
        },
        
        'Hospitality & Tourism': {
            'personal': """Generate INTEREST-BASED personal questions about HOSPITALITY & TOURISM for Grade 12 students.

CRITICAL: Ask ONLY about INTERESTS and CURIOSITY. NEVER ask about skills or abilities.

CORE HOSPITALITY DOMAINS (ask about curiosity/interest in these):
- Travel → How curious are you about exploring new places?
- Food/cuisine → How interested are you in trying different foods?
- Events → How curious are you about planning parties or celebrations?
- Customer service → How interested are you in helping people have a good time?
- Meeting people → How curious are you about talking to new people?
- Cultures → How interested are you in learning about different traditions?
- Hotels/resorts → How curious are you about how hotels operate?

IMPORTANT RULES:
1. Ask about INTERESTS only - use phrases like:
   - "How curious are you about..."
   - "Are you interested in..."
   - "How often do you think about..."
2. DO NOT ask about abilities - avoid:
   - "How well can you..."
   - "Are you good at..."
   - "Can you..."
3. DO NOT mention specific careers or job titles

Generate EXACTLY 8 questions that ask about INTERESTS and CURIOSITY only.""",
            
            'real': """Generate SKILL-BASED questions about HOSPITALITY & TOURISM for Grade 12 students.

CORE HOSPITALITY SKILLS:
- Welcoming and greeting people
- Handling complaints calmly
- Remembering preferences
- Giving clear directions/suggestions
- Staying helpful when busy
- Organizing events
- Working in a team
- Being punctual and reliable

CRITICAL PERSONALIZATION: Based on the student's personal assessment answers below, focus questions on the areas they showed interest in.

The student's interests in Hospitality & Tourism:
- If they like TRAVEL: Focus questions on destination knowledge, itinerary planning
- If they like FOOD/CUISINE: Focus questions on food safety, menu knowledge, service
- If they like EVENTS: Focus questions on planning, organization, coordination
- If they like CUSTOMER SERVICE: Focus questions on communication, problem-solving, patience
- If they like MEETING PEOPLE: Focus questions on friendliness, cultural sensitivity
- If they like HOTEL/RESORT OPERATIONS: Focus questions on attention to detail, organization

Keep questions SIMPLE and practical.
Do NOT mention specific careers in the question text.
"""
        },
        
        'Business & Management': {
            'personal': """Generate INTEREST-BASED personal questions about BUSINESS & MANAGEMENT for Grade 12 students.

CRITICAL: Ask ONLY about INTERESTS and CURIOSITY. NEVER ask about skills or abilities.

CORE BUSINESS DOMAINS (ask about curiosity/interest in these):
- Leadership → How curious are you about leading groups?
- Organization → How interested are you in planning and coordinating?
- Money/finance → How curious are you about saving and investing?
- Entrepreneurship → How interested are you in starting a business?
- Decision-making → How curious are you about making choices?
- Persuasion → How interested are you in influencing others?
- Goal-setting → How curious are you about planning for the future?
- Teamwork → How interested are you in working with others?

IMPORTANT RULES:
1. Ask about INTERESTS only - use phrases like:
   - "How curious are you about..."
   - "Are you interested in..."
   - "Do you wonder how..."
   - "How often do you think about..."
2. DO NOT ask about abilities - avoid:
   - "How well can you..."
   - "Are you good at..."
   - "Can you..."
3. DO NOT mention specific careers or job titles

Generate EXACTLY 8 questions that ask about INTERESTS and CURIOSITY only.""",
            
            'real': """Generate SKILL-BASED questions about BUSINESS & MANAGEMENT for Grade 12 students.

CORE BUSINESS SKILLS:
- Organizing group activities
- Managing money responsibly
- Making decisions confidently
- Persuading others
- Setting and tracking goals
- Planning events/projects
- Taking initiative
- Meeting deadlines

CRITICAL PERSONALIZATION: Based on the student's personal assessment answers below, focus questions on the areas they showed interest in.

The student's interests in Business & Management:
- If they like LEADERSHIP: Focus questions on directing groups, making decisions, motivating others
- If they like ENTREPRENEURSHIP: Focus questions on business ideas, risk-taking, innovation
- If they like FINANCE/MONEY: Focus questions on budgeting, investing, financial planning
- If they like MARKETING/SELLING: Focus questions on persuasion, understanding customers
- If they like ORGANIZATION: Focus questions on planning, coordinating, time management
- If they like TEAMWORK: Focus questions on collaboration, communication, group work

Keep questions SIMPLE and practical.
Do NOT mention specific careers in the question text.
"""
        }
    }

    # ── NEW: dynamic prompt builders for any category ──────────────────────
    @classmethod
    def _build_personal_prompt(cls, category_name):
        """Build an interest-based personal assessment prompt for a category."""
        return (
            f"Generate INTEREST-BASED personal questions about {category_name.upper()}"
            f" for Grade 12 students.\n\n"
            f"CRITICAL: Ask ONLY about INTERESTS and CURIOSITY. NEVER ask about skills or abilities.\n\n"
            f"Think about the core domains and activities associated with {category_name}."
            f" Ask about curiosity/interest in these areas.\n\n"
            f"IMPORTANT RULES:\n"
            f"1. Ask about INTERESTS only - use phrases like:\n"
            f"   - \"How curious are you about...\"\n"
            f"   - \"Are you interested in...\"\n"
            f"   - \"Do you wonder how...\"\n"
            f"   - \"How often do you think about...\"\n"
            f"2. DO NOT ask about abilities - avoid:\n"
            f"   - \"How well can you...\"\n"
            f"   - \"Are you good at...\"\n"
            f"   - \"Do you enjoy doing...\"\n"
            f"   - \"Can you...\"\n"
            f"3. DO NOT mention specific careers or job titles\n"
            f"4. Questions should be about CURIOSITY and INTEREST, not skill level\n\n"
            f"For answer choices, use:\n"
            f"- FREQUENCY: [\"Never\", \"Sometimes\", \"Often\", \"Very often\"]\n"
            f"- INTEREST LEVEL: [\"Not interested\", \"A little interested\", \"Interested\", \"Very interested\"]\n"
            f"- CURIOSITY: [\"Not curious\", \"A little curious\", \"Curious\", \"Very curious\"]\n\n"
            f"Generate EXACTLY 8 questions that ask about INTERESTS and CURIOSITY only."
        )

    @classmethod
    def _build_real_prompt(cls, category_name):
        """Build a skill-based real assessment prompt for a category."""
        return (
            f"Generate SKILL-BASED questions about {category_name.upper()}"
            f" for Grade 12 students.\n\n"
            f"Think about the core skills and abilities relevant to {category_name}."
            f" Focus on practical, real-world skills a student might need.\n\n"
            f"CORE SKILLS (consider):\n"
            f"- Basic knowledge and understanding\n"
            f"- Practical hands-on skills\n"
            f"- Problem-solving related to {category_name}\n"
            f"- Communication and collaboration\n"
            f"- Attention to detail and organization\n"
            f"- Adaptability and learning new things\n\n"
            f"CRITICAL PERSONALIZATION: Based on the student's personal assessment answers below,"
            f" focus questions on the areas they showed interest in.\n\n"
            f"Keep questions SIMPLE and practical for 17-year olds.\n"
            f"Do NOT mention specific careers in the question text.\n\n"
            f"Generate EXACTLY 12 skill-based questions that align with their interests."
        )

    # ───── (rest of original code, with modifications to use the above) ──────

    @classmethod
    def get_groq_api_key(cls):
        """Get Groq API key from config"""
        # Try to get from Flask config first
        try:
            api_key = current_app.config.get('GROQ_API_KEY')
            if api_key:
                return api_key
        except RuntimeError:
            # Outside application context
            pass
        
        # Fallback to environment
        api_key = os.environ.get('GROQ_API_KEY')
        if not api_key:
            load_dotenv()
            api_key = os.environ.get('GROQ_API_KEY')
        return api_key
    
    @classmethod
    def generate_personal_questions(cls, category_name, num_questions=8):
        """Generate INTEREST-BASED personal assessment questions for a category"""
        logger.info("Generating %d personal questions for category: %s", num_questions, category_name)
        
        # Get category-specific prompt with interest focus
        if category_name in cls.CATEGORY_PROMPTS:
            category_prompt = cls.CATEGORY_PROMPTS[category_name]['personal']
        else:
            category_prompt = cls._build_personal_prompt(category_name)
        
        # Try Groq API first
        api_key = cls.get_groq_api_key()
        if api_key:
            questions = cls._generate_with_groq(
                category_name=category_name,
                category_prompt=category_prompt,
                question_type="personal",
                num_questions=num_questions,
                api_key=api_key
            )
            if questions:
                logger.info("Generated %d personal questions via Groq for category: %s", len(questions), category_name)
                return questions
        
        logger.warning("Groq unavailable for category '%s'; using fallback questions.", category_name)
        return cls._get_interest_based_fallback_personal(category_name, num_questions)
    
    @classmethod
    def generate_real_questions(cls, category_name, interest_tags=None, personal_answers=None, num_questions=12):
        """Generate SKILL-BASED real assessment questions based on interests"""
        logger.info("Generating %d real questions for category: %s", num_questions, category_name)
        
        # Get category-specific prompt for real questions with skill focus
        if category_name in cls.CATEGORY_PROMPTS:
            base_prompt = cls.CATEGORY_PROMPTS[category_name]['real']
        else:
            base_prompt = cls._build_real_prompt(category_name)
        
        # Analyze personal answers to determine interests
        interest_analysis = cls._analyze_personal_answers(category_name, personal_answers)
        
        # Build personalized prompt with interest analysis
        personalized_prompt = f"""{base_prompt}

PERSONAL ASSESSMENT ANALYSIS:
{interest_analysis}

IMPORTANT: Generate questions that specifically target the areas where the student showed HIGH interest. 
Do NOT waste questions on areas they showed LOW interest in.
Make sure questions are engaging and relevant to their expressed interests.

Generate {num_questions} skill-based questions that align with their interests."""
        
        logger.debug("Interest analysis computed for category: %s", category_name)
        
        # Try Groq API
        api_key = cls.get_groq_api_key()
        if api_key:
            questions = cls._generate_with_groq(
                category_name=category_name,
                category_prompt=personalized_prompt,
                question_type="real",
                num_questions=num_questions,
                api_key=api_key,
                interest_tags=interest_tags
            )
            if questions:
                logger.info("Generated %d real questions via Groq for category: %s", len(questions), category_name)
                return questions
        
        logger.warning("Groq unavailable for category '%s'; using personalized fallback questions.", category_name)
        return cls._get_personalized_fallback_real(category_name, personal_answers, interest_tags, num_questions)
    
    @classmethod
    def generate_questions_parallel(cls, categories_data):
        """Generate questions for multiple categories in parallel for faster processing"""
        logger.info("Starting parallel question generation for %d categories.", len(categories_data))
        
        # Use ThreadPoolExecutor for parallel API calls
        results = {}
        
        def generate_for_category(category_name, config):
            """Worker function for generating questions for a single category"""
            try:
                logger.debug("Starting question generation for category: %s", category_name)
                questions = {
                    'personal': None,
                    'real': None
                }
                
                # Generate personal questions
                if config.get('generate_personal', True):
                    questions['personal'] = cls.generate_personal_questions(
                        category_name,
                        config.get('personal_count', 8)
                    )
                
                # Generate real questions
                if config.get('generate_real', True):
                    questions['real'] = cls.generate_real_questions(
                        category_name,
                        config.get('interest_tags'),
                        config.get('personal_answers'),
                        config.get('real_count', 12)
                    )
                
                logger.debug("Completed question generation for category: %s", category_name)
                return category_name, questions
            except Exception as e:
                logger.error("Error generating questions for category '%s': %s", category_name, e)
                return category_name, None
        
        # Use ThreadPoolExecutor for parallel execution
        with ThreadPoolExecutor(max_workers=min(len(categories_data), 5)) as executor:
            # Submit all tasks
            future_to_category = {
                executor.submit(generate_for_category, category_name, config): category_name
                for category_name, config in categories_data.items()
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_category):
                category_name = future_to_category[future]
                try:
                    category_name, result = future.result()
                    if result:
                        results[category_name] = result
                except Exception as e:
                    logger.error("Error processing result for category '%s': %s", category_name, e)
                    results[category_name] = None
        
        logger.info("Parallel generation complete. Processed %d categories.", len(results))
        return results
    
    @classmethod
    def _analyze_personal_answers(cls, category_name, personal_answers):
        """Analyze personal answers to identify interests"""
        if not personal_answers:
            return "No specific interests identified - generate a balanced set of questions across all skill areas."
        
        # Calculate average score
        answer_values = list(personal_answers.values())
        avg_score = sum(answer_values) / len(answer_values) if answer_values else 0
        
        # Determine interest level
        if avg_score > 3.2:
            interest_level = "HIGH interest in this career field"
        elif avg_score > 2.5:
            interest_level = "MODERATE interest in this career field"
        else:
            interest_level = "EXPLORATORY interest - still learning about this field"
        
        # Specific interest analysis by category
        analysis = f"Student shows {interest_level}.\n\n"
        
        # Add category-specific interest analysis
        if category_name == 'Technology':
            analysis += """Based on their responses:
- High scores in programming/coding questions → Focus on coding logic, algorithms
- High scores in hardware questions → Focus on building, components, troubleshooting
- High scores in tech support questions → Focus on helping others, problem diagnosis
- High scores in cybersecurity questions → Focus on online safety, data protection
- High scores in gaming questions → Focus on game mechanics, optimization
- High scores in emerging tech → Focus on AI, VR, innovation"""
        
        elif category_name == 'Health & Medical Science':
            analysis += """Based on their responses:
- High scores in patient care → Focus on empathy, communication, bedside manner
- High scores in emergency/first aid → Focus on quick decisions, staying calm
- High scores in biology/body → Focus on anatomy, how body systems work
- High scores in fitness/wellness → Focus on exercise science, nutrition
- High scores in mental health → Focus on emotional intelligence, counseling"""
        
        elif category_name == 'Education':
            analysis += """Based on their responses:
- High scores in elementary preference → Focus on patience, creativity, early childhood
- High scores in secondary preference → Focus on subject expertise, explaining complex topics
- High scores in creating materials → Focus on lesson planning, resource creation
- High scores in mentoring → Focus on guidance, supporting others
- High scores in teaching/explaining → Focus on communication, breaking down concepts"""
        
        elif category_name == 'Engineering':
            analysis += """Based on their responses:
- High scores in civil/structures → Focus on building, construction, stability
- High scores in mechanical/vehicles → Focus on how things work, mechanics
- High scores in electrical/electronics → Focus on circuits, power, devices
- High scores in problem-solving → Focus on puzzles, optimization, solutions
- High scores in design/drawing → Focus on CAD, visualization, plans"""
        
        elif category_name == 'Arts, Media, & Communication':
            analysis += """Based on their responses:
- High scores in visual arts → Focus on drawing, digital art, composition
- High scores in performing arts → Focus on stage presence, expression
- High scores in writing → Focus on storytelling, clarity, creativity
- High scores in digital content → Focus on video editing, photography
- High scores in design → Focus on layout, color theory, aesthetics"""
        
        elif category_name == 'Social Sciences':
            analysis += """Based on their responses:
- High scores in psychology/behavior → Focus on emotions, motivations, understanding
- High scores in society/culture → Focus on group dynamics, traditions
- High scores in politics/current events → Focus on analysis, systems
- High scores in helping/counseling → Focus on empathy, active listening
- High scores in justice/advocacy → Focus on fairness, rights, arguments"""
        
        elif category_name == 'Hospitality & Tourism':
            analysis += """Based on their responses:
- High scores in travel → Focus on destinations, itinerary planning
- High scores in food/cuisine → Focus on service, menu knowledge
- High scores in events → Focus on planning, coordination, details
- High scores in customer service → Focus on communication, problem-solving
- High scores in meeting people → Focus on friendliness, cultural sensitivity"""
        
        elif category_name == 'Business & Management':
            analysis += """Based on their responses:
- High scores in leadership → Focus on directing groups, decision-making
- High scores in entrepreneurship → Focus on business ideas, risk-taking
- High scores in finance/money → Focus on budgeting, investing
- High scores in marketing/selling → Focus on persuasion, customer understanding
- High scores in organization → Focus on planning, coordination"""
        
        else:
            # Generic analysis for any new / unknown category
            analysis += (
                f"Based on their responses, focus on areas where the student showed the most interest.\n"
                f"Develop questions that cover the fundamental aspects of {category_name}."
            )
        
        return analysis
    
    @classmethod
    def _get_personalized_fallback_real(cls, category_name, personal_answers, interest_tags, num_questions=12):
        """Generate personalized fallback questions based on personal answers"""
        
        # Calculate average score to determine interest level
        answer_values = list(personal_answers.values()) if personal_answers else []
        avg_score = sum(answer_values) / len(answer_values) if answer_values else 0
        
        # Get base question bank
        base_questions = cls._get_skill_based_fallback_real(category_name, interest_tags, None, 24)  # Get extra questions
        
        # If user has high interest, select more advanced/challenging questions
        # If low interest, select more basic/introductory questions
        
        if avg_score > 3.0:  # High interest
            # Select questions with tags that indicate depth
            advanced_tags = ['advanced', 'complex', 'detailed']
            selected = [q for q in base_questions if any(tag in advanced_tags for tag in q.get('tags', []))]
            if len(selected) < num_questions:
                selected.extend(base_questions[:num_questions - len(selected)])
        elif avg_score > 2.0:  # Moderate interest
            # Balanced selection
            selected = base_questions[:num_questions]
        else:  # Low interest / exploring
            # Select simpler, introductory questions
            basic_tags = ['basic', 'beginner', 'intro']
            selected = [q for q in base_questions if any(tag in basic_tags for tag in q.get('tags', []))]
            if len(selected) < num_questions:
                selected.extend(base_questions[:num_questions - len(selected)])
        
        # Shuffle and ensure we have exactly num_questions
        random.shuffle(selected)
        return selected[:num_questions]

    @classmethod
    def _generate_with_groq(cls, category_name, category_prompt, question_type, num_questions, api_key, interest_tags=None):
        """Call Groq API with enhanced prompts and better JSON extraction"""
        
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        if question_type == "personal":
            prompt = f"""You are creating a career guidance assessment for Grade 12 Senior High School students.

CATEGORY: {category_name}

{category_prompt}

Generate EXACTLY {num_questions} UNIQUE and DIVERSE INTEREST-BASED questions.

IMPORTANT REQUIREMENTS:
1. Ask about INTERESTS and PREFERENCES only - NOT skills
2. Use phrases like "Are you interested in...", "Do you enjoy...", "How curious are you about..."
3. DO NOT use phrases like "How well can you...", "Are you good at..."
4. DO NOT mention specific careers or job titles in the question text
5. Questions should be RELATABLE to Grade 12 students' daily lives

For answer choices, use EXACTLY these 4 options with values 1-4:
- For frequency questions: ["Never", "Sometimes", "Often", "Very often"]
- For interest questions: ["Not interested", "A little interested", "Interested", "Very interested"]
- For enjoyment questions: ["Not at all", "A little", "Quite a bit", "Very much"]

CRITICAL: Return ONLY a valid JSON array. Each question MUST have "text" and "options" fields.
The "options" field must be an array of objects with "text" and "value" properties.

Example format:
[
    {{
        "text": "How often do you help friends or family with their tech problems?",
        "options": [
            {{"text": "Never", "value": 1}},
            {{"text": "Sometimes", "value": 2}},
            {{"text": "Often", "value": 3}},
            {{"text": "Very often", "value": 4}}
        ]
    }}
]

Do NOT use "question" or "answers" fields. Use "text" and "options" exactly as shown.
Generate EXACTLY {num_questions} questions."""
            
        else:  # real questions
            prompt = f"""You are creating a career guidance assessment for Grade 12 Senior High School students.

CATEGORY: {category_name}

{category_prompt}

Generate EXACTLY {num_questions} SIMPLE SKILL-BASED questions.

IMPORTANT REQUIREMENTS:
1. Ask about SKILLS and ABILITIES - how WELL they can do things
2. Use phrases like "How well can you...", "Are you good at...", "Can you..."
3. DO NOT use interest-based phrases
4. DO NOT mention specific careers or job titles in the question text
5. Questions must be SIMPLE - a 17-year old should understand instantly
6. Personalize questions based on the interest analysis above

For answer choices, use EXACTLY these 4 options with values 1-4:
- For ability questions: ["Not well", "A little", "Okay", "Very well"]
- For frequency questions: ["Never", "Sometimes", "Often", "Always"]
- For confidence questions: ["Not confident", "A little", "Confident", "Very confident"]

CRITICAL: Return ONLY a valid JSON array. Each question MUST have "text", "options", and "tags" fields.
The "options" field must be an array of objects with "text" and "value" properties.

Example format:
[
    {{
        "text": "How well can you troubleshoot common computer problems?",
        "options": [
            {{"text": "Not well", "value": 1}},
            {{"text": "A little", "value": 2}},
            {{"text": "Okay", "value": 3}},
            {{"text": "Very well", "value": 4}}
        ],
        "tags": ["troubleshooting"]
    }}
]

Do NOT use "question" or "answers" fields. Use "text" and "options" exactly as shown.
Generate EXACTLY {num_questions} questions."""
        
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 4000,
        }
        
        try:
            logger.debug("Calling Groq API for category: %s", category_name)
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                # Extract JSON
                questions = None
                
                # Method 1: Find JSON between brackets
                match = re.search(r'\[\s*\{.*\}\s*\]', content, re.DOTALL)
                if match:
                    try:
                        json_str = match.group(0)
                        questions = json.loads(json_str)
                        logger.debug("Extracted JSON via regex for category: %s", category_name)
                    except Exception as e:
                        logger.debug("Regex JSON parse failed for category '%s': %s", category_name, e)
                        pass
                
                # Method 2: Remove markdown
                if not questions:
                    clean_content = content
                    if '```json' in content:
                        clean_content = content.split('```json')[1].split('```')[0].strip()
                    elif '```' in content:
                        clean_content = content.split('```')[1].split('```')[0].strip()
                    
                    try:
                        questions = json.loads(clean_content)
                        logger.debug("Extracted JSON after stripping code fences for category: %s", category_name)
                    except Exception as e:
                        logger.debug("Code-fence JSON parse failed for category '%s': %s", category_name, e)
                        pass
                
                # Method 3: Find first [ and last ]
                if not questions:
                    try:
                        start_idx = content.find('[')
                        end_idx = content.rfind(']') + 1
                        if start_idx != -1 and end_idx > start_idx:
                            json_str = content[start_idx:end_idx]
                            questions = json.loads(json_str)
                            logger.debug("Extracted JSON via bracket search for category: %s", category_name)
                    except Exception as e:
                        logger.debug("Bracket JSON parse failed for category '%s': %s", category_name, e)
                        pass
                
                if questions and isinstance(questions, list):
                    # Validate and clean - handle both formats
                    validated = []
                    for q in questions:
                        # Handle different possible field names
                        question_text = q.get('text') or q.get('question') or q.get('q')
                        if not question_text:
                            logger.debug("Skipping question with no text field for category: %s", category_name)
                            continue
                        
                        # Handle options
                        options = q.get('options') or q.get('answers') or q.get('choices')
                        if not options:
                            logger.debug("Skipping question with no options for category: %s", category_name)
                            continue
                        
                        # Convert options to standard format
                        formatted_options = []
                        if isinstance(options, list):
                            for i, opt in enumerate(options):
                                if isinstance(opt, dict):
                                    # Already in object format
                                    opt_text = opt.get('text') or opt.get('label') or str(opt)
                                    opt_value = opt.get('value', i + 1)
                                    formatted_options.append({
                                        'text': str(opt_text),
                                        'value': int(opt_value) if opt_value else i + 1
                                    })
                                elif isinstance(opt, str):
                                    # Simple string array
                                    formatted_options.append({
                                        'text': opt,
                                        'value': i + 1
                                    })
                                else:
                                    formatted_options.append({
                                        'text': str(opt),
                                        'value': i + 1
                                    })
                        
                        # Ensure we have exactly 4 options
                        if len(formatted_options) != 4:
                            logger.debug(
                                "Question has %d options (expected 4) for category: %s",
                                len(formatted_options), category_name
                            )
                            # Pad or truncate
                            default_options = [
                                {'text': 'Not well', 'value': 1},
                                {'text': 'A little', 'value': 2},
                                {'text': 'Okay', 'value': 3},
                                {'text': 'Very well', 'value': 4}
                            ]
                            while len(formatted_options) < 4:
                                formatted_options.append(default_options[len(formatted_options)])
                            formatted_options = formatted_options[:4]
                        
                        # Ensure values are 1-4
                        for i, opt in enumerate(formatted_options):
                            if opt['value'] not in [1, 2, 3, 4]:
                                opt['value'] = i + 1
                        
                        # Get tags
                        tags = q.get('tags', [])
                        if isinstance(tags, str):
                            tags = [tags]
                        
                        validated.append({
                            'text': question_text,
                            'options': formatted_options,
                            'tags': tags if tags else ['general']
                        })
                    
                    if len(validated) >= num_questions * 0.7:
                        logger.info("Groq returned %d valid questions for category: %s", len(validated), category_name)
                        return validated[:num_questions]
                    else:
                        logger.warning(
                            "Groq returned only %d of %d expected questions for category: %s",
                            len(validated), num_questions, category_name
                        )
                else:
                    logger.error("Could not extract valid JSON from Groq response for category: %s", category_name)
                    
            else:
                logger.error("Groq API error %d for category: %s", response.status_code, category_name)
                
        except Exception as e:
            logger.exception("Unexpected error calling Groq API for category '%s': %s", category_name, e)
        
        return None
    
    @classmethod
    def _get_interest_based_fallback_personal(cls, category_name, num_questions):
        """Interest-based fallback questions - same as before"""
          
        # Interest-based question banks for each category - CLEAN with proper boundaries
        question_banks = {
            'Technology': [
                {
                    'text': 'How often do you help friends or family with their phone or computer problems?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Very often', 'value': 4}
                    ]
                },
                {
                    'text': 'How interested are you in learning how apps and websites are built?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'How curious are you about how video games work behind the scenes?',
                    'options': [
                        {'text': 'Not curious', 'value': 1},
                        {'text': 'A little curious', 'value': 2},
                        {'text': 'Curious', 'value': 3},
                        {'text': 'Very curious', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you follow news about new gadgets, phones, or tech innovations?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'How interested are you in keeping information safe online?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'Have you ever wondered how artificial intelligence or chatbots work?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Very often', 'value': 4}
                    ]
                }
            ],
            
            'Health & Medical Science': [
                {
                    'text': 'How interested are you in helping friends or family when they\'re sick or injured?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'How curious are you about how the human body works?',
                    'options': [
                        {'text': 'Not curious', 'value': 1},
                        {'text': 'A little curious', 'value': 2},
                        {'text': 'Curious', 'value': 3},
                        {'text': 'Very curious', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy watching medical dramas or documentaries about health and medicine?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'Are you interested in fitness, nutrition, or helping people live healthier lives?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'How do you feel when you see someone who needs help in an emergency?',
                    'options': [
                        {'text': 'I would avoid getting involved', 'value': 1},
                        {'text': 'I\'m nervous but would try to help', 'value': 2},
                        {'text': 'I would step up to help', 'value': 3},
                        {'text': 'I feel drawn to help immediately', 'value': 4}
                    ]
                },
                {
                    'text': 'How interested are you in learning about mental health and emotional wellbeing?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                }
            ],
            
            'Education': [
                {
                    'text': 'Do you prefer teaching young children or teenagers?',
                    'options': [
                        {'text': 'Strongly prefer young children', 'value': 1},
                        {'text': 'Slightly prefer young children', 'value': 2},
                        {'text': 'Slightly prefer teenagers', 'value': 3},
                        {'text': 'Strongly prefer teenagers', 'value': 4}
                    ]
                },
                {
                    'text': 'How often do you find yourself explaining concepts to classmates who are struggling?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Very often', 'value': 4}
                    ]
                },
                {
                    'text': 'How do you feel when helping someone learn something new?',
                    'options': [
                        {'text': 'I find it frustrating', 'value': 1},
                        {'text': 'It\'s okay sometimes', 'value': 2},
                        {'text': 'I generally enjoy it', 'value': 3},
                        {'text': 'I love it - it\'s very satisfying', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy creating study guides or finding creative ways to explain topics?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy working with children or young people?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'How interested are you in understanding how people learn best?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                }
            ],
            
            'Engineering': [
                {
                    'text': 'How often do you take things apart to see how they work?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Very often', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy building things with LEGO, Minecraft, or similar construction games?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'How curious are you about how bridges, buildings, or skyscrapers are designed?',
                    'options': [
                        {'text': 'Not curious', 'value': 1},
                        {'text': 'A little curious', 'value': 2},
                        {'text': 'Curious', 'value': 3},
                        {'text': 'Very curious', 'value': 4}
                    ]
                },
                {
                    'text': 'Are you interested in how cars, planes, or trains work?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy solving puzzles or figuring out how things fit together?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'How interested are you in math and physics?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                }
            ],
            
            'Arts, Media, & Communication': [
                {
                    'text': 'How often do you create art, whether digital or traditional?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Very often', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy writing stories, poems, or keeping a journal?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'How interested are you in photography or taking aesthetic photos?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy editing videos or creating content for social media?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'Are you interested in fashion, design, or visual aesthetics?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy performing (singing, dancing, acting) or public speaking?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                }
            ],
            
            'Social Sciences': [
                {
                    'text': 'How often do you find yourself wondering why people behave the way they do?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Very often', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy discussing social issues like inequality, justice, or culture?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'How interested are you in learning about different cultures and traditions?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy watching documentaries about history, psychology, or society?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Very often', 'value': 4}
                    ]
                },
                {
                    'text': 'How do you feel about helping friends who are going through difficult times?',
                    'options': [
                        {'text': 'I prefer to stay out of it', 'value': 1},
                        {'text': 'I try to help a little', 'value': 2},
                        {'text': 'I want to help if I can', 'value': 3},
                        {'text': 'I feel strongly called to help', 'value': 4}
                    ]
                },
                {
                    'text': 'Are you interested in current events, politics, or how society is organized?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                }
            ],
            
            'Hospitality & Tourism': [
                {
                    'text': 'How much do you enjoy traveling to new places and experiencing different cultures?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'How do you feel about talking to people you\'ve just met?',
                    'options': [
                        {'text': 'I avoid it if possible', 'value': 1},
                        {'text': 'I\'m a bit nervous but can do it', 'value': 2},
                        {'text': 'I enjoy it', 'value': 3},
                        {'text': 'I love meeting new people', 'value': 4}
                    ]
                },
                {
                    'text': 'Are you interested in trying foods from different cultures?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy planning events or parties for friends and family?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'How often do you watch travel vlogs or content about different destinations?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Very often', 'value': 4}
                    ]
                },
                {
                    'text': 'How interested are you in learning about different cultures and their customs?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                }
            ],
            
            'Business & Management': [
                {
                    'text': 'How often do you naturally take the lead in group projects or activities?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Very often', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you enjoy organizing events or coordinating activities with friends?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                },
                {
                    'text': 'How interested are you in making money, saving, or investing?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little interested', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ]
                },
                {
                    'text': 'Have you ever thought about starting your own business someday?',
                    'options': [
                        {'text': 'Never thought about it', 'value': 1},
                        {'text': 'Thought about it sometimes', 'value': 2},
                        {'text': 'Thought about it often', 'value': 3},
                        {'text': 'Yes, I have specific ideas', 'value': 4}
                    ]
                },
                {
                    'text': 'How do you feel about making decisions that affect others?',
                    'options': [
                        {'text': 'I avoid it', 'value': 1},
                        {'text': 'I\'m uncomfortable but can do it', 'value': 2},
                        {'text': 'I\'m comfortable with it', 'value': 3},
                        {'text': 'I thrive on it', 'value': 4}
                    ]
                },
                {
                    'text': 'Do you pay attention to business news or shows about entrepreneurship?',
                    'options': [
                        {'text': 'Not at all', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite a bit', 'value': 3},
                        {'text': 'Very much', 'value': 4}
                    ]
                }
            ]
        }
        
        # Get bank for this category or use generic
        bank = question_banks.get(category_name, [
            {
                'text': f'How interested are you in exploring topics related to {category_name}?',
                'options': [
                    {'text': 'Not interested', 'value': 1},
                    {'text': 'A little interested', 'value': 2},
                    {'text': 'Interested', 'value': 3},
                    {'text': 'Very interested', 'value': 4}
                ]
            }
        ])
        
        # Shuffle and repeat to reach num_questions with variety
        random.shuffle(bank)
        questions = []
        for i in range(num_questions):
            q = bank[i % len(bank)].copy()
            questions.append(q)
        
        return questions
    
    @classmethod
    def _get_skill_based_fallback_real(cls, category_name, interest_tags, teaching_preference=None, num_questions=12):
        """Skill-based fallback questions - FIXED with truly unique tags per question"""
        
        # Skill-based questions for each category - COMPLETELY UNIQUE TAGS per question
        skill_questions = {
            'Technology': [
                {
                    'text': 'How well can you troubleshoot common computer problems?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['troubleshooting']
                },
                {
                    'text': 'How quickly can you learn to use a new app or software?',
                    'options': [
                        {'text': 'Very slowly', 'value': 1},
                        {'text': 'Slowly', 'value': 2},
                        {'text': 'Quickly', 'value': 3},
                        {'text': 'Very quickly', 'value': 4}
                    ],
                    'tags': ['learning']
                },
                {
                    'text': 'Are you good at finding information online when you need it?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['research']
                },
                {
                    'text': 'Can you spot if an email or message might be a scam?',
                    'options': [
                        {'text': 'No, not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['safety']
                },
                {
                    'text': 'How good are you at organizing files and folders on a computer?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['organization']
                },
                {
                    'text': 'Can you explain technical concepts to someone who isn\'t tech-savvy?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['communication']
                },
                {
                    'text': 'How well do you understand how computers and devices work?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['technical']
                },
                {
                    'text': 'Are you good at adapting when software or apps change?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['adaptability']
                },
                {
                    'text': 'How comfortable are you with using different types of software?',
                    'options': [
                        {'text': 'Not comfortable', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Comfortable', 'value': 3},
                        {'text': 'Very comfortable', 'value': 4}
                    ],
                    'tags': ['computer_skills']
                },
                {
                    'text': 'Can you easily navigate and use new websites or platforms?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['apps']
                },
                {
                    'text': 'How good are you at finding solutions to tech problems online?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['online_skills']
                },
                {
                    'text': 'Do you know how to keep your personal information safe online?',
                    'options': [
                        {'text': 'No', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['digital_literacy']
                }
            ],
            
            'Health & Medical Science': [
                {
                    'text': 'Do you know what to do if someone gets a minor cut or burn?',
                    'options': [
                        {'text': 'No', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes, basic', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['first_aid']
                },
                {
                    'text': 'Can you stay calm when someone is hurt or in pain?',
                    'options': [
                        {'text': 'No, I panic', 'value': 1},
                        {'text': 'A little nervous', 'value': 2},
                        {'text': 'Yes, usually calm', 'value': 3},
                        {'text': 'Yes, very calm', 'value': 4}
                    ],
                    'tags': ['calmness']
                },
                {
                    'text': 'How well do you understand medicine labels and instructions?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Quite well', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['attention']
                },
                {
                    'text': 'Are you good at remembering medical terms or health information?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['memory']
                },
                {
                    'text': 'Can you communicate with empathy when someone is scared or in pain?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['empathy']
                },
                {
                    'text': 'How good are you at following exact procedures and instructions?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['procedures']
                },
                {
                    'text': 'Do you pay attention to health and wellness information?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Always', 'value': 4}
                    ],
                    'tags': ['health_awareness']
                },
                {
                    'text': 'Can you understand and explain health concepts to others?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['understanding']
                },
                {
                    'text': 'How good are you at listening to people describe their symptoms?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['listening']
                },
                {
                    'text': 'Are you comfortable with basic first aid and emergency response?',
                    'options': [
                        {'text': 'Not comfortable', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Comfortable', 'value': 3},
                        {'text': 'Very comfortable', 'value': 4}
                    ],
                    'tags': ['clinical']
                },
                {
                    'text': 'Can you show compassion when someone is unwell?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['patient_care']
                },
                {
                    'text': 'How well do you understand basic human anatomy?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['clinical']
                }
            ],
            
            'Education': [
                {
                    'text': 'Can you explain a difficult topic in a way that others can understand?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Yes, usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['teaching']
                },
                {
                    'text': 'How patient are you when someone takes time to learn something?',
                    'options': [
                        {'text': 'Not patient', 'value': 1},
                        {'text': 'A little patient', 'value': 2},
                        {'text': 'Patient', 'value': 3},
                        {'text': 'Very patient', 'value': 4}
                    ],
                    'tags': ['patience']
                },
                {
                    'text': 'Are you good at creating study materials or finding creative ways to learn?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['creativity']
                },
                {
                    'text': 'Can you adapt your explanations for different age groups or learning styles?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['adaptability']
                },
                {
                    'text': 'How comfortable are you speaking in front of a group?',
                    'options': [
                        {'text': 'Not comfortable', 'value': 1},
                        {'text': 'A little comfortable', 'value': 2},
                        {'text': 'Comfortable', 'value': 3},
                        {'text': 'Very comfortable', 'value': 4}
                    ],
                    'tags': ['public_speaking']
                },
                {
                    'text': 'Can you keep a group of people engaged and interested?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['engagement']
                },
                {
                    'text': 'How well can you break down complex topics into simple steps?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['instruction']
                },
                {
                    'text': 'Are you good at giving helpful feedback without discouraging others?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['communication']
                },
                {
                    'text': 'Can you tell when someone is confused even if they don\'t say it?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['understanding']
                },
                {
                    'text': 'How well do you manage a classroom or group of learners?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['teaching']
                },
                {
                    'text': 'Can you explain the same concept in multiple different ways?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['explaining']
                },
                {
                    'text': 'How good are you at motivating others to learn?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['engagement']
                }
            ],
            
            'Engineering': [
                {
                    'text': 'Are you good at following instructions to build or assemble things?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['following_instructions']
                },
                {
                    'text': 'Can you estimate measurements (like length or size) pretty accurately?',
                    'options': [
                        {'text': 'No, not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Yes, usually', 'value': 3},
                        {'text': 'Yes, very accurate', 'value': 4}
                    ],
                    'tags': ['measurement']
                },
                {
                    'text': 'Do you enjoy figuring out how to fix broken things around the house?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, love it', 'value': 4}
                    ],
                    'tags': ['fixing']
                },
                {
                    'text': 'Can you visualize how something would look in 3D from a 2D drawing?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['visualization']
                },
                {
                    'text': 'How good are you at breaking down complex problems into smaller steps?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['analytical']
                },
                {
                    'text': 'Do you pay attention to how things are built or manufactured?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very much', 'value': 4}
                    ],
                    'tags': ['observation']
                },
                {
                    'text': 'How well can you solve puzzles or logic problems?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['problem_solving']
                },
                {
                    'text': 'Can you figure out how mechanical devices work just by looking at them?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['spatial_reasoning']
                },
                {
                    'text': 'Are you good at building things with your hands?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['building']
                },
                {
                    'text': 'Can you estimate how much material is needed for a simple project?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['estimation']
                },
                {
                    'text': 'How well do you understand basic physics concepts?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['technical']
                },
                {
                    'text': 'Can you design or sketch simple structures or objects?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['design']
                }
            ],
            
            'Arts, Media, & Communication': [
                {
                    'text': 'Can you take photos that people compliment or appreciate?',
                    'options': [
                        {'text': 'No, not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Yes, usually', 'value': 3},
                        {'text': 'Yes, very good', 'value': 4}
                    ],
                    'tags': ['photography']
                },
                {
                    'text': 'How good are you at writing clearly so others understand your message?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['writing']
                },
                {
                    'text': 'Can you create simple designs or edits using apps like Canva?',
                    'options': [
                        {'text': 'No', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['design']
                },
                {
                    'text': 'Do people enjoy watching videos or content you create?',
                    'options': [
                        {'text': 'I don\'t create content', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['content_creation']
                },
                {
                    'text': 'How well can you tell a story that keeps people interested?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['storytelling']
                },
                {
                    'text': 'Do you have a good sense of what looks visually appealing?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very good', 'value': 4}
                    ],
                    'tags': ['aesthetic_sense']
                },
                {
                    'text': 'How comfortable are you performing or presenting to an audience?',
                    'options': [
                        {'text': 'Not comfortable', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Comfortable', 'value': 3},
                        {'text': 'Very comfortable', 'value': 4}
                    ],
                    'tags': ['public_speaking']
                },
                {
                    'text': 'Are you good at coming up with creative ideas?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['creativity']
                },
                {
                    'text': 'Can you edit photos or videos to make them look better?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['content_creation']
                },
                {
                    'text': 'How well can you express emotions through art or performance?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['creativity']
                },
                {
                    'text': 'Can you design visually appealing layouts or graphics?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['design']
                },
                {
                    'text': 'How good are you at capturing moments or emotions in photos?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['photography']
                }
            ],
            
            'Social Sciences': [
                {
                    'text': 'Can you usually understand why someone might feel a certain way?',
                    'options': [
                        {'text': 'No, not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Yes, usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['empathy']
                },
                {
                    'text': 'How well can you discuss different opinions without arguments?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['communication']
                },
                {
                    'text': 'Are you good at listening when friends share their problems?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['listening']
                },
                {
                    'text': 'Can you look at a situation from multiple perspectives?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['perspective_taking']
                },
                {
                    'text': 'How interested are you in understanding why people behave the way they do?',
                    'options': [
                        {'text': 'Not interested', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Interested', 'value': 3},
                        {'text': 'Very interested', 'value': 4}
                    ],
                    'tags': ['analysis']
                },
                {
                    'text': 'Can you identify patterns in how people behave or interact?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['observation']
                },
                {
                    'text': 'How well can you remain neutral when hearing different viewpoints?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['respect']
                },
                {
                    'text': 'Are you good at researching and analyzing information?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['analysis']
                },
                {
                    'text': 'Can you recognize when information might be biased or unreliable?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['critical_thinking']
                },
                {
                    'text': 'How well do you understand different cultural perspectives?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['understanding']
                },
                {
                    'text': 'Can you support friends going through difficult times?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['support']
                },
                {
                    'text': 'How good are you at explaining social issues to others?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['communication']
                }
            ],
            
            'Hospitality & Tourism': [
                {
                    'text': 'Are you good at welcoming new people and making them feel comfortable?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['welcoming']
                },
                {
                    'text': 'Can you stay calm and helpful when someone is upset or complaining?',
                    'options': [
                        {'text': 'No, I get upset', 'value': 1},
                        {'text': 'A little nervous', 'value': 2},
                        {'text': 'Yes, usually', 'value': 3},
                        {'text': 'Yes, very calm', 'value': 4}
                    ],
                    'tags': ['customer_service']
                },
                {
                    'text': 'How good are you at remembering what people like or prefer?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['memory']
                },
                {
                    'text': 'Can you give clear directions or suggest places for people to visit?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['communication']
                },
                {
                    'text': 'How comfortable are you with multitasking in a busy environment?',
                    'options': [
                        {'text': 'Not comfortable', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Comfortable', 'value': 3},
                        {'text': 'Very comfortable', 'value': 4}
                    ],
                    'tags': ['multitasking']
                },
                {
                    'text': 'Do you enjoy helping people have a good experience?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Yes', 'value': 3},
                        {'text': 'Yes, very much', 'value': 4}
                    ],
                    'tags': ['service_mindset']
                },
                {
                    'text': 'How well can you handle stressful situations without getting overwhelmed?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['stress_management']
                },
                {
                    'text': 'Are you naturally friendly and approachable to strangers?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['friendliness']
                },
                {
                    'text': 'Can you organize events or activities that people enjoy?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['planning']
                },
                {
                    'text': 'How attentive are you to small details that matter to customers?',
                    'options': [
                        {'text': 'Not attentive', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Attentive', 'value': 3},
                        {'text': 'Very attentive', 'value': 4}
                    ],
                    'tags': ['attention']
                },
                {
                    'text': 'Can you work well in a team to serve customers?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['teamwork']
                },
                {
                    'text': 'How good are you at anticipating what people might need?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['service_mindset']
                }
            ],
            
            'Business & Management': [
                {
                    'text': 'Do you naturally take charge when working in a group?',
                    'options': [
                        {'text': 'No, I follow', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Yes, often', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['leadership']
                },
                {
                    'text': 'Are you good at organizing events or coordinating activities?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['organization']
                },
                {
                    'text': 'Can you manage your money or allowance responsibly?',
                    'options': [
                        {'text': 'No, I spend quickly', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Yes, usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['money_management']
                },
                {
                    'text': 'How comfortable are you with making decisions that affect a group?',
                    'options': [
                        {'text': 'Not comfortable', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Comfortable', 'value': 3},
                        {'text': 'Very comfortable', 'value': 4}
                    ],
                    'tags': ['decision_making']
                },
                {
                    'text': 'Can you persuade others to see your point of view?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['persuasion']
                },
                {
                    'text': 'How good are you at planning ahead and meeting deadlines?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['planning']
                },
                {
                    'text': 'Do you take initiative without being asked?',
                    'options': [
                        {'text': 'Never', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Often', 'value': 3},
                        {'text': 'Always', 'value': 4}
                    ],
                    'tags': ['initiative']
                },
                {
                    'text': 'How confident are you when leading a team?',
                    'options': [
                        {'text': 'Not confident', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Confident', 'value': 3},
                        {'text': 'Very confident', 'value': 4}
                    ],
                    'tags': ['confidence']
                },
                {
                    'text': 'Can you handle responsibility for important tasks?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['responsibility']
                },
                {
                    'text': 'How well do you manage your time on multiple projects?',
                    'options': [
                        {'text': 'Not well', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Okay', 'value': 3},
                        {'text': 'Very well', 'value': 4}
                    ],
                    'tags': ['time_management']
                },
                {
                    'text': 'Can you set goals and work consistently toward them?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['planning']
                },
                {
                    'text': 'How good are you at negotiating with others?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['persuasion']
                }
            ]
        }
        
        # Get questions for this category or use generic
        bank = skill_questions.get(category_name, [
            {
                'text': f'How confident are you in your abilities related to {category_name}?',
                'options': [
                    {'text': 'Not confident', 'value': 1},
                    {'text': 'A little confident', 'value': 2},
                    {'text': 'Confident', 'value': 3},
                    {'text': 'Very confident', 'value': 4}
                ],
                'tags': ['confidence']
            }
        ])
        
        # For Education, add personalized questions based on teaching preference
        questions = []
        if category_name == 'Education' and teaching_preference:
            if teaching_preference == 'elementary':
                questions.append({
                    'text': 'Are you good at making learning fun and playful for younger children?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['creativity']
                })
                questions.append({
                    'text': 'Can you be patient with young children who have short attention spans?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, always', 'value': 4}
                    ],
                    'tags': ['patience']
                })
            elif teaching_preference == 'secondary':
                questions.append({
                    'text': 'Are you good at explaining complex topics in a way that older students can understand?',
                    'options': [
                        {'text': 'Not good', 'value': 1},
                        {'text': 'A little', 'value': 2},
                        {'text': 'Good', 'value': 3},
                        {'text': 'Very good', 'value': 4}
                    ],
                    'tags': ['explaining']
                })
                questions.append({
                    'text': 'Can you handle classroom discussions where students have different opinions?',
                    'options': [
                        {'text': 'Not really', 'value': 1},
                        {'text': 'Sometimes', 'value': 2},
                        {'text': 'Usually', 'value': 3},
                        {'text': 'Yes, very well', 'value': 4}
                    ],
                    'tags': ['communication']
                })
        
        # Fill remaining with bank questions, ensuring variety
        remaining = num_questions - len(questions)
        if remaining > 0:
            # Shuffle bank to get variety
            shuffled_bank = bank.copy()
            random.shuffle(shuffled_bank)
            
            for i in range(remaining):
                q = shuffled_bank[i % len(shuffled_bank)].copy()
                questions.append(q)
        
        return questions[:num_questions]