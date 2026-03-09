# Cornerman AI - Project Context

## Project Overview

**Cornerman AI** is a real-time, multimodal boxing coach application powered by the **Gemini Live API**. It transforms a user's device into an interactive training partner that can "see" and "hear" their workout.

### Core Functionality
-   **Visual Analysis:** Uses the device's camera to analyze boxing form, stance, and punch technique.
-   **Audio Analysis:** Listens to breathing patterns and punch impacts via the microphone.
-   **Real-time Coaching:** Provides low-latency voice feedback, combo callouts, and motivation using Gemini's native audio capabilities.
-   **Secure Authentication:** Implements Google OAuth 2.0 with secure session management.

### Architecture
The project is a **monorepo-style full-stack application**:
-   **Frontend:** React 18 application built with Vite. It handles media capture (Camera/Mic) and renders the UI using Tailwind CSS and Framer Motion.
-   **Backend:** Node.js/Express server (`server.ts`). It serves the frontend, handles OAuth callbacks, and manages a secure WebSocket proxy to the Gemini Live API.
-   **Infrastructure:** Dockerized for deployment on Google Cloud Run, utilizing Google Cloud Secret Manager for credential management.

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | UI and application logic. |
| **Styling** | Tailwind CSS | Utility-first CSS framework. |
| **Animation** | Framer Motion | Fluid UI animations. |
| **Backend** | Node.js, Express | API and WebSocket server. |
| **Communication** | WebSockets (`ws`) | Real-time bidirectional audio/video streaming. |
| **AI Model** | Gemini 2.5 Flash | `gemini-2.5-flash-native-audio-preview-09-2025` for multimodal interaction. |
| **Auth** | Google OAuth 2.0 | User authentication via `google-auth-library`. |
| **Storage** | `cookie-session` | Secure, encrypted session storage in cookies. |

## Building and Running

### Prerequisites
-   Node.js 22+
-   Google Cloud Project with `Generative Language API` and `Secret Manager API` enabled.

### Environment Setup
Create a `.env` file in the root directory:
```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# App Security
SESSION_SECRET=your_random_secret_string

# Cloud Configuration (Optional for local dev)
GOOGLE_CLOUD_PROJECT=your_project_id
APP_URL=http://localhost:3000
```

### Installation
```bash
npm install
```

### Development
Start the full-stack development server (Backend + Vite Middleware):
```bash
npm run dev
```
*   Access the app at `http://localhost:3000`.
*   The backend runs on port 3000 and proxies frontend requests through Vite.

### Production Build
1.  Build the frontend:
    ```bash
    npm run build
    ```
2.  Start the production server:
    ```bash
    npm start
    ```

## Key Files and Directories

-   **`server.ts`**: The main entry point. Sets up Express, WebSocket server, OAuth, and Gemini API connection.
-   **`src/App.tsx`**: Main frontend component. Handles UI layout and connects `useAuth` and `useBoxingCoach` hooks.
-   **`src/hooks/useBoxingCoach.ts`**: Core logic for media capture (Web Audio API, Canvas for video frames) and WebSocket communication with the backend.
-   **`src/hooks/useAuth.ts`**: Manages user authentication state.
-   **`src/lib/audioUtils.ts`**: Utilities for PCM audio conversion (Float32 <-> Int16).
-   **`Dockerfile`**: Configuration for containerizing the application.

## Development Conventions

-   **Type Safety:** Strict TypeScript usage across both frontend and backend.
-   **Styling:** Use Tailwind CSS utility classes.
-   **State Management:** Prefer React Hooks (custom hooks for complex logic) over global state libraries for this scale.
-   **Security:**
    -   Secrets are managed via Google Secret Manager in production.
    -   Cookies are configured with `SameSite: none; Secure` when running in iframes (like AI Studio) or production.
- **Media Handling:** Audio is processed at 16kHz (Gemini requirement). Video frames are sent as base64 JPEG images over WebSockets.

## Troubleshooting & SDK Notes

### Gemini Live API Connectivity
- **Root Cause of Abrupt Disconnection:** The model `gemini-2.5-flash-native-audio-preview-09-2025` strictly requires `responseModalities: [Modality.AUDIO]`. Including `Modality.TEXT` in the configuration will cause the Gemini server to immediately terminate the WebSocket connection.
- **Dual Session Logs:** When transitioning from a 'Concierge' to a 'Coach' session, you will see two "Gemini connection closed" logs. The first is the intentional closure of the Concierge session; the second (if unexpected) usually indicates a configuration error in the new session.

### SDK Migration (@google/genai v1.29.0+)
- **Tool Schemas:** Use `parametersJsonSchema` instead of `parameters`. Property types must be lowercase (e.g., `type: "string"`, not `type: "STRING"`).
- **GenerateContent Response:** Access response text via `result.text` rather than `result.response.text()`.
- **Typing:** The `LiveSession` type is not exported in newer versions. Use `any` or explicit interface matching for session objects.

