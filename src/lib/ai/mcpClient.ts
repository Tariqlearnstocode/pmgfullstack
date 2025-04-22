import { supabase } from '../supabase';

// Define the interface for our MCP client
interface IMCPClient {
  initialize(): Promise<void>;
  execute(params: { query?: string; data?: any[]; instructions?: string; resultsLimit?: number }): Promise<{ results: any }>;
}

/**
 * Creates a client for interacting with Supabase database via natural language
 * This is a real implementation that uses the Supabase client directly
 */
export async function createSupabaseMCPClient(): Promise<IMCPClient> {
  // Create a real implementation that uses the Supabase client
  const client: IMCPClient = {
    initialize: async () => {
      // Nothing special to initialize for our implementation
      return Promise.resolve();
    },
    execute: async (params) => {
      const { query, data, instructions, resultsLimit = 50 } = params;
      
      // Process the query to determine which table and operation to use
      let results: any[] = [];
      
      if (query) {
        // Extract key information from the natural language query
        results = await processNaturalLanguageQuery(query, resultsLimit);
      } else if (data && instructions) {
        // Process data according to instructions
        results = processDataWithInstructions(data, instructions);
      }
      
      return { results };
    }
  };
  
  return client;
}

/**
 * Executes a natural language query against the Supabase database
 * 
 * @param client The MCP client instance
 * @param query Natural language query describing what data is needed
 * @returns The query results as an array of objects
 */
export async function queryDatabase(client: IMCPClient, query: string): Promise<any[]> {
  try {
    // Execute the natural language query
    const response = await client.execute({
      query,
      resultsLimit: 50,
    });
    
    // Parse and return the results
    return response.results || [];
  } catch (error) {
    console.error('Error executing database query via MCP:', error);
    throw new Error('Failed to execute database query');
  }
}

/**
 * Analyzes property management data using natural language instructions
 * 
 * @param client The MCP client instance
 * @param data Data to analyze
 * @param instructions Natural language instructions for analysis
 * @returns Analysis results
 */
export async function analyzeData(
  client: IMCPClient, 
  data: any[], 
  instructions: string
): Promise<any> {
  try {
    // Send the data and instructions to the MCP server
    const response = await client.execute({
      data,
      instructions,
    });
    
    return response.results;
  } catch (error) {
    console.error('Error analyzing data via MCP:', error);
    throw new Error('Failed to analyze data');
  }
}

/**
 * Process a natural language query by determining which table to query
 * and how to filter the results based on the query text
 */
async function processNaturalLanguageQuery(query: string, limit: number): Promise<any[]> {
  query = query.toLowerCase();
  
  // Determine which table to query based on keywords in the query
  if (query.includes('property') || query.includes('properties')) {
    return await queryProperties(query, limit);
  } else if (query.includes('tenant') || query.includes('tenants')) {
    return await queryTenants(query, limit);
  } else if (query.includes('owner') || query.includes('owners')) {
    return await queryOwners(query, limit);
  } else if (
    query.includes('transaction') || 
    query.includes('payment') || 
    query.includes('income') || 
    query.includes('expense')
  ) {
    return await queryTransactions(query, limit);
  }
  
  // Default to properties if we can't determine the intent
  return await queryProperties(query, limit);
}

/**
 * Query property-related data
 */
async function queryProperties(query: string, limit: number): Promise<any[]> {
  let queryBuilder = supabase.from('property_details').select('*');
  
  // Apply filters based on natural language query
  if (query.includes('vacant')) {
    queryBuilder = queryBuilder.is('tenant_id', null);
  }
  
  if (query.includes('occupied')) {
    queryBuilder = queryBuilder.not('tenant_id', 'is', null);
  }
  
  if (query.includes('city')) {
    // Extract city name - this is simplistic, would need NLP for robust extraction
    const cityMatch = query.match(/city\s+of\s+([a-z\s]+)/i) || 
                      query.match(/in\s+([a-z\s]+)/i);
    if (cityMatch && cityMatch[1]) {
      const city = cityMatch[1].trim();
      queryBuilder = queryBuilder.ilike('city', `%${city}%`);
    }
  }
  
  const { data, error } = await queryBuilder.limit(limit);
  
  if (error) {
    console.error('Error querying properties:', error);
    throw new Error('Failed to query properties');
  }
  
  return data || [];
}

/**
 * Query tenant-related data
 */
async function queryTenants(query: string, limit: number): Promise<any[]> {
  let queryBuilder = supabase.from('tenant_details').select('*');
  
  // Apply filters based on natural language query
  if (query.includes('overdue') || query.includes('late') || query.includes('unpaid')) {
    queryBuilder = queryBuilder.gt('current_balance', 0);
  }
  
  if (query.includes('lease') && query.includes('expir')) {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);
    
    queryBuilder = queryBuilder
      .gte('lease_end_date', now.toISOString().split('T')[0])
      .lte('lease_end_date', thirtyDaysLater.toISOString().split('T')[0]);
  }
  
  const { data, error } = await queryBuilder.limit(limit);
  
  if (error) {
    console.error('Error querying tenants:', error);
    throw new Error('Failed to query tenants');
  }
  
  return data || [];
}

/**
 * Query owner-related data
 */
async function queryOwners(query: string, limit: number): Promise<any[]> {
  // This is a simplified implementation - you'll need to create or use an appropriate view or join
  let queryBuilder = supabase.from('owners').select('*');
  
  // Apply filters based on query content
  if (query.includes('most properties') || query.includes('multiple properties')) {
    // In a real app, you'd have a way to count properties per owner
    // For now, we're just returning all owners
    console.log('Query for owners with multiple properties:', query);
  }
  
  if (query.includes('name')) {
    // Extract potential name from the query - this is simplistic
    const nameMatch = query.match(/name\s+([a-z\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].trim();
      queryBuilder = queryBuilder.ilike('name', `%${name}%`);
    }
  }
  
  const { data, error } = await queryBuilder.limit(limit);
  
  if (error) {
    console.error('Error querying owners:', error);
    throw new Error('Failed to query owners');
  }
  
  return data || [];
}

/**
 * Query transaction-related data
 */
async function queryTransactions(query: string, limit: number): Promise<any[]> {
  let queryBuilder = supabase.from('transaction_details').select('*');
  
  // Apply filters based on natural language query
  if (query.includes('recent')) {
    queryBuilder = queryBuilder.order('date', { ascending: false });
  }
  
  if (query.includes('this month')) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    queryBuilder = queryBuilder
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0]);
  }
  
  if (query.includes('last month')) {
    const now = new Date();
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    queryBuilder = queryBuilder
      .gte('date', firstDayOfLastMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfLastMonth.toISOString().split('T')[0]);
  }
  
  // Handle amount queries like "over $1000"
  const amountMatch = query.match(/(?:over|more than|above)\s+\$?(\d+(?:\.\d+)?)/i);
  if (amountMatch && amountMatch[1]) {
    const amount = parseFloat(amountMatch[1]);
    queryBuilder = queryBuilder.gt('amount', amount);
  }
  
  const { data, error } = await queryBuilder.limit(limit);
  
  if (error) {
    console.error('Error querying transactions:', error);
    throw new Error('Failed to query transactions');
  }
  
  return data || [];
}

/**
 * Process data according to natural language instructions
 * This is a placeholder for actual implementation
 */
function processDataWithInstructions(data: any[], instructions: string): any[] {
  // In a real implementation, this would analyze the data based on instructions
  // For now, we'll return the data as-is with a summary
  return [
    {
      summary: `Analysis based on ${instructions}`,
      data_count: data.length,
      sample: data.slice(0, 5)
    }
  ];
}
