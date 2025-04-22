import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createSupabaseMCPClient, queryDatabase, analyzeData } from '../lib/ai/mcpClient';

// Using the MCPClient interface type from our mock implementation
interface MCPClient {
  initialize(): Promise<void>;
  execute(params: {
    query?: string;
    data?: any[];
    instructions?: string;
    resultsLimit?: number;
  }): Promise<{ results: any }>;
}

interface AIContextType {
  ready: boolean;
  loading: boolean;
  error: Error | null;
  propertyInsights: (propertyId: string) => Promise<any>;
  financialAnalysis: (startDate: string, endDate: string) => Promise<any>;
  tenantQuery: (query: string) => Promise<any[]>;
  ownerQuery: (query: string) => Promise<any[]>;
  propertyQuery: (query: string) => Promise<any[]>;
  transactionQuery: (query: string) => Promise<any[]>;
}

const AIContext = createContext<AIContextType | null>(null);

export function AIProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<MCPClient | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the MCP client when the component mounts
  useEffect(() => {
    async function initMCP() {
      try {
        setLoading(true);
        // Initialize our mock MCP client
        const mcpClient = await createSupabaseMCPClient();
        setClient(mcpClient);
        setReady(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing MCP client:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize AI features'));
      } finally {
        setLoading(false);
      }
    }

    initMCP();

    // Clean up when the component unmounts
    return () => {
      if (client) {
        // Close the MCP client connection if needed
      }
    };
  }, []);

  /**
   * Generate AI insights for a specific property
   */
  async function propertyInsights(propertyId: string) {
    if (!client || !ready) {
      throw new Error('AI service not ready');
    }

    const query = `
      Get all information about property with id ${propertyId}, 
      including tenant details, transaction history, and maintenance records.
      Then analyze this property's performance.
    `;

    const propertyData = await queryDatabase(client, query);
    
    const insights = await analyzeData(
      client,
      propertyData,
      `Analyze this property's financial performance, occupancy rate, and issues.
       Provide insights on revenue trends, expense patterns, and recommendations to improve profitability.`
    );

    return insights;
  }

  /**
   * Generate financial analysis for a specified date range
   */
  async function financialAnalysis(startDate: string, endDate: string) {
    if (!client || !ready) {
      throw new Error('AI service not ready');
    }

    const query = `
      Get all transactions between ${startDate} and ${endDate}.
      Include property details, tenant information, and transaction type.
    `;

    const transactionData = await queryDatabase(client, query);
    
    const analysis = await analyzeData(
      client,
      transactionData,
      `Analyze these transactions to show:
       1. Total revenue and expenses
       2. Revenue by property
       3. Expense categories
       4. Cash flow trends
       5. Key financial insights and anomalies`
    );

    return analysis;
  }

  /**
   * Query tenant data using natural language
   */
  async function tenantQuery(query: string) {
    if (!client || !ready) {
      throw new Error('AI service not ready');
    }

    return queryDatabase(client, `Query tenant information: ${query}`);
  }

  /**
   * Query owner data using natural language
   */
  async function ownerQuery(query: string) {
    if (!client || !ready) {
      throw new Error('AI service not ready');
    }

    return queryDatabase(client, `Query owner information: ${query}`);
  }

  /**
   * Query property data using natural language
   */
  async function propertyQuery(query: string) {
    if (!client || !ready) {
      throw new Error('AI service not ready');
    }

    return queryDatabase(client, `Query property information: ${query}`);
  }

  /**
   * Query transaction data using natural language
   */
  async function transactionQuery(query: string) {
    if (!client || !ready) {
      throw new Error('AI service not ready');
    }

    return queryDatabase(client, `Query transaction information: ${query}`);
  }

  return (
    <AIContext.Provider
      value={{
        ready,
        loading,
        error,
        propertyInsights,
        financialAnalysis,
        tenantQuery,
        ownerQuery,
        propertyQuery,
        transactionQuery,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

// Custom hook to use the AI context
export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
