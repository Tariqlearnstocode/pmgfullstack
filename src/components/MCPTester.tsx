import { useEffect, useState } from 'react';
import { createSupabaseMCPClient } from '../lib/ai/mcpClient';
import { supabase } from '../lib/supabase';

export default function MCPTester() {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function testMCP() {
      try {
        // First test Supabase connection
        setStatus('Testing Supabase connection...');
        const { error: healthError } = await supabase.from('properties').select('count').limit(1);
        
        if (healthError) {
          throw new Error(`Supabase connection error: ${healthError.message}`);
        }
        
        setConnected(true);
        setStatus('Connected to Supabase');
        
        // Initialize our AI client
        const client = await createSupabaseMCPClient();
        await client.initialize();
        
        // Test property query
        setStatus('Querying properties...');
        const propertyResult = await client.execute({
          query: 'Show me vacant properties',
        });
        
        // Test tenant query
        setStatus('Querying tenants...');
        const tenantResult = await client.execute({
          query: 'Show me tenants with upcoming lease expirations',
        });
        
        // Test transaction query
        setStatus('Querying transactions...');
        const transactionResult = await client.execute({
          query: 'Show me recent transactions',
        });
        
        setResults([
          { operation: 'Properties', data: propertyResult },
          { operation: 'Tenants', data: tenantResult },
          { operation: 'Transactions', data: transactionResult }
        ]);
        
        setStatus('Data loaded successfully');
      } catch (err) {
        console.error('Error testing database connection:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setStatus('Error occurred');
      }
    }

    testMCP();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">AI Data Connection Status</h2>
      
      <div className="mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <p className="font-medium">{status}</p>
        </div>
        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
      </div>

      {results && results.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Data Sample:</h3>
          {results.map((result, index) => (
            <div key={index} className="border p-4 rounded">
              <h3 className="font-medium">{result.operation}</h3>
              <p className="text-sm text-gray-500 mb-2">
                {result.data.results.length} records found
              </p>
              {result.data.results.length > 0 ? (
                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-28">
                  {JSON.stringify(result.data.results[0], null, 2)}
                </pre>
              ) : (
                <p className="text-sm italic">No data available</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
