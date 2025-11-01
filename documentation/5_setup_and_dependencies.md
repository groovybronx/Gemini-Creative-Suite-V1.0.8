# 5. Setup and Dependencies

This document provides instructions for setting up the development environment and an overview of the project's dependencies and file structure.

## 5.1. Dependencies

The project leverages modern web technologies and a minimal set of dependencies, loaded directly in the browser via an `importmap` in `index.html`.

-   **React (`react`, `react-dom`):** The core library for building the user interface.
-   **Google GenAI SDK (`@google/genai`):** The official JavaScript SDK for interacting with the Gemini and Imagen APIs. All AI-powered features rely on this package.
-   **Tailwind CSS:** A utility-first CSS framework used for all styling. It is loaded via a CDN script in `index.html`, and its configuration is defined directly within a `<script>` tag.

There is no complex build step (like Webpack or Vite) required to run the application in its current form.

## 5.2. Environment Setup

The application requires a single, critical environment variable to function.

### API Key Configuration

The Google Gemini API key **must** be available as `process.env.API_KEY`.

-   **In Development/Deployment:** The environment where the application is served must have this variable set. The `geminiClient.ts` module will throw an error on startup if the key is not found.
-   **Security:** The API key is used for all calls to Google's AI services. It is essential to manage this key securely and ensure it is not exposed in public repositories.

## 5.3. File Structure

The project is organized into a modular structure to promote separation of concerns.

```
.
├── documentation/        # (This folder) All project documentation.
├── components/           # All React components.
│   ├── chat/             # Components specific to the ChatWindow.
│   ├── icons/            # Reusable SVG icon components.
│   ├── App.tsx           # Root component.
│   ├── ChatWindow.tsx    # Main workspace component.
│   └── ...               # Other shared components.
├── contexts/             # React context providers (e.g., ThemeContext).
├── hooks/                # Custom React hooks (e.g., useTheme).
├── services/             # Modules for business logic and API calls.
│   ├── dbService.ts      # IndexedDB interaction.
│   ├── chatService.ts    # Gemini chat API calls.
│   ├── imageService.ts   # Imagen/Gemini image API calls.
│   └── ...
├── themes.ts             # Theme color definitions.
├── types.ts              # Centralized TypeScript type definitions.
├── utils.ts              # General utility functions.
├── index.html            # The main HTML entry point.
├── index.tsx             # The React application entry point.
└── ...                   # Other configuration files.
```

-   **`components/`**: Contains all UI elements. Sub-folders like `chat/` are used to group components by feature.
-   **`services/`**: The "brains" of the application, handling all logic that is not directly related to rendering the UI.
-   **`types.ts`**: A critical file that provides a single source of truth for all data structures used throughout the app.
-   **`contexts/` and `hooks/`**: Standard React patterns for sharing state and logic across the component tree.
