
import { SearchResponse, Citation } from '../types';

export interface ISearchService {
    search(query: string): Promise<SearchResponse>;
}
