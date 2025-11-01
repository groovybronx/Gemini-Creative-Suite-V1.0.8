import React from 'react';
import type { ModelInfo } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

interface ModelInfoDisplayProps {
  info: ModelInfo | null;
  isLoading: boolean;
  error: string | null;
}

const ModelInfoDisplay: React.FC<ModelInfoDisplayProps> = ({ info, isLoading, error }) => {
  if (isLoading) {
    return <div className="w-72 p-4 bg-base-bg border border-border-color rounded-md shadow-lg flex justify-center"><SpinnerIcon className="w-6 h-6" /></div>;
  }
  if (error) {
    return <div className="w-72 p-4 bg-base-bg border border-border-color rounded-md shadow-lg text-red-400">{error}</div>;
  }
  if (!info) {
    return null;
  }

  return (
    <div className="w-72 p-4 bg-base-bg border border-border-color text-text-primary rounded-md shadow-lg text-sm space-y-2">
      <h4 className="font-bold text-md text-accent-yellow">{info.displayName}</h4>
      <p className="text-xs text-text-secondary">{info.name} (v{info.version})</p>
      {info.baseModelId && <p className="text-xs text-text-secondary">Base Model: {info.baseModelId}</p>}

      <p className="border-t border-border-color pt-2">{info.description}</p>
      
      <div className="border-t border-border-color pt-2 space-y-1">
        <p><strong>Input Token Limit:</strong> {info.inputTokenLimit ? info.inputTokenLimit.toLocaleString() : 'N/A'}</p>
        <p><strong>Output Token Limit:</strong> {info.outputTokenLimit ? info.outputTokenLimit.toLocaleString() : 'N/A'}</p>
      </div>

      {(info.temperature !== undefined || info.topP !== undefined || info.topK !== undefined) && (
        <div className="border-t border-border-color pt-2 space-y-1">
          <p className="font-semibold text-text-secondary text-xs mb-1">Default Parameters:</p>
          {info.temperature !== undefined && <p><strong>Temperature:</strong> {info.temperature}</p>}
          {info.topP !== undefined && <p><strong>Top P:</strong> {info.topP}</p>}
          {info.topK !== undefined && <p><strong>Top K:</strong> {info.topK}</p>}
        </div>
      )}

      {info.supportedGenerationMethods && info.supportedGenerationMethods.length > 0 && (
        <div className="border-t border-border-color pt-2 space-y-2">
          <div>
            <p className="font-semibold text-xs mb-1">Supported Methods:</p>
            <div className="flex flex-wrap gap-1">
              {info.supportedGenerationMethods.map(value => (
                <span key={value} className="bg-component-bg text-text-secondary text-xs px-2 py-0.5 rounded-full border border-border-color">
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {info.supportedParameters && Object.keys(info.supportedParameters).length > 0 && (
        <div className="border-t border-border-color pt-2 space-y-2">
          {Object.entries(info.supportedParameters).map(([key, values]) => (
            <div key={key}>
              <p className="font-semibold text-xs mb-1">{key}:</p>
              <div className="flex flex-wrap gap-1">
                {values.map(value => (
                  <span key={value} className="bg-component-bg text-text-secondary text-xs px-2 py-0.5 rounded-full border border-border-color">
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelInfoDisplay;