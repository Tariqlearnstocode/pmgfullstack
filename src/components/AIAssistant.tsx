import { useState } from 'react';
import { useAI } from '../contexts/AIContext';
import { ChevronRight, Bot, Loader2 } from 'lucide-react';

/**
 * AI Assistant component that allows natural language querying of property management data
 */
export default function AIAssistant() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ready, propertyQuery, tenantQuery, ownerQuery, transactionQuery } = useAI();

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    if (!ready) {
      setError('AI service is not ready yet. Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let queryResults: any[] = [];
      
      // Determine which query function to use based on the query content
      if (query.toLowerCase().includes('property') || query.toLowerCase().includes('properties')) {
        queryResults = await propertyQuery(query);
      } else if (query.toLowerCase().includes('tenant') || query.toLowerCase().includes('tenants')) {
        queryResults = await tenantQuery(query);
      } else if (query.toLowerCase().includes('owner') || query.toLowerCase().includes('owners')) {
        queryResults = await ownerQuery(query);
      } else if (
        query.toLowerCase().includes('transaction') || 
        query.toLowerCase().includes('payment') || 
        query.toLowerCase().includes('income') || 
        query.toLowerCase().includes('expense')
      ) {
        queryResults = await transactionQuery(query);
      } else {
        // Default to property query if the type is not clear
        queryResults = await propertyQuery(query);
      }
      
      setResults(queryResults);
    } catch (err) {
      console.error('Error executing AI query:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute query');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center mb-4">
        <Bot className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-lg font-semibold">AI Property Assistant</h2>
      </div>
      
      <form onSubmit={handleQuerySubmit} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about properties, tenants, owners, or transactions..."
            disabled={!ready || isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!ready || isLoading || !query.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      
      {!ready && !error && (
        <div className="text-gray-500 italic mb-4">
          AI service is initializing. Please wait a moment...
        </div>
      )}
      
      {results && results.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-medium">Results:</h3>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th 
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((item, index) => (
                  <tr key={index}>
                    {Object.values(item).map((value: any, valueIndex) => (
                      <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof value === 'object' && value !== null
                          ? JSON.stringify(value)
                          : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : results && results.length === 0 ? (
        <div className="text-gray-500 italic">
          No results found for your query.
        </div>
      ) : null}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Example queries:</p>
        <ul className="list-disc list-inside">
          <li>"Show all vacant properties"</li>
          <li>"Find tenants with overdue rent"</li>
          <li>"List owners with the most properties"</li>
          <li>"Show transactions over $1000 this month"</li>
        </ul>
      </div>
    </div>
  );
}
