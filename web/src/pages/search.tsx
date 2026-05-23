import { useState, useEffect } from 'react';
import { client } from '../api';

function SearchPage() {
  const [query, set_query] = useState('');
  const [results, set_results] = useState<any[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState('');
  const [cached, set_cached] = useState(false);

  useEffect(() => {
    const fetch_results = async () => {
      if (!query.trim()) {
        set_results([]);
        return;
      }
      set_loading(true);
      set_error('');
      try {
        const { data, error: api_error } = await client.GET('/search', {
          params: { query: { q: query } },
        });

        if (api_error) {
          set_error(api_error.error || 'Failed to search');
        } else if (data) {
          set_results(data.results);
          set_cached(data.cached);
        }
      } catch (err: any) {
        set_error(err.message || 'Error occurred');
      } finally {
        set_loading(false);
      }
    };

    const timeout_id = setTimeout(() => {
      fetch_results();
    }, 300);

    return () => clearTimeout(timeout_id);
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">spider search</h1>
      
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search documents..."
          value={query}
          onChange={(e) => set_query(e.target.value)}
          className="w-full px-5 py-4 text-lg rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {error && <div className="text-red-500 mb-4 px-4">{error}</div>}

      {!loading && !error && query && (
        <div className="mb-6 px-4 text-sm text-gray-500">
          Found {results.length} results {cached && <span className="text-green-600 font-medium">(from cache)</span>}
        </div>
      )}

      <ul className="space-y-6">
        {results.map((result) => (
          <li key={result.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-medium mb-1">
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {result.title}
              </a>
            </h2>
            <div className="text-sm text-green-700 mb-3 truncate">
              {result.url}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {result.content_snippet}...
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchPage;
