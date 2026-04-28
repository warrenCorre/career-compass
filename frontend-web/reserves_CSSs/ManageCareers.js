// frontend-web/src/pages/admin/ManageCareers.js - FINAL STYLED VERSION
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BriefcaseIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import ConfirmModal from '../src/components/admin/ConfirmModal';
import LoadingSpinner from '../src/components/LoadingSpinner';

const ManageCareers = () => {
  const [careers, setCareers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCareer, setEditingCareer] = useState(null);
  const [careerToDelete, setCareerToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    salary_min: '',
    salary_max: '',
    demand_level: 'Medium',
    required_skills: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [careersRes, coursesRes] = await Promise.all([
        axios.get('/api/admin/careers'),
        axios.get('/api/admin/courses')
      ]);
      
      setCareers(careersRes.data.careers || careersRes.data || []);
      setCourses(coursesRes.data.courses || coursesRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.msg || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (career) => {
    setEditingCareer(career);
    setFormData({
      title: career.title,
      description: career.description || '',
      course_id: career.course_id,
      salary_min: career.salary_min,
      salary_max: career.salary_max,
      demand_level: career.demand_level || 'Medium',
      required_skills: career.required_skills || []
    });
    setShowModal(true);
  };

  const handleDeleteClick = (career) => {
    setCareerToDelete(career);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!careerToDelete) return;
    
    try {
      setError('');
      await axios.delete(`/api/admin/careers/${careerToDelete.id}`);
      setSuccess('Career deleted successfully');
      setShowDeleteConfirm(false);
      setCareerToDelete(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting career');
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter(s => s !== skill)
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!formData.title || !formData.course_id || !formData.salary_min || !formData.salary_max) {
        setError('Please fill in all required fields');
        return;
      }

      const payload = {
        ...formData,
        salary_min: parseFloat(formData.salary_min),
        salary_max: parseFloat(formData.salary_max)
      };

      if (editingCareer) {
        await axios.put(`/api/admin/careers/${editingCareer.id}`, payload);
        setSuccess('Career updated successfully');
      } else {
        await axios.post('/api/admin/careers', payload);
        setSuccess('Career created successfully');
      }
      
      setShowModal(false);
      setEditingCareer(null);
      setFormData({
        title: '',
        description: '',
        course_id: '',
        salary_min: '',
        salary_max: '',
        demand_level: 'Medium',
        required_skills: []
      });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error saving career');
    }
  };

  const resetForm = () => {
    setEditingCareer(null);
    setFormData({
      title: '',
      description: '',
      course_id: '',
      salary_min: '',
      salary_max: '',
      demand_level: 'Medium',
      required_skills: []
    });
    setSkillInput('');
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? `${course.course_code} - ${course.course_name}` : 'Unknown';
  };

  const filteredCareers = careers.filter(career => {
    const matchesSearch = career.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (career.description && career.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCourse = !selectedCourse || career.course_id === parseInt(selectedCourse);
    return matchesSearch && matchesCourse;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Manage Careers
            </h1>
            <p className="text-gray-600 mt-2">Total careers: {filteredCareers.length}</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all hover:shadow-lg group"
          >
            <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            Add Career
          </button>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded"
          >
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded"
          >
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <p className="ml-3 text-sm text-green-700">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search careers by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
        
        <div className="relative min-w-[250px]">
          <AcademicCapIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.course_code} - {course.course_name}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={fetchData}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
          title="Refresh"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Careers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Course</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Salary Range</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Demand</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Skills</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCareers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No careers found
                  </td>
                </tr>
              ) : (
                filteredCareers.map((career, idx) => (
                  <tr key={career.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{career.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{career.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium border border-primary-200">
                        {getCourseName(career.course_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ₱{career.salary_min?.toLocaleString()} - ₱{career.salary_max?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        career.demand_level === 'High' ? 'bg-green-100 text-green-700 border border-green-200' :
                        career.demand_level === 'Medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {career.demand_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {career.required_skills?.slice(0, 3).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                        {career.required_skills?.length > 3 && (
                          <span className="text-xs text-gray-400">+{career.required_skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(career)}
                          className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(career)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Career Modal - Same as before */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">
                      {editingCareer ? 'Edit Career' : 'Add New Career'}
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Career Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="e.g., Software Engineer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="Describe the career role..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course *
                    </label>
                    <select
                      value={formData.course_id}
                      onChange={(e) => setFormData({...formData, course_id: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.course_code} - {course.course_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Salary (₱) *
                      </label>
                      <div className="relative">
                        <CurrencyDollarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.salary_min}
                          onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                          placeholder="25000"
                          min="0"
                          step="1000"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Salary (₱) *
                      </label>
                      <div className="relative">
                        <CurrencyDollarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.salary_max}
                          onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                          placeholder="60000"
                          min="0"
                          step="1000"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Demand Level *
                    </label>
                    <div className="flex gap-3">
                      {['High', 'Medium', 'Low'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, demand_level: level})}
                          className={`px-6 py-2 rounded-lg font-medium transition-all ${
                            formData.demand_level === level
                              ? level === 'High' ? 'bg-green-500 text-white' :
                                level === 'Medium' ? 'bg-yellow-500 text-white' :
                                'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Skills
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Add a skill (e.g., Python)"
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.required_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm flex items-center"
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-primary-700 hover:text-primary-900"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl flex justify-end space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    {editingCareer ? 'Update Career' : 'Create Career'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Career"
        message={`Are you sure you want to delete "${careerToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ManageCareers;