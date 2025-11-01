# 4. Services and Data Models

This document describes the core data structures and the service layer responsible for business logic and external communication.

## 4.1. Core Data Models (`types.ts`)

The application's data consistency is ensured by a set of well-defined TypeScript types.

-   **`Conversation` (Union Type)**
    The top-level object stored in IndexedDB. Currently, it only contains `ChatConversation`.
    -   `id`: Unique identifier (timestamp).
    -   `title`: A short, descriptive title.
    -   `createdAt`: Timestamp of creation.
    -   `isFavorite`: Boolean for filtering.
    -   `type`: Discriminant for the union, e.g., `'chat'`.

-   **`ChatConversation`**
    Represents a single chat session.
    -   `messages`: An array of `ChatMessage` objects.
    -   `modelUsed`: The Gemini model (`'gemini-2.5-flash'` or `'gemini-2.5-pro'`) used for the conversation.
    -   `imageEditingSessions`: An optional array of `ImageEditingSession` objects, linking all edits to the conversation where they were initiated.

-   **`ChatMessage`**
    Represents a single message bubble from either the user or the model.
    -   `id`: Unique identifier.
    -   `author`: `'user'` or `'model'`.
    -   `parts`: An array of `MessagePart`, allowing for multimodal content. A single message can contain text and images.
    -   `usageMetadata`: Optional token usage information from the API.

-   **`ImageEditingSession`**
    Represents a complete editing workflow for a single base image.
    -   `id`: Unique identifier for the session.
    -   `baseImage`: The original image that all edits are derived from.
    -   `history`: An array of `EditEvent` objects, where each event represents one successful edit (prompt and resulting image).

## 4.2. Service Layer (`services/`)

The service layer abstracts all external and local data interactions away from the UI components.

### `dbService.ts`

-   **Purpose:** A singleton service that acts as a wrapper around the browser's **IndexedDB** API. It is the sole authority for persisting and retrieving user data.
-   **Key Functions:**
    -   `addOrUpdateConversation(conversation)`: Inserts or updates a conversation object in the database.
    -   `getConversation(id)`: Retrieves a single conversation by its ID.
    -   `getAllConversations()`: Fetches all conversations, typically for display in the `HistorySidebar`.
    -   `deleteConversation(id)`: Removes a conversation from the database.

### `chatService.ts`

-   **Purpose:** Handles all communication with the Gemini text and multimodal chat API.
-   **Key Functions:**
    -   `getChatResponseStream(messages, model)`: This is an async generator function.
        1.  It first calls `buildContents` to transform the application's `ChatMessage[]` array into the `Content[]` format required by the `@google/genai` SDK.
        2.  It then calls `ai.models.generateContentStream` to initiate a streaming API request.
        3.  It `yield`s each chunk of the response as it arrives, allowing the UI to display the model's reply in real-time.

### `imageService.ts`

-   **Purpose:** Handles all communication with Google's image generation and editing models.
-   **Key Functions:**
    -   `generateImage(prompt, params)`: Calls the `ai.models.generateImages` endpoint (Imagen). It takes a prompt and parameters (model, aspect ratio, etc.) and returns an array of base64-encoded image URLs.
    -   `analyzeImage(base64, mimeType, prompt)`: Uses a Gemini vision model (`gemini-2.5-flash`) to generate a text description of an image.
    -   `editImage(base64, mimeType, prompt)`: Calls the `gemini-2.5-flash-image` model. It sends the original image and a text prompt and expects an edited image in return.

### `modelService.ts`

-   **Purpose:** Fetches metadata about the available AI models.
-   **Key Functions:**
    -   `getModelInfo(modelName)`: Makes a REST API call to the `generativelanguage.googleapis.com` endpoint to retrieve details about a model, such as its token limits, description, and default parameters. It includes a simple in-memory cache to prevent redundant API calls for the same model.

### `geminiClient.ts`

-   **Purpose:** A simple module that initializes and exports a singleton instance of the `GoogleGenAI` client from the `@google/genai` SDK, configured with the API key from the environment.
