# 3. UI Components Documentation

This document provides a detailed description of the primary React components that constitute the application's user interface.

---

### `App.tsx`

-   **Role:** The root component of the application. It establishes the main layout and manages global state.
-   **Key State:**
    -   `galleryData`: Manages the state for the `ImageViewer` modal (which images to show, the current index).
    -   `isThemeSelectorOpen`: Toggles the visibility of the `ThemeSelector` modal.
    -   `currentConversationId`: The ID of the conversation currently displayed in `ChatWindow`. This is the central piece of global state connecting the sidebar and the main window.
    -   `conversations`: An array of all conversation metadata, passed to `HistorySidebar`.
-   **Interactions:**
    -   Renders the main layout, including the header, `HistorySidebar`, and `ChatWindow`.
    -   Fetches all conversations from `dbService` and passes them to the sidebar.
    -   Handles callbacks from child components to update the global state (e.g., `handleSelectConversation`, `handleNewSession`).

---

### `ChatWindow.tsx`

-   **Role:** The primary user workspace. It's the most complex component, managing the chat interface and the conditional side panels for generation and editing.
-   **Key State:**
    -   `currentConversation`: The full `ChatConversation` object being displayed, including all messages and editing sessions.
    -   `messages`: The array of `ChatMessage` objects for the current conversation.
    -   `isLoading`: A boolean to indicate if the model is currently generating a response.
    -   `showGenerationPanel`: A boolean to control the visibility of the `ImageGenerationPanel`.
    -   `activeEditingSession`: Holds the `ImageEditingSession` object when the editing panel is open, otherwise `null`.
    -   `isResizing`, `leftPanelWidth`: State variables that manage the dynamic resizing of the side panels.
-   **Interactions:**
    -   Loads the active conversation from `dbService` based on the `conversationId` prop.
    -   Handles form submissions for sending messages (`handleSubmit`).
    -   Manages file uploads for chat and editing (`handleFileChange`).
    -   Orchestrates the opening and closing of the generation and editing panels.
    -   Contains the logic for the three-panel layout and the draggable splitter.

---

### `HistorySidebar.tsx`

-   **Role:** Displays a list of all past conversations, allowing users to search, filter, and manage them.
-   **Props:**
    -   `conversations`: The array of all conversations to display.
    -   `currentConversationId`: Used to highlight the currently active session.
    -   `onSelectConversation`, `onNewConversation`, `onDeleteConversation`, `onToggleFavorite`: Callback functions to communicate user actions back to `App.tsx`.
-   **Key State:**
    -   `searchTerm`: The current value of the search input.
    -   `sortBy`: The current sorting method ('date' or 'favorites').
-   **Interactions:**
    -   Filters and sorts conversations based on user input.
    -   Renders a list of conversations, each with options to favorite or delete.
    -   Calls the appropriate callback when a user interacts with the list.

---

### `ImageGenerationPanel.tsx`

-   **Role:** A self-contained UI for generating images. It operates independently of the main chat flow.
-   **Props:**
    -   `onCancel`: A function to close the panel.
    -   `initialState`: Optional initial values for the prompt and parameters (used for "recall").
    -   `onViewImage`, `onEditImage`: Callbacks to allow the main `ChatWindow` to handle viewing or editing the images generated *within* this panel.
-   **Key State:**
    -   `genPrompt`, `genAspectRatio`, `genModel`, `genNumImages`: State for all the generation parameters.
    -   `isGenerating`: A boolean to show a loading state during image generation.
    -   `results`: An array of `ImageGenerationResultPart` objects, storing the history of generations made within the panel.
-   **Interactions:**
    -   Calls `imageService.generateImage` when the "Generate" button is clicked.
    -   Displays the results (generated images) within its own scrollable area.

---

### `ImageEditingPanel.tsx`

-   **Role:** A self-contained UI for editing a single image and viewing its version history.
-   **Props:**
    -   `session`: The `ImageEditingSession` object containing the base image and its edit history.
    -   `onApplyEdit`: A callback to the parent to handle the API call for an edit and update the session object.
    -   `onClose`: A function to close the panel.
    -   `onViewImage`: A callback to view an image in the full-screen viewer.
-   **Key State:**
    -   `activeHistoryIndex`: The index of the currently displayed image in the history timeline.
    -   `prompt`: The user's input for the next edit.
    -   `isLoading`: Manages loading states for analysis and editing.
-   **Interactions:**
    -   Displays the base image and a scrollable list of thumbnails representing the edit history.
    -   Allows the user to click any thumbnail to view a previous version.
    -   Handles the "Apply Edit" action by calling the `onApplyEdit` prop.
