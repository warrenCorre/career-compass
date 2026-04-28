// src/components/StatsModal.js - FULLSCREEN DARK OVERLAY FIX + REFRESH BUTTON + VIEW DETAILS

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') || '';
const formatDate = (ds) => {
  if (!ds) return '';
  const d = new Date(ds);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function StatsModal({ visible, onClose, type, data, onRefresh, refreshing = false }) {
  // When modal opens, make status bar translucent so overlay covers it
  useEffect(() => {
    if (visible) {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
        StatusBar.setTranslucent(true);
      }
    } else {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#ffffff');
        StatusBar.setTranslucent(false);
      }
    }
  }, [visible]);

  const getTitle = () => {
    switch (type) {
      case 'courses': return 'Program Matches';
      case 'jobs': return 'Job Opportunities';
      case 'assessments': return 'Assessment History';
      default: return 'Details';
    }
  };
  const getIcon = () => {
    switch (type) {
      case 'courses': return 'school';
      case 'jobs': return 'briefcase';
      case 'assessments': return 'file-document';
      default: return 'information';
    }
  };
  const getIconColor = () => {
    switch (type) {
      case 'courses': return '#4A6A3B';
      case 'jobs': return '#0284C7';
      case 'assessments': return '#F59E0B';
      default: return '#666';
    }
  };

  const getMatchBadge = (score) => {
    if (score >= 80) return { bg: '#D1FAE5', text: '#10b981' };
    if (score >= 60) return { bg: '#E8F0E6', text: '#4A6A3B' };
    if (score >= 40) return { bg: '#FEF3C7', text: '#F59E0B' };
    return { bg: '#F3F4F6', text: '#6B7280' };
  };

  const renderContent = () => {
    if (type === 'jobs' && data?.items) {
      if (data.items.length === 0) return <EmptyState icon="briefcase" text="No job opportunities" />;
      return data.items.map((job, idx) => (
        <View key={idx} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>{job.title}</Text>
            {job.course_match_score && (
              <View style={[styles.badge, { backgroundColor: getMatchBadge(job.course_match_score).bg }]}>
                <Text style={[styles.badgeText, { color: getMatchBadge(job.course_match_score).text }]}>{job.course_match_score}%</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemSubtitle}>{job.company}</Text>
          <View style={styles.metaRow}>
            <Icon name="map-marker" size={12} color="#9CA3AF" />
            <Text style={styles.metaText}>{job.location || 'Philippines'}</Text>
            {job.salary_min && (
              <>
                <Icon name="currency-usd" size={12} color="#9CA3AF" style={{ marginLeft: 12 }} />
                <Text style={styles.metaText}>₱{job.salary_min.toLocaleString()}+</Text>
              </>
            )}
          </View>
          {job.description && <Text style={styles.description} numberOfLines={2}>{stripHtml(job.description)}</Text>}
          {job.job_url && (
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => Linking.openURL(job.job_url)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Icon name="arrow-right" size={14} color="#4A6A3B" />
            </TouchableOpacity>
          )}
        </View>
      ));
    }
    if (type === 'courses' && data?.items) {
      if (data.items.length === 0) return <EmptyState icon="school" text="No program matches" />;
      return data.items.map((item, idx) => (
        <View key={idx} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{item.course_code}</Text>
            <View style={[styles.badge, { backgroundColor: getMatchBadge(item.score).bg }]}>
              <Text style={[styles.badgeText, { color: getMatchBadge(item.score).text }]}>{item.score}%</Text>
            </View>
          </View>
          <Text style={styles.itemSubtitle}>{item.course_name}</Text>
        </View>
      ));
    }
    if (type === 'assessments' && data?.history) {
      if (data.history.length === 0) return <EmptyState icon="file-document" text="No assessments yet" />;
      return data.history.map((a, idx) => (
        <View key={a.id} style={styles.itemCard}>
          <Text style={styles.itemTitle}>{a.category_name}</Text>
          <Text style={styles.metaText}>{formatDate(a.completed_at)}</Text>
          {a.top_match && <Text style={styles.itemSubtitle}>{a.top_match.course_code} - {a.top_match.score}%</Text>}
        </View>
      ));
    }
    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIcon, { backgroundColor: getIconColor() + '20' }]}>
                <Icon name={getIcon()} size={20} color={getIconColor()} />
              </View>
              <Text style={styles.headerTitle}>{getTitle()}</Text>
            </View>
            <View style={styles.headerRight}>
              {type === 'jobs' && onRefresh && (
                <TouchableOpacity onPress={onRefresh} disabled={refreshing} style={styles.refreshButton}>
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#4A6A3B" />
                  ) : (
                    <Icon name="refresh" size={20} color="#4A6A3B" />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderContent()}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const EmptyState = ({ icon, text }) => (
  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
    <Icon name={icon} size={48} color="#D1D5DB" />
    <Text style={{ fontSize: 15, color: '#9CA3AF', marginTop: 12 }}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  refreshButton: { padding: 4 },
  closeButton: { padding: 4 },
  content: { maxHeight: height * 0.6, paddingHorizontal: 20, paddingVertical: 16 },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  itemSubtitle: { fontSize: 13, color: '#4A6A3B', marginBottom: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaText: { fontSize: 11, color: '#9CA3AF', marginLeft: 4 },
  description: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 12 },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  viewDetailsText: { fontSize: 12, color: '#4A6A3B', fontWeight: '500', marginRight: 4 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeModalButton: {
    backgroundColor: '#4A6A3B',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  closeModalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});