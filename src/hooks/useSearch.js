import { useState, useMemo } from 'react';

export function useSearch(items, searchFields = ['name']) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = items;
    
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item);
          return String(value || '').toLowerCase().includes(q);
        })
      );
    }

    if (filter !== 'all') {
      result = result.filter(item => item.type === filter);
    }

    return result;
  }, [items, query, filter, searchFields]);

  return { query, setQuery, filter, setFilter, filtered };
}
