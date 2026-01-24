export interface ILlmService {
    /**
     * Generates a completion based on prompt and history.
     */
    generateCompletion(prompt: string, history?: any[]): Promise<string>;

    /**
     * Distills a summary or structured data from raw content.
     */
    distill(content: string, instructions: string): Promise<string>;
}
