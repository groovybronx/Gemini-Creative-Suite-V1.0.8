# 2. Software Architecture

This document outlines the high-level architecture of the Gemini Creative Suite application, focusing on component structure, data flow, and state management.

## 2.1. Component Architecture

The application follows a hierarchical component structure, with clear separation of concerns.

```
App.tsx
├── ThemeSelector.tsx
├── HistorySidebar.tsx
│   └── (List of conversation items)
├── ChatWindow.tsx (Core Interactive Area)
│   ├── ChatHeader.tsx
│   │   └── ModelInfoWidget.tsx
│   ├── MessageList.tsx
│   │   └── Message.tsx
│   │       ├── ImageGenerationResult.tsx
│   │       └── TokenCount.tsx
│   ├── ChatInput.tsx
│   ├── ImageGenerationPanel.tsx (Conditional)
│   │   └── ImageGenerationResult.tsx
│   └── ImageEditingPanel.tsx (Conditional)
│       └── TokenCount.tsx
└── ImageViewer.tsx (Global Modal)
```

-   **`App.tsx`**: The root component. It manages the global state, such as the list of all conversations (`conversations`), the currently selected conversation ID (`currentConversationId`), and the visibility of modal components like `ImageViewer` and `ThemeSelector`. It orchestrates the main layout between the `HistorySidebar` and `ChatWindow`.
-   **`ChatWindow.tsx`**: The main application workspace. It is responsible for the complex layout logic, including the display and resizing of its three potential children panels (Chat, Generation, Editing). It fetches and manages the state for the *active* conversation.
-   **`HistorySidebar.tsx`**: Manages the display, search, and filtering of all conversations retrieved from the database. It communicates user selections (`onSelectConversation`) back up to `App.tsx`.
-   **Panels (`ImageGenerationPanel.tsx`, `ImageEditingPanel.tsx`):** These are self-contained, stateful components that manage their specific functionalities. They interact with `imageService` directly and communicate important events (like viewing or editing a newly created image) up to `ChatWindow`.

## 2.2. Data Flow

The application employs a unidirectional data flow, typical of React applications.

1.  **User Action:** An event is triggered (e.g., sending a message, clicking "generate image").
2.  **Component Handler:** The relevant component's event handler is called (e.g., `handleSubmit` in `ChatWindow`).
3.  **State Update:** The component updates its local state to provide immediate UI feedback (e.g., setting `isLoading` to true).
4.  **Service Call:** The handler calls a function from the **Service Layer** (e.g., `chatService.getChatResponseStream` or `dbService.addOrUpdateConversation`).
5.  **External/Local Interaction:** The service interacts with either an external API (Gemini) or local storage (IndexedDB).
6.  **Data Persistence:** The service updates the database via `dbService` with new messages or sessions.
7.  **State Propagation:** The state update in `App.tsx` (e.g., via `onConversationUpdated`) or `ChatWindow.tsx` causes a re-render, propagating the new data down to child components.

**Example Flow (Sending a Message):**
`ChatInput` -> `ChatWindow.handleSubmit` -> `setIsLoading(true)` -> `dbService.addOrUpdateConversation` (saves user message) -> `chatService.getChatResponseStream` -> (Stream updates `messages` state) -> `dbService.addOrUpdateConversation` (saves model response) -> `MessageList` re-renders.

## 2.3. State Management

State is managed at different levels depending on its scope:

-   **Global State (in `App.tsx`):**
    -   The complete list of conversation metadata (`conversations`).
    -   The ID of the currently active conversation (`currentConversationId`).
    -   This state is necessary because the `HistorySidebar` and `ChatWindow` need to be synchronized.

-   **Active Session State (in `ChatWindow.tsx`):**
    -   The full data of the current conversation (`currentConversation`), including all messages.
    -   UI state for the workspace, such as the visibility of the generation/editing panels (`showGenerationPanel`, `activeEditingSession`) and the panel widths (`leftPanelWidth`).

-   **Component-Local State (e.g., in `ImageGenerationPanel.tsx`):**
    -   State that is entirely self-contained within a component. For example, the `ImageGenerationPanel` manages its own prompt, parameters, loading status, and list of results (`genPrompt`, `isGenerating`, `results`).

-   **Persisted State (`dbService.ts` / IndexedDB):**
    -   The single source of truth for all user-generated content. Components load their initial state from IndexedDB and write back to it to ensure persistence.

## 2.4. Service Layer

The `services/` directory provides a crucial abstraction layer that separates the UI components from the data sources and external APIs.

-   **Role:** To handle all business logic, API communication, and database interactions.
-   **Benefit:** Components do not need to know the implementation details of how data is fetched, sent, or stored. They simply call a service function (e.g., `imageService.generateImage(...)`). This makes the code more modular, testable, and easier to maintain.
