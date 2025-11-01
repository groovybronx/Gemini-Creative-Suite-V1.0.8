
import React, { useState, useRef } from 'react';
import type { ImageEditingSession, EditEvent, UsageMetadata } from '../../types';
import SpinnerIcon from '../icons/SpinnerIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import RecallIcon from '../icons/RecallIcon';
import CloseIcon from '../icons/CloseIcon';
import TokenCount from '../TokenCount';
import { imageService } from '../../services/imageService';

interface ImageEditingPanelProps {
    session: ImageEditingSession;
    onApplyEdit: (prompt: string) => Promise<void>;
    onClose: () => void;
    onViewImage: (images: string[], startIndex: number) => void;
}

const ImageEditingPanel: React.FC<ImageEditingPanelProps> = ({ session, onApplyEdit, onClose, onViewImage }) => {
  const [activeHistoryIndex, setActiveHistoryIndex] = useState<number>(session.history.length - 1); // -1 for base image
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState<{ analysis: boolean; edit: boolean }>({ analysis: false, edit: false });
  const [error, setError] = useState<string | null>(null);
  const [thumbnailSize, setThumbnailSize] = useState(4); // in rem (4rem = 64px)

  // This is a simplified analysis handler as it's now part of a session within a chat.
  // In a real implementation, you might want to save the analysis back to the session object.
  const handleAnalyze = async () => {
    setIsLoading({ ...isLoading, analysis: true });
    setError(null);
    try {
        const result = await imageService.analyzeImage(session.baseImage.base64, session.baseImage.mimeType, 'Describe this image for editing purposes.');
        // For simplicity, we can just show this to the user, perhaps by adding it as a model message to the main chat.
        // Or, just alert it for now.
        alert(`Analysis Result:\n\n${result.text}`);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Sorry, I couldn't analyze the image.";
        setError(errorMessage);
    }
    setIsLoading({ ...isLoading, analysis: false });
  };
  
  const handleEdit = async () => {
    if (!prompt.trim()) return;
    setIsLoading({ ...isLoading, edit: true });
    setError(null);
    try {
        await onApplyEdit(prompt);
        setPrompt(''); // Clear prompt on success
        setActiveHistoryIndex(session.history.length); // Move to the newly created history item
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during image editing.";
        setError(errorMessage);
    }
    setIsLoading({ ...isLoading, edit: false });
  };
  
  const displayImage = activeHistoryIndex === -1 ? session.baseImage?.url : session.history[activeHistoryIndex]?.editedImage.url;

  return (
    <div className="bg-component-bg rounded-lg border border-border-color h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border-color flex justify-between items-center">
        <h2 className="text-xl font-bold text-accent-yellow">Image Editor</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-border-color">
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Main Image Display */}
        <div className="flex-grow flex items-center justify-center bg-base-bg rounded-lg p-2 border border-border-color min-h-0">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Current"
              className="max-h-full max-w-full object-contain rounded-md cursor-pointer"
              onClick={() => displayImage && onViewImage([displayImage], 0)}
            />
          ) : (
            <p className="text-text-secondary">No image selected.</p>
          )}
        </div>
        
        {/* Editing Controls */}
        <div className="flex-shrink-0 flex flex-col gap-2">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Add a retro filter..."
                className="w-full h-20 bg-base-bg border border-border-color rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                disabled={isLoading.edit}
            />
            <button
                onClick={handleEdit}
                disabled={isLoading.edit || !prompt.trim()}
                className="bg-accent-khaki text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 hover:bg-opacity-90 transition-colors w-full"
            >
                {isLoading.edit ? <SpinnerIcon className="w-5 h-5 mx-auto" /> : 'Apply Edit'}
            </button>
            {error && <p className="text-red-400 text-sm mt-1 text-center">{error}</p>}
        </div>

        {/* History & Analysis */}
        <div className="flex-shrink-0 space-y-3 border-t border-border-color pt-3 overflow-y-auto">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-text-secondary text-sm">Edit History:</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-text-secondary">Size:</label>
                        <input type="range" min="3" max="8" value={thumbnailSize} onChange={e => setThumbnailSize(Number(e.target.value))} className="w-20 cursor-pointer" />
                    </div>
                </div>
                <div className="space-y-2">
                    {/* Original Image */}
                    <div 
                        onClick={() => setActiveHistoryIndex(-1)}
                        className={`bg-base-bg p-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${activeHistoryIndex === -1 ? 'ring-2 ring-accent-yellow' : 'hover:bg-border-color'}`}>
                        <img src={session.baseImage.url} alt="Original" className="object-contain rounded-md flex-shrink-0 bg-black/20" style={{width: `${thumbnailSize}rem`, height: `${thumbnailSize}rem`}}/>
                        <p className="text-sm italic text-text-secondary flex-grow">Original Image</p>
                    </div>
                    {/* Edit History */}
                    {session.history.map((event, index) => (
                        <div 
                            key={event.timestamp} 
                            onClick={() => setActiveHistoryIndex(index)}
                            className={`bg-base-bg p-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${activeHistoryIndex === index ? 'ring-2 ring-accent-yellow' : 'hover:bg-border-color'}`}
                        >
                            <img src={event.editedImage.url} alt="Edit result" className="object-contain rounded-md flex-shrink-0 bg-black/20" style={{width: `${thumbnailSize}rem`, height: `${thumbnailSize}rem`}}/>
                            <div className="flex-grow min-w-0">
                                <p className="text-sm italic text-text-primary truncate">"{event.prompt}"</p>
                                {event.usageMetadata && <TokenCount metadata={event.usageMetadata} className="mt-1" />}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setPrompt(event.prompt); }}
                                className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-border-color flex-shrink-0"
                                aria-label="Recall this prompt" title="Recall this prompt"
                            >
                                <RecallIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditingPanel;
