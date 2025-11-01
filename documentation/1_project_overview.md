# 1. Project Overview: Gemini Creative Suite

## 1.1. Mission Statement

Gemini Creative Suite is a versatile, single-page web application designed to serve as a powerful and intuitive interface for Google's generative AI models. It provides a unified workspace where users can engage in dynamic conversations with Gemini, generate high-quality images with Imagen, and perform sophisticated, prompt-based image editing.

The application aims to be a creative partner, empowering users to seamlessly transition between ideation, content creation, and refinement, all within a single, persistent, and customizable environment.

## 1.2. Core Features

The application is built around three primary, interconnected functionalities:

1.  **Multimodal Conversational AI:**
    *   Engage in text-based chats with Gemini models (`gemini-2.5-flash`, `gemini-2.5-pro`).
    *   Upload images to discuss or analyze them within the conversation.
    *   Chat history is preserved, allowing for context-aware follow-up questions.

2.  **Integrated Image Generation:**
    *   A dedicated, collapsible side panel allows users to generate images using various Imagen models.
    *   Fine-grained control over parameters like aspect ratio and the number of images.
    *   The generation process is self-contained within its panel, allowing users to continue chatting or editing while images are being created.

3.  **Advanced Image Editing:**
    *   Users can select any image (uploaded or generated) to open a dedicated editing panel.
    *   Perform edits using natural language prompts (e.g., "add a retro filter").
    *   The panel maintains a visual history of all edits, allowing users to revert to previous versions and explore different creative paths.

## 1.3. Technology Stack

*   **Frontend Framework:** **React 19** with **TypeScript** for a modern, type-safe, and component-based UI.
*   **AI Integration:** **`@google/genai` SDK** for all communications with the Gemini and Imagen APIs.
*   **Styling:** **Tailwind CSS** for a utility-first, responsive, and easily customizable design. A dynamic theming system is implemented using CSS variables.
*   **Client-Side Storage:**
    *   **IndexedDB (`dbService.ts`):** All user conversations, including messages and image editing sessions, are persisted locally. This ensures data is not lost between sessions.
    *   **Local Storage:** User theme preferences (including custom themes) are stored here.
*   **Build/Module System:** The application relies on an `importmap` for ES module resolution in the browser, without a traditional bundler like Webpack or Vite.
