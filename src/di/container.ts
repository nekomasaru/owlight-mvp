import { IRagService } from '../domain/interfaces/IRagService';
import { IKnowledgeRepository } from '../domain/interfaces/IKnowledgeRepository';
import { ILlmService } from '../domain/interfaces/ILlmService';
import { SupabaseKnowledgeRepository } from '../infrastructure/SupabaseKnowledgeRepository';
import { UnifiedSearchService } from '../application/UnifiedSearchService';
import { VertexAISearchService } from '../infrastructure/VertexAiSearchService';
import { VertexDocumentService } from '../infrastructure/VertexDocumentService';
import { ISearchService } from '../domain/interfaces/ISearchService';
import { GeminiLlmService } from '../infrastructure/GeminiLlmService';

// This is a simple service registry/singleton container
class Container {
    private _ragService: IRagService | null = null;
    private _searchService: ISearchService | null = null; // Internal dependency
    private _knowledgeRepository: IKnowledgeRepository | null = null;
    private _llmService: ILlmService | null = null;
    private _vertexDocumentService: VertexDocumentService | null = null;

    get searchService(): ISearchService {
        if (!this._searchService) {
            this._searchService = new VertexAISearchService();
        }
        return this._searchService;
    }

    get ragService(): IRagService {
        if (!this._ragService) {
            this._ragService = new UnifiedSearchService(
                this.searchService,
                this.llmService
            );
        }
        return this._ragService;
    }

    get knowledgeRepository(): IKnowledgeRepository {
        if (!this._knowledgeRepository) {
            this._knowledgeRepository = new SupabaseKnowledgeRepository();
        }
        return this._knowledgeRepository;
    }

    get llmService(): ILlmService {
        if (!this._llmService) {
            this._llmService = new GeminiLlmService();
        }
        return this._llmService;
    }

    get vertexDocumentService(): VertexDocumentService {
        if (!this._vertexDocumentService) {
            this._vertexDocumentService = new VertexDocumentService();
        }
        return this._vertexDocumentService;
    }
}

export const container = new Container();
