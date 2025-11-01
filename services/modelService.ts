import type { ModelInfo } from '../types';

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/';
const API_KEY = process.env.API_KEY;

// Simple in-memory cache to avoid repeated API calls for the same model info
const modelInfoCache = new Map<string, ModelInfo>();

export const modelService = {
  /**
   * Fetches detailed information for a given model from the Gemini API.
   * Caches the results to avoid redundant network calls.
   * @param {string} modelName The name of the model (e.g., 'gemini-2.5-flash').
   * @returns {Promise<ModelInfo>} A promise that resolves to the model's information.
   */
  async getModelInfo(modelName: string): Promise<ModelInfo> {
    if (modelInfoCache.has(modelName)) {
      return modelInfoCache.get(modelName)!;
    }

    if (!API_KEY) {
      throw new Error("API_KEY is not available for model info lookup.");
    }
    
    // Ensure the model name is in the correct format for the API (e.g., 'models/gemini-2.5-flash')
    const fullModelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`;

    try {
      const response = await fetch(`${API_BASE_URL}${fullModelPath}?key=${API_KEY}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get more details from the body
        const errorMessage = errorData?.error?.message || response.statusText;
        throw new Error(`Failed to fetch model info for ${modelName}: ${errorMessage}`);
      }
      const data = await response.json();
      
      const modelInfo: ModelInfo = {
        name: data.name,
        version: data.version,
        displayName: data.displayName,
        description: data.description,
        inputTokenLimit: data.inputTokenLimit,
        outputTokenLimit: data.outputTokenLimit,
        baseModelId: data.baseModelId,
        supportedGenerationMethods: data.supportedGenerationMethods,
        temperature: data.temperature,
        topP: data.topP,
        topK: data.topK,
        // FIX: Initialize required 'supportedParameters' property to satisfy the ModelInfo type.
        supportedParameters: {},
      };

      // Augment with hardcoded data for known models, as the API doesn't provide everything.
      if (modelName.startsWith('imagen')) {
        modelInfo.supportedParameters = {
          'Aspect Ratios': ["1:1", "16:9", "9:16", "4:3", "3:4"],
          'Output Mime Types': ['image/png', 'image/jpeg']
        };
      }
      
      modelInfoCache.set(modelName, modelInfo);
      return modelInfo;
    } catch (error) {
      console.error(`Error fetching model info for ${modelName}:`, error);
      if (error instanceof Error) {
        throw error; // Re-throw the error to be caught by the component
      }
      throw new Error('An unknown error occurred while fetching model information.');
    }
  },
};