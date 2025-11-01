
import React, { useState, useEffect, useMemo } from 'react';
import type { Conversation } from '../types';
import StarIcon from './icons/StarIcon';
import TrashIcon from './icons/TrashIcon';

const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;

interface HistorySidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'favorites'>('date');
  const [isOpen, setIsOpen] = useState(true);
  
  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleFavorite(id);
  }
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
        onDeleteConversation(id);
    }
  };

  const filteredAndSortedConversations = useMemo(() => {
    return [...conversations]
      .filter((convo) =>
        convo.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((convo) => (sortBy === 'favorites' ? convo.isFavorite : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [conversations, searchTerm, sortBy]);

  const renderIcon = (type: Conversation['type']) => {
    switch(type) {
        case 'chat': return <ChatIcon />;
        default: return null;
    }
  }

  if (!isOpen) {
    return (
        <button onClick={() => setIsOpen(true)} className="absolute top-1/2 left-0 -translate-y-1/2 bg-component-bg p-2 rounded-r-lg border-y border-r border-border-color z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
    )
  }

  return (
    <div className="w-80 bg-component-bg flex flex-col border-r border-border-color flex-shrink-0 relative">
      <button onClick={() => setIsOpen(false)} className="absolute top-1/2 -right-3 -translate-y-1/2 bg-component-bg p-1 rounded-full border border-border-color z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div className="p-4 border-b border-border-color">
        <button
          onClick={onNewConversation}
          className="w-full bg-accent-khaki text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          New Session
        </button>
      </div>
      <div className="p-4 space-y-4">
        <input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-base-bg border border-border-color rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent-yellow"
        />
        <div>
          <label className="text-sm text-text-secondary mr-2">Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'favorites')} className="bg-base-bg border border-border-color rounded-md p-1">
             <option value="date">Most Recent</option>
             <option value="favorites">Favorites</option>
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedConversations.map((convo) => (
          <div
            key={convo.id}
            onClick={() => onSelectConversation(convo.id)}
            className={`group flex items-start gap-3 px-4 py-3 cursor-pointer border-l-4 ${
              currentConversationId === convo.id
                ? 'bg-accent-yellow/20 border-accent-yellow'
                : 'border-transparent hover:bg-base-bg'
            }`}
          >
            <div className="text-text-secondary mt-1">{renderIcon(convo.type)}</div>
            <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-start">
                    <p className="font-semibold text-text-primary truncate pr-2">{convo.title}</p>
                    <div className="flex items-center flex-shrink-0">
                        <StarIcon isFilled={convo.isFavorite} onClick={(e) => toggleFavorite(e, convo.id)} className="w-5 h-5 text-accent-yellow flex-shrink-0"/>
                        <button
                            onClick={(e) => handleDelete(e, convo.id)}
                            className="ml-2 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete session"
                            title="Delete session"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <p className="text-xs text-text-secondary">
                  {new Date(convo.createdAt).toLocaleString()}
                </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySidebar;
