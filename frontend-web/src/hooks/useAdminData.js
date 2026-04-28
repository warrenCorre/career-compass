// frontend-web/src/hooks/useAdminData.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useAdminData = (endpoint, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  
  const { 
    page = 1, 
    perPage = 10, 
    search = '', 
    filter = '', 
    sortBy = 'created_at', 
    sortOrder = 'desc',
    autoFetch = true 
  } = options;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(endpoint, {
        params: {
          page,
          per_page: perPage,
          search: search || undefined,
          filter: filter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder
        }
      });
      
      // Handle different response structures
      const responseData = response.data;
      if (Array.isArray(responseData)) {
        setData(responseData);
        setTotal(responseData.length);
        setPages(Math.ceil(responseData.length / perPage));
      } else if (responseData.items) {
        setData(responseData.items);
        setTotal(responseData.total || responseData.items.length);
        setPages(responseData.pages || Math.ceil(responseData.total / perPage));
      } else if (responseData.data) {
        setData(responseData.data);
        setTotal(responseData.total || responseData.data.length);
        setPages(responseData.pages || 1);
      } else {
        setData(responseData);
        setTotal(Object.keys(responseData).length);
      }
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(err.response?.data?.msg || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, perPage, search, filter, sortBy, sortOrder]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, total, pages, refetch };
};

export default useAdminData;