import { IRagService } from '../domain/interfaces/IRagService';
import { IKnowledgeRepository } from '../domain/interfaces/IKnowledgeRepository';
import { ILlmService } from '../domain/interfaces/ILlmService';
import { SupabaseKnowledgeRepository } from '../infrastructure/SupabaseKnowledgeRepository';
import { VertexAiSearchService } from '../infrastructure/VertexAiSearchService';
import { GeminiLlmService } from '../infrastructure/GeminiLlmService';

// This is a simple service registry/singleton container
class Container {
    private _ragService: IRagService | null = null;
    private _knowledgeRepository: IKnowledgeRepository | null = null;
    private _llmService: ILlmService | null = null;

    get ragService(): IRagService {
        if (!this._ragService) {
            this._ragService = new VertexAiSearchService();
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
}

export const container = new Container();
