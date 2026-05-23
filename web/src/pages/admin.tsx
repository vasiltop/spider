import { useState, useEffect } from 'react';
import { client } from '../api';

function AdminPage() {
  const [seed_urls, set_seed_urls] = useState('');
  const [is_seeding, set_is_seeding] = useState(false);
  const [seed_message, set_seed_message] = useState('');
  
   
  const [crawlers, set_crawlers] = useState<any[]>([]);
  const [queue_length, set_queue_length] = useState(0);
  
   
  const [documents, set_documents] = useState<any[]>([]);

  useEffect(() => {
    const fetch_status = async () => {
      try {
        const { data } = await client.GET('/admin/scraper/status');
        if (data) {
          set_crawlers(data.active_crawlers);
          set_queue_length(data.queue_length);
        }
      } catch (e) {
        console.error(e);
      }
    };
  
    const fetch_documents = async () => {
      try {
        const { data } = await client.GET('/admin/documents');
        if (data) {
          set_documents(data.documents);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetch_status();
    fetch_documents();

    // Poll status every 2 seconds
    const interval = setInterval(() => {
      fetch_status();
      fetch_documents();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handle_seed = async () => {
    set_is_seeding(true);
    set_seed_message('');
    
    const urls = seed_urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.startsWith('http'));

    if (urls.length === 0) {
      set_seed_message('Please enter valid HTTP/HTTPS URLs.');
      set_is_seeding(false);
      return;
    }

    try {
      const { data, error } = await client.POST('/admin/scraper/seed', {
        body: { urls }
      });

      if (error) {
        set_seed_message(`Error: ${error.error}`);
      } else if (data) {
        set_seed_message(`Success: Added ${data.added} URLs to the queue.`);
        set_seed_urls('');
      }
     
    } catch (e: any) {
      set_seed_message(`Error: ${e.message}`);
    } finally {
      set_is_seeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Manage and monitor the web crawler.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Seed URLs Section */}
        <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Launch Crawler</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Enter seed URLs (one per line) to add them to the queue.</p>
            </div>
            <div className="mt-5">
              <textarea
                rows={4}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="https://example.com&#10;https://another.com"
                value={seed_urls}
                onChange={(e) => set_seed_urls(e.target.value)}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handle_seed}
                disabled={is_seeding || !seed_urls.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {is_seeding ? 'Seeding...' : 'Launch Crawler'}
              </button>
              {seed_message && (
                <span className={`text-sm ${seed_message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {seed_message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Status Section */}
        <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-5 sm:p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Live Status</h3>
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-gray-600">Polling...</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4 mb-4 border border-gray-100">
              <div className="text-sm font-medium text-gray-500">URLs in Queue</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">{queue_length}</div>
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-3 border-b pb-2">Active Instances ({crawlers.length})</h4>
              {crawlers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No active crawlers.</p>
              ) : (
                <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {crawlers.map((c) => (
                    <li key={c.id} className="text-sm bg-blue-50 text-blue-800 p-2 rounded border border-blue-100 break-all">
                      <span className="font-semibold mr-2">[{c.id}]</span>
                      {c.url}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parsed Documents Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recently Parsed Documents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parsed At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No documents found.</td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs truncate" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-sm truncate" title={doc.url}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {doc.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;