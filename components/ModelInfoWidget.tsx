
import React, { useState, useEffect } from 'react';
import { modelService } from '../services/modelService';
import type { ModelInfo } from '../types';
import InfoIcon from './icons/InfoIcon';
import ModelInfoDisplay from './ModelInfoDisplay';

interface ModelInfoWidgetProps {
  modelName: string;
}

const ModelInfoWidget: React.FC<ModelInfoWidgetProps> = ({ modelName }) => {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);

  const fetchModelInfo = async () => {
    // Don't refetch if we already have info for the current model
    if (!modelName || info) return; 
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await modelService.getModelInfo(modelName);
      setInfo(data);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred while fetching details.');
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset info when the selected model changes
  useEffect(() => {
    setInfo(null);
    setError(null);
    // If the popover is visible when the model changes, start fetching the new model's info immediately
    if (isPopoverVisible) {
      fetchModelInfo();
    }
  }, [modelName]);

  const handleMouseEnter = () => {
    setIsPopoverVisible(true);
    fetchModelInfo(); // Fetch on hover
  };

  const handleMouseLeave = () => {
    setIsPopoverVisible(false);
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <InfoIcon className="w-5 h-5 text-text-secondary cursor-pointer hover:text-text-primary" />
      {isPopoverVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20">
          <ModelInfoDisplay info={info} isLoading={isLoading} error={error} />
        </div>
      )}
    </div>
  );
};

export default ModelInfoWidget;
