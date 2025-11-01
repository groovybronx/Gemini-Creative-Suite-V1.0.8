
import React, { useState, useEffect } from 'react';
import type { AspectRatio, ImagenModel, GenerationEvent, ImageGenerationResultPart, ImagePart } from '../../types';
import ModelInfoWidget from '../ModelInfoWidget';
import { imageService } from '../../services/imageService';
import ImageGenerationResult from './ImageGenerationResult';
import SpinnerIcon from '../icons/SpinnerIcon';

const aspectRatios: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const imagenModels: ImagenModel[] = ['imagen-3.0-generate-002', 'imagen-4.0-generate-001', 'imagen-4.0-ultra-generate-001', 'imagen-4.0-fast-generate-001'];

const imagenModelDisplayNames: Record<ImagenModel, string> = {
    'imagen-3.0-generate-002': 'Imagen 3.0',
    'imagen-4.0-generate-001': 'Imagen 4.0',
    'imagen-4.0-ultra-generate-001': 'Imagen 4.0 Ultra',
    'imagen-4.0-fast-generate-001': 'Imagen 4.0 Fast',
};

interface ImageGenerationPanelProps {
  onCancel: () => void;
  initialState?: {
      prompt: string;
      params: GenerationEvent['parameters'];
  };
  onViewImage: (images: string[], startIndex: number) => void;
  onEditImage: (imagePart: ImagePart | {url:string}) => void;
  onRecallGeneration: (prompt: string, params: GenerationEvent['parameters']) => void;
}

const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({ onCancel, initialState, onViewImage, onEditImage, onRecallGeneration }) => {
  const [genPrompt, setGenPrompt] = useState(initialState?.prompt || '');
  const [genAspectRatio, setGenAspectRatio] = useState<AspectRatio>(initialState?.params.aspectRatio || '3:4');
  const [genModel, setGenModel] = useState<ImagenModel>(initialState?.params.model || 'imagen-3.0-generate-002');
  const [genNumImages, setGenNumImages] = useState(initialState?.params.numberOfImages || 4);

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<ImageGenerationResultPart[]>([]);

  useEffect(() => {
    if (initialState) {
        setGenPrompt(initialState.prompt);
        setGenAspectRatio(initialState.params.aspectRatio);
        setGenModel(initialState.params.model);
        setGenNumImages(initialState.params.numberOfImages);
    }
  }, [initialState]);


  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;

    const params: GenerationEvent['parameters'] = {
        model: genModel,
        aspectRatio: genAspectRatio,
        numberOfImages: genNumImages
    };
    
    setIsGenerating(true);
    try {
        const result = await imageService.generateImage(genPrompt, params);
        const newResultPart: ImageGenerationResultPart = {
            type: 'imageGenerationResult',
            images: result.images.map(url => ({ url })),
            prompt: genPrompt,
            parameters: params
        };
        setResults(prev => [newResultPart, ...prev]);
    } catch(error) {
        console.error("Image generation failed in panel", error);
        // You could add an error message to the results array
        // For now, it just logs to console.
    } finally {
        setIsGenerating(false);
    }
  }

  return (
    <div className="bg-component-bg rounded-lg border border-border-color h-full flex flex-col">
      <div className="p-4 border-b border-border-color flex-shrink-0">
        <h3 className="font-semibold text-accent-yellow">Image Generation</h3>
      </div>
      
      <div className="flex-grow p-4 space-y-3 overflow-y-auto">
        <textarea value={genPrompt} onChange={e => setGenPrompt(e.target.value)} placeholder="A futuristic city skyline..." className="w-full h-24 bg-base-bg border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-accent-yellow" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 col-span-full">
            <select value={genModel} onChange={e => setGenModel(e.target.value as ImagenModel)} className="w-full bg-base-bg border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-accent-yellow">
              {imagenModels.map(m => <option key={m} value={m}>{imagenModelDisplayNames[m]}</option>)}
            </select>
            <ModelInfoWidget modelName={genModel} />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Aspect Ratio</label>
            <select value={genAspectRatio} onChange={e => setGenAspectRatio(e.target.value as AspectRatio)} className="w-full bg-base-bg border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-accent-yellow">
                {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Number (1-4)</label>
            <input type="number" min="1" max="4" value={genNumImages} onChange={e => setGenNumImages(parseInt(e.target.value, 10))} className="w-full bg-base-bg border border-border-color rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-accent-yellow" />
          </div>
        </div>
        {/* Results Area */}
        {results.length > 0 && (
          <div className="border-t border-border-color mt-4 pt-4 space-y-4">
            <h4 className="font-semibold text-text-secondary text-sm">Results:</h4>
            {results.map((result, index) => (
              <ImageGenerationResult 
                key={index}
                part={result}
                onViewImage={onViewImage}
                onEditImage={onEditImage}
                onRecallGeneration={onRecallGeneration}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border-color flex gap-2 flex-shrink-0">
        <button onClick={handleGenerate} disabled={!genPrompt.trim() || isGenerating} className="flex-1 bg-accent-khaki text-white rounded-lg p-2 disabled:opacity-50 hover:bg-opacity-90 transition-colors flex items-center justify-center">
            {isGenerating ? <SpinnerIcon className="w-5 h-5" /> : 'Generate'}
        </button>
        <button onClick={onCancel} className="bg-border-color text-text-primary rounded-lg p-2 hover:bg-opacity-80 transition-colors">Close Panel</button>
      </div>
    </div>
  );
};

export default ImageGenerationPanel;
