declare module '@modelcontextprotocol/sdk' {
  export class MCPClient {
    constructor(options: {
      serviceWorker: ServiceWorkerRegistration;
      serverName: string;
    });
    
    initialize(): Promise<void>;
    
    execute(params: {
      query?: string;
      data?: any[];
      instructions?: string;
      resultsLimit?: number;
    }): Promise<{
      results: any;
    }>;
  }
}
