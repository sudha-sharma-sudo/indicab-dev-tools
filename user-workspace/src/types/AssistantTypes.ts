export interface AssistantMessage {
    type: 'query' | 'response' | 'error' | 'suggestion';
    content: string;
    timestamp: Date;
    context?: {
        currentFile?: string;
        projectStructure?: string;
    };
}

export interface ConnectionConfig {
    endpoint: string;
    retryInterval: number;
    maxRetries: number;
}

export type ConnectionState = 
    | 'disconnected' 
    | 'connecting' 
    | 'connected' 
    | 'error';