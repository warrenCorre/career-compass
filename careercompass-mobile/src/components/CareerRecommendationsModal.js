import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

export default function CareerRecommendationsModal({ visible, onClose, career }) {
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    if (visible && career?.career_id) {
      fetchRelatedJobs();
    }
  }, [visible, career]);

  const fetchRelatedJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await api.get(`/api/jobs/by-career/${career.career_id}?limit=3`);
      if (response.data.success) {
        setRelatedJobs(response.data.jobs);
      }
    } catch (err) {
      console.error('Error fetching related jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDemandColor = (demand) => {
    switch(demand) {
      case 'High': return '#10b981';
      case 'Medium': return '#eab308';
      case 'Low': return '#ef4444';
      default: return '#4A6A3B';
    }
  };

  if (!career) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Icon name="briefcase" size={28} color="#fff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>{career.title}</Text>
                <View style={styles.headerBadges}>
                  <View style={[styles.demandBadge, { backgroundColor: getDemandColor(career.demand_level) + '20' }]}>
                    <Text style={[styles.demandBadgeText, { color: getDemandColor(career.demand_level) }]}>
                      {career.demand_level} Demand
                    </Text>
                  </View>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>{career.match_score}% Match</Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Career Overview */}
            <View style={styles.overviewCard}>
              <Text style={styles.sectionTitle}>
                <Icon name="information" size={18} color="#4A6A3B" /> Career Overview
              </Text>
              <Text style={styles.overviewText}>
                {career.description || `A career as a ${career.title}`}
              </Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Icon name="currency-usd" size={24} color="#10b981" />
                  <Text style={styles.statLabel}>Salary Range</Text>
                  <Text style={styles.statValue}>
                    ₱{career.salary_min?.toLocaleString()} - ₱{career.salary_max?.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Icon name="trending-up" size={24} color="#4A6A3B" />
                  <Text style={styles.statLabel}>Demand Level</Text>
                  <Text style={[styles.statValue, { color: getDemandColor(career.demand_level) }]}>
                    {career.demand_level}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Icon name="star" size={24} color="#eab308" />
                  <Text style={styles.statLabel}>Match Score</Text>
                  <Text style={styles.statValue}>{career.match_score}%</Text>
                </View>
              </View>
            </View>

            {/* Required Skills */}
            {career.required_skills?.length > 0 && (
              <View style={styles.skillsCard}>
                <Text style={styles.sectionTitle}>
                  <Icon name="check-circle" size={18} color="#10b981" /> Required Skills
                </Text>
                <View style={styles.skillsList}>
                  {career.required_skills.map((skill, idx) => (
                    <View key={idx} style={styles.skillItem}>
                      <Icon name="tag" size={14} color="#4A6A3B" />
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Real-Time Job Listings */}
            <View style={styles.jobsCard}>
              <Text style={styles.sectionTitle}>
                <Icon name="briefcase" size={18} color="#4A6A3B" /> Real-Time Job Openings
              </Text>
              
              {loadingJobs ? (
                <View style={styles.loadingJobs}>
                  <ActivityIndicator size="small" color="#4A6A3B" />
                  <Text style={styles.loadingText}>Fetching latest jobs...</Text>
                </View>
              ) : relatedJobs.length > 0 ? (
                relatedJobs.map((job, idx) => (
                  <View key={idx} style={styles.jobItem}>
                    <Text style={styles.jobItemTitle}>{job.title}</Text>
                    <Text style={styles.jobItemCompany}>{job.company}</Text>
                    <View style={styles.jobItemDetails}>
                      <Icon name="map-marker" size={12} color="#999" />
                      <Text style={styles.jobItemDetail}>{job.location || 'Philippines'}</Text>
                      {job.salary_min && (
                        <>
                          <Icon name="currency-usd" size={12} color="#999" style={styles.jobDetailIcon} />
                          <Text style={styles.jobItemDetail}>
                            ₱{job.salary_min.toLocaleString()} - ₱{job.salary_max?.toLocaleString()}
                          </Text>
                        </>
                      )}
                      {job.posted_at && (
                        <>
                          <Icon name="clock-outline" size={12} color="#999" style={styles.jobDetailIcon} />
                          <Text style={styles.jobItemDetail}>{formatDate(job.posted_at)}</Text>
                        </>
                      )}
                    </View>
                    {job.job_url && (
                      <TouchableOpacity
                        style={styles.viewJobButton}
                        onPress={() => Linking.openURL(job.job_url)}
                      >
                        <Text style={styles.viewJobText}>View Details</Text>
                        <Icon name="arrow-right" size={14} color="#4A6A3B" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyJobs}>
                  <Icon name="briefcase" size={48} color="#ccc" />
                  <Text style={styles.emptyJobsText}>No current openings found</Text>
                  <Text style={styles.emptyJobsSubtext}>Check back later for opportunities</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
              <Text style={styles.closeFooterButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => {
              onClose();
              // Navigate to results or careers page
            }}>
              <Text style={styles.viewAllButtonText}>View All Results</Text>
              <Icon name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#4A6A3B',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  demandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  demandBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  matchBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  overviewCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  skillsCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  skillText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  jobsCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  loadingJobs: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#999',
    marginTop: 12,
  },
  jobItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  jobItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  jobItemCompany: {
    fontSize: 13,
    color: '#4A6A3B',
    marginBottom: 8,
  },
  jobItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  jobDetailIcon: {
    marginLeft: 12,
  },
  jobItemDetail: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  viewJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewJobText: {
    fontSize: 12,
    color: '#4A6A3B',
    marginRight: 4,
  },
  emptyJobs: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyJobsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyJobsSubtext: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  closeFooterButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  closeFooterButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  viewAllButton: {
    flex: 1,
    backgroundColor: '#4A6A3B',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
});