import { IRagService } from '../domain/interfaces/IRagService';
import { ISearchService } from '../domain/interfaces/ISearchService';
import { ILlmService } from '../domain/interfaces/ILlmService';
import { SearchResponse, Citation } from '../domain/types';

export class UnifiedSearchService implements IRagService {
    constructor(
        private searchService: ISearchService,
        private llmService: ILlmService
    ) { }

    async searchDocuments(query: string): Promise<Citation[]> {
        const response = await this.searchService.search(query);
        return response.citations;
    }

    async search(query: string, conversationId?: string): Promise<SearchResponse> {
        // Passthrough the search result from the underlying service (e.g. Vertex AI)
        // We do NOT want to regenerate the answer here as it might cause "I cannot answer" refusals
        // based on limited context. Let the final Chat API layer handle the generation.
        return this.searchService.search(query);
    }
}
