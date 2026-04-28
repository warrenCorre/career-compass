// frontend-web/src/utils/adminHelpers.js
import { format } from 'date-fns';

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM dd, yyyy');
  } catch {
    return 'N/A';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM dd, yyyy h:mm a');
  } catch {
    return 'N/A';
  }
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getStatusBadge = (isActive) => {
  return {
    text: isActive ? 'Active' : 'Inactive',
    className: isActive 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-gray-100 text-gray-700 border-gray-200'
  };
};

export const getRoleBadge = (isAdmin) => {
  return {
    text: isAdmin ? 'Admin' : 'User',
    className: isAdmin 
      ? 'bg-primary-100 text-primary-700 border-primary-200' 
      : 'bg-gray-100 text-gray-700 border-gray-200'
  };
};

export const getDemandBadge = (demand) => {
  const colors = {
    High: 'bg-green-100 text-green-700 border-green-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-red-100 text-red-700 border-red-200',
  };
  return {
    text: demand || 'Medium',
    className: colors[demand] || colors.Medium
  };
};

export const downloadCSV = (data, filename, headers) => {
  const csvRows = [];
  
  if (headers) {
    csvRows.push(headers.join(','));
  }
  
  for (const row of data) {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s/g, '_');
      const value = row[key] !== undefined ? row[key] : '';
      const escaped = String(value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};