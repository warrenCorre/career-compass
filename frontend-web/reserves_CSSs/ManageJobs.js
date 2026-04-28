// frontend-web/src/pages/admin/ManageJobs.js - NEW FILE

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  BriefcaseIcon,
  TagIcon,
  LinkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import ConfirmModal from '../src/components/admin/ConfirmModal';
import LoadingSpinner from '../src/components/LoadingSpinner';

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [stats, setStats] = useState({ total_jobs: 0, jooble_jobs: 0, mock_jobs: 0 });
  const [formData, setFormData] = useState({
    career_id: '',
    company: '',
    title: '',
    location: '',
    description: '',
    skills: [],
    salary_min: '',
    salary_max: '',
    currency: '₱',
    job_url: '',
    source: 'admin',
    posted_at: new Date().toISOString().slice(0, 16)
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, careersRes] = await Promise.all([
        axios.get('/api/admin/jobs'),
        axios.get('/api/admin/careers')
      ]);
      
      setJobs(jobsRes.data.jobs || []);
      setCareers(careersRes.data.careers || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.msg || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/jobs/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      career_id: job.career_id || '',
      company: job.company,
      title: job.title,
      location: job.location || '',
      description: job.description || '',
      skills: job.skills || [],
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      currency: job.currency || '₱',
      job_url: job.job_url || '',
      source: job.source || 'admin',
      posted_at: job.posted_at ? new Date(job.posted_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
    });
    setShowModal(true);
  };

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    
    try {
      setError('');
      await axios.delete(`/api/admin/jobs/${jobToDelete.id}`);
      setSuccess('Job deleted successfully');
      setShowDeleteConfirm(false);
      setJobToDelete(null);
      fetchData();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting job');
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!formData.company || !formData.title) {
        setError('Company and job title are required');
        return;
      }

      const payload = {
        ...formData,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        career_id: formData.career_id ? parseInt(formData.career_id) : null
      };

      if (editingJob) {
        await axios.put(`/api/admin/jobs/${editingJob.id}`, payload);
        setSuccess('Job updated successfully');
      } else {
        await axios.post('/api/admin/jobs', payload);
        setSuccess('Job created successfully');
      }
      
      setShowModal(false);
      setEditingJob(null);
      setFormData({
        career_id: '',
        company: '',
        title: '',
        location: '',
        description: '',
        skills: [],
        salary_min: '',
        salary_max: '',
        currency: '₱',
        job_url: '',
        source: 'admin',
        posted_at: new Date().toISOString().slice(0, 16)
      });
      fetchData();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error saving job');
    }
  };

  const resetForm = () => {
    setEditingJob(null);
    setFormData({
      career_id: '',
      company: '',
      title: '',
      location: '',
      description: '',
      skills: [],
      salary_min: '',
      salary_max: '',
      currency: '₱',
      job_url: '',
      source: 'admin',
      posted_at: new Date().toISOString().slice(0, 16)
    });
    setSkillInput('');
  };

  const getCareerName = (careerId) => {
    const career = careers.find(c => c.id === careerId);
    return career ? career.title : 'No specific career';
  };

  const getSourceBadge = (source) => {
    switch(source) {
      case 'jooble': return { text: 'Jooble API', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'ph_mock': return { text: 'Mock Data', color: 'bg-green-100 text-green-700 border-green-200' };
      case 'admin': return { text: 'Manual Entry', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      default: return { text: source || 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = !selectedSource || job.source === selectedSource;
    return matchesSearch && matchesSource;
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
              Manage Job Listings
            </h1>
            <p className="text-gray-600 mt-2">Total jobs: {stats.total_jobs} | Jooble: {stats.jooble_jobs} | Manual: {stats.mock_jobs}</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all hover:shadow-lg group"
          >
            <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            Add Job
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_jobs}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <BriefcaseIcon className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Jooble API</p>
              <p className="text-2xl font-bold text-blue-600">{stats.jooble_jobs}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <CloudIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Manual/Mock</p>
              <p className="text-2xl font-bold text-green-600">{stats.mock_jobs}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
        
        <div className="relative min-w-[200px]">
          <CloudIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
          >
            <option value="">All Sources</option>
            <option value="jooble">Jooble API</option>
            <option value="ph_mock">Mock Data</option>
            <option value="admin">Manual Entry</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            setSearchTerm('');
            setSelectedSource('');
          }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
        >
          Clear Filters
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Job Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Salary</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Source</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Related Career</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job, idx) => {
                  const sourceBadge = getSourceBadge(job.source);
                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{job.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{job.description?.substring(0, 60)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{job.company}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPinIcon className="h-3 w-3 mr-1 text-gray-400" />
                          {job.location || 'Philippines'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {job.salary_min ? (
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-3 w-3 mr-1 text-gray-400" />
                            ₱{job.salary_min.toLocaleString()} - ₱{job.salary_max?.toLocaleString()}
                          </div>
                        ) : (
                          'Not specified'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${sourceBadge.color}`}>
                          {sourceBadge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getCareerName(job.career_id)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {job.job_url && (
                            <a
                              href={job.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              title="View Job"
                            >
                              <LinkIcon className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleEdit(job)}
                            className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(job)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Modal */}
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
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">
                      {editingJob ? 'Edit Job' : 'Add New Job'}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title *
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
                        Company *
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="e.g., Tech Solutions Inc."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                          placeholder="Makati City, Philippines"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Related Career
                      </label>
                      <select
                        value={formData.career_id}
                        onChange={(e) => setFormData({...formData, career_id: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      >
                        <option value="">No specific career</option>
                        {careers.map(career => (
                          <option key={career.id} value={career.id}>{career.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Salary (₱)
                      </label>
                      <input
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="25000"
                        min="0"
                        step="1000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Salary (₱)
                      </label>
                      <input
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="60000"
                        min="0"
                        step="1000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <input
                        type="text"
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="₱"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={formData.job_url}
                        onChange={(e) => setFormData({...formData, job_url: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="https://example.com/job"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="4"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="Job description, responsibilities, requirements..."
                    />
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
                        placeholder="Add a skill (e.g., Python, JavaScript)"
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
                      {formData.skills.map((skill, idx) => (
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source
                      </label>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      >
                        <option value="admin">Manual Entry</option>
                        <option value="ph_mock">Mock Data</option>
                        <option value="jooble">Jooble API</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Posted Date
                      </label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="datetime-local"
                          value={formData.posted_at}
                          onChange={(e) => setFormData({...formData, posted_at: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                      </div>
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
                    {editingJob ? 'Update Job' : 'Create Job'}
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
        title="Delete Job"
        message={`Are you sure you want to delete "${jobToDelete?.title}" at ${jobToDelete?.company}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ManageJobs;