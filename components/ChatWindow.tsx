
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, ChatConversation, GeminiChatModel, MessagePart, GenerationEvent, ImageEditingSession, EditEvent, ImagePart } from '../types';
import { Author } from '../types';
import { chatService } from '../services/chatService';
import { imageService } from '../services/imageService';
import { dbService } from '../services/dbService';
import { fileToBase64 } from '../utils';

import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';
import ImageGenerationPanel from './chat/ImageGenerationPanel';
import ImageEditingPanel from './chat/ImageEditingPanel';

interface ChatWindowProps {
    conversationId: string | null;
    onConversationCreated: (id: string) => void;
    onConversationUpdated: () => void;
    onViewImage: (images: string[], startIndex: number) => void;
}

const parseDataUrl = (dataUrl: string): { base64: string; mimeType: string } | null => {
    const match = dataUrl.match(/^data:(image\/.+);base64,(.+)$/);
    if (!match) return null;
    const [, mimeType, base64] = match;
    return { mimeType, base64 };
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, onConversationCreated, onConversationUpdated, onViewImage }) => {
    const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState<GeminiChatModel>('gemini-2.5-flash');
    const [uploadedImage, setUploadedImage] = useState<{ url: string; base64: string; mimeType: string; } | null>(null);
    const [showGenerationPanel, setShowGenerationPanel] = useState(false);
    const [recalledGeneration, setRecalledGeneration] = useState<{ prompt: string, params: GenerationEvent['parameters'] } | undefined>(undefined);
    const [activeEditingSession, setActiveEditingSession] = useState<ImageEditingSession | null>(null);

    const [isResizing, setIsResizing] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentConversationIdRef = useRef<string | null>(conversationId);
    const prevConversationIdRef = useRef<string | null>(null);
    
    useEffect(() => {
        const wasOnExistingConvo = !!prevConversationIdRef.current;
        currentConversationIdRef.current = conversationId;

        const loadConversation = async () => {
            if (conversationId) {
                const convo = await dbService.getConversation(conversationId);
                if (convo && convo.type === 'chat') {
                    setCurrentConversation(convo);
                    setMessages(convo.messages);
                    setModel(convo.modelUsed);
                } else {
                    resetChatState();
                }
            } else {
                resetChatState();
            }
        };

        // Only reset panels if switching from one existing conversation to another.
        // `resetChatState` handles the `... -> null` case. This protects the `null -> id` case.
        if (wasOnExistingConvo && prevConversationIdRef.current !== conversationId) {
            setActiveEditingSession(null);
            setShowGenerationPanel(false);
        }

        loadConversation();

        prevConversationIdRef.current = conversationId;
    }, [conversationId]);

    const resetChatState = () => {
        setCurrentConversation(null);
        setMessages([{
            id: 'initial',
            author: Author.MODEL,
            parts: [{ type: 'text', text: "Hello! I'm Gemini. How can I assist you today? You can ask me anything or generate an image!" }]
        }]);
        setModel('gemini-2.5-flash');
        setInput('');
        setUploadedImage(null);
        setShowGenerationPanel(false);
        setActiveEditingSession(null);
    }
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            const dataUrl = `data:${file.type};base64,${base64}`;
            const imageData = {
                url: dataUrl,
                base64,
                mimeType: file.type
            };
            setUploadedImage(imageData);
            
            if (!input.trim()) {
                handleEditImage({ type: 'image', url: dataUrl, base64, mimeType: file.type });
            }

        }
        if (e.target) e.target.value = '';
    }

    const saveConversationState = useCallback(async (updatedConvo: ChatConversation) => {
        await dbService.addOrUpdateConversation(updatedConvo);
        setCurrentConversation(updatedConvo);
        onConversationUpdated();
    }, [onConversationUpdated]);

    const saveMessage = async (message: ChatMessage): Promise<string> => {
        let convoToUpdate: ChatConversation;
        let convoId = currentConversationIdRef.current;

        if (!convoId) {
            const titleText = (message.parts.find(p => p.type === 'text') as { text: string } | undefined)?.text || 'New Chat';
            convoId = Date.now().toString();
            currentConversationIdRef.current = convoId;

            convoToUpdate = {
                id: convoId,
                title: titleText.substring(0, 40) + (titleText.length > 40 ? '...' : ''),
                messages: [message],
                createdAt: Date.now(),
                modelUsed: model,
                isFavorite: false,
                type: 'chat',
                imageEditingSessions: [],
            };
            onConversationCreated(convoId);
        } else {
            const existingConvo = currentConversation ?? await dbService.getConversation(convoId) as ChatConversation;
            convoToUpdate = {
                ...existingConvo,
                messages: [...existingConvo.messages, message],
            };
        }
        
        await saveConversationState(convoToUpdate);
        return convoId;
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && !uploadedImage || isLoading) return;

        const userParts: MessagePart[] = [];
        if (uploadedImage) {
            userParts.push({ type: 'image', ...uploadedImage });
        }
        if (input.trim()) {
            userParts.push({ type: 'text', text: input });
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            author: Author.USER,
            parts: userParts,
        };

        const currentMessages = messages.filter(m => m.id !== 'initial');
        const updatedMessages = [...currentMessages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setUploadedImage(null);
        setIsLoading(true);

        await saveMessage(userMessage);

        const modelMessageId = (Date.now() + 1).toString();
        const modelMessage: ChatMessage = {
            id: modelMessageId,
            author: Author.MODEL,
            parts: [{ type: 'text', text: '' }],
        };
        setMessages(prev => [...prev, modelMessage]);

        let fullResponse = '';
        let usageMetadata;
        for await (const chunk of chatService.getChatResponseStream(updatedMessages, model)) {
            fullResponse += chunk.text;
            if (chunk.usageMetadata) {
                usageMetadata = chunk.usageMetadata;
            }
            setMessages(prev => prev.map((msg): ChatMessage => msg.id === modelMessageId ? { ...msg, parts: [{ type: 'text', text: fullResponse }] } : msg));
        }

        setIsLoading(false);

        const finalModelMessage: ChatMessage = { ...modelMessage, parts: [{ type: 'text', text: fullResponse }], usageMetadata };
        setMessages(prev => prev.map(msg => msg.id === modelMessageId ? finalModelMessage : msg));
        
        if (currentConversation) {
            const finalConvo = {
                ...currentConversation,
                messages: [...currentConversation.messages, userMessage, finalModelMessage]
            };
            await saveConversationState(finalConvo);
        } else {
            await saveMessage(finalModelMessage);
        }
    };

    const handleEditImage = async (imageSource: ImagePart | { url: string }) => {
        const imageUrl = imageSource.url;
        let base64: string;
        let mimeType: string;

        if ('base64' in imageSource && 'mimeType' in imageSource) {
            base64 = imageSource.base64;
            mimeType = imageSource.mimeType;
        } else {
            const parsed = parseDataUrl(imageUrl);
            if (!parsed) return;
            base64 = parsed.base64;
            mimeType = parsed.mimeType;
        }
        
        let convo = currentConversation;
        if (!convo) {
            const newConvoId = await saveMessage({id: 'init_edit', author: Author.USER, parts: [{type: 'text', text: 'Started editing an image'}]});
            convo = await dbService.getConversation(newConvoId) as ChatConversation;
            if (!convo) return;
        }

        const sessions = convo.imageEditingSessions || [];
        let session = sessions.find(s => s.baseImage.base64 === base64);

        if (!session) {
            session = {
                id: Date.now().toString(),
                baseImage: { url: imageUrl, base64, mimeType },
                history: [],
            };
            const updatedConvo = { ...convo, imageEditingSessions: [...sessions, session] };
            await saveConversationState(updatedConvo);
        }
        setActiveEditingSession(session);
    };
    
    const handleApplyEdit = async (prompt: string) => {
        if (!activeEditingSession || !currentConversation) return;

        const sourceImage = activeEditingSession.history.length > 0
            ? activeEditingSession.history[activeEditingSession.history.length - 1].editedImage
            : activeEditingSession.baseImage;
        
        const result = await imageService.editImage(sourceImage.base64, sourceImage.mimeType, prompt);
        const parsedData = parseDataUrl(result.imageUrl);
        if (parsedData) {
            const newEvent: EditEvent = {
                prompt,
                editedImage: { url: result.imageUrl, ...parsedData },
                timestamp: Date.now(),
                usageMetadata: result.usageMetadata,
            };
            const updatedSession = {
                ...activeEditingSession,
                history: [...activeEditingSession.history, newEvent]
            };
            const updatedSessions = (currentConversation.imageEditingSessions || []).map(s => s.id === updatedSession.id ? updatedSession : s);
            const updatedConvo = { ...currentConversation, imageEditingSessions: updatedSessions };
            
            await saveConversationState(updatedConvo);
            setActiveEditingSession(updatedSession);
        }
    }

    const handleRecallGeneration = (prompt: string, params: GenerationEvent['parameters']) => {
        setRecalledGeneration({ prompt, params });
        setShowGenerationPanel(true);
        setUploadedImage(null);
    };
    const handleShowGenerationPanel = () => { 
        setShowGenerationPanel(true); 
        setRecalledGeneration(undefined); 
        setUploadedImage(null); 
    }
    const handleCancelGeneration = () => { setShowGenerationPanel(false); setRecalledGeneration(undefined); }

    const handleMouseDownOnSplitter = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        const minWidth = 25;
        const maxWidth = 75;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        
        setLeftPanelWidth(clampedWidth);
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    const chatArea = (
        <div className="flex flex-col h-full bg-component-bg rounded-lg border border-border-color overflow-hidden">
            <ChatHeader 
                model={model} 
                setModel={setModel} 
                disabled={ (messages.length > 1 && messages.some(m => m.id !== 'initial')) || showGenerationPanel || !!activeEditingSession } 
            />
            <MessageList 
                messages={messages} 
                isLoading={isLoading} 
                onViewImage={onViewImage} 
                onEditImage={handleEditImage} 
                onRecallGeneration={handleRecallGeneration} 
            />
            <div className="p-4 border-t border-border-color">
                <ChatInput 
                    input={input} 
                    setInput={setInput} 
                    handleSubmit={handleSubmit} 
                    handleFileChange={handleFileChange} 
                    onShowGenerationPanel={handleShowGenerationPanel} 
                    uploadedImage={uploadedImage} 
                    clearUploadedImage={() => setUploadedImage(null)} 
                    isLoading={isLoading} 
                />
            </div>
        </div>
    );

    const splitter = (
        <div 
            onMouseDown={handleMouseDownOnSplitter}
            className="w-3 h-full cursor-col-resize flex items-center justify-center group"
        >
            <div className="w-0.5 h-12 bg-border-color group-hover:bg-accent-yellow transition-colors rounded-full"></div>
        </div>
    );
    
    const isAnyRightPanelOpen = showGenerationPanel || !!activeEditingSession;

    return (
        <div ref={containerRef} className="flex h-full" style={{ cursor: isResizing ? 'col-resize' : 'auto' }}>
            <div style={{ width: isAnyRightPanelOpen ? `${leftPanelWidth}%` : '100%' }} className="h-full">
                {chatArea}
            </div>
            
            {isAnyRightPanelOpen && splitter}
    
            {isAnyRightPanelOpen && (
                <div style={{ width: `calc(${100 - leftPanelWidth}% - 12px)` }} className="h-full flex gap-2">
                    {showGenerationPanel && (
                        <div className="flex-1 h-full min-w-0">
                            <ImageGenerationPanel 
                                onCancel={handleCancelGeneration} 
                                initialState={recalledGeneration}
                                onViewImage={onViewImage}
                                onEditImage={handleEditImage}
                                onRecallGeneration={handleRecallGeneration}
                            />
                        </div>
                    )}
                    {activeEditingSession && (
                        <div className="flex-1 h-full min-w-0">
                            <ImageEditingPanel 
                                key={activeEditingSession.id}
                                session={activeEditingSession}
                                onApplyEdit={handleApplyEdit}
                                onClose={() => setActiveEditingSession(null)}
                                onViewImage={onViewImage}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
