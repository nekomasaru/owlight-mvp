import { SearchResponse, Citation } from '../types';

export interface IRagService {
    /**
     * Searches knowledge base and returns a distilled answer with citations.
     */
    search(query: string, conversationId?: string): Promise<SearchResponse>;

    /**
     * Retrieves raw document snippets for a query.
     */
    searchDocuments(query: string): Promise<Citation[]>;
}
