# backend/controllers/category_controller.py

from flask import Blueprint, jsonify, request
from models import CareerCategory, db, Course
from utils.auth import login_required, admin_required

category_bp = Blueprint('categories', __name__)


@category_bp.route('/', methods=['GET'])
def get_categories():
    """Get all career categories"""
    try:
        categories = CareerCategory.query.order_by(CareerCategory.display_order).all()
        return jsonify([c.to_dict() for c in categories]), 200
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify({'msg': 'Error loading categories'}), 500

@category_bp.route('/<int:category_id>', methods=['GET'])
def get_category(category_id):
    """Get single category details"""
    try:
        category = CareerCategory.query.get_or_404(category_id)
        return jsonify(category.to_dict()), 200
    except Exception as e:
        print(f"Error fetching category: {e}")
        return jsonify({'msg': 'Category not found'}), 404


@category_bp.route('/<int:category_id>/courses', methods=['GET'])
def get_category_courses(category_id):
    """Get all courses for a specific category"""
    try:
        courses = Course.query.filter_by(category_id=category_id).all()
        return jsonify([c.to_dict() for c in courses]), 200
    except Exception as e:
        print(f"Error fetching courses: {e}")
        return jsonify({'msg': 'Error loading courses'}), 500


# Admin routes for category management
@category_bp.route('/', methods=['POST'])
@admin_required
def create_category():
    """Create new category (admin only)"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'msg': 'Category name required'}), 400
        
        category = CareerCategory(
            name=data['name'],
            description=data.get('description', ''),
            icon=data.get('icon', '📁'),
            color=data.get('color', 'gray'),
            display_order=data.get('display_order', 0)
        )
        db.session.add(category)
        db.session.commit()
        
        return jsonify({'msg': 'Category created', 'id': category.id}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating category: {e}")
        return jsonify({'msg': 'Error creating category'}), 500


@category_bp.route('/<int:category_id>', methods=['PUT'])
@admin_required
def update_category(category_id):
    """Update category (admin only)"""
    try:
        category = CareerCategory.query.get_or_404(category_id)
        data = request.get_json()
        
        for field in ['name', 'description', 'icon', 'color', 'display_order']:
            if field in data:
                setattr(category, field, data[field])
        
        db.session.commit()
        return jsonify({'msg': 'Category updated'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating category: {e}")
        return jsonify({'msg': 'Error updating category'}), 500


@category_bp.route('/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    """Delete category (admin only)"""
    try:
        category = CareerCategory.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        return jsonify({'msg': 'Category deleted'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting category: {e}")
        return jsonify({'msg': 'Error deleting category'}), 500