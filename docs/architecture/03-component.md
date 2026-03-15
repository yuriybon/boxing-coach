# Level 3: Component Diagram

The Component diagram shows the internal structure of the containers, outlining the key building blocks within the SPA and the Backend.

```mermaid
C4Component
    title Component diagram for Cornerman AI - Backend & SPA

    Container_Boundary(spa, "Single-Page Application") {
        Component(app_ui, "App UI & Routing", "React Components", "Manages screens: Concierge, Training, Analysis.")
        Component(media_capture, "Media Capture Hooks", "React Hooks", "Accesses camera and microphone via browser APIs.")
        Component(ws_client, "WebSocket Client", "Custom Hook (useGeminiLive)", "Handles bidirectional real-time communication with the backend.")
        Component(audio_utils, "Audio Utilities", "TypeScript", "Converts PCM audio (Float32 <-> Int16) for Gemini compatibility.")
        
        Rel(app_ui, media_capture, "Uses for training")
        Rel(app_ui, ws_client, "Initiates coaching session")
        Rel(media_capture, ws_client, "Pipes A/V data")
        Rel(ws_client, audio_utils, "Formats audio for transport")
    }

    Container_Boundary(backend, "API & WebSocket Server") {
        Component(server_ts, "Express App (server.ts)", "Node.js/Express", "Entry point, middleware, static serving.")
        Component(auth_routes, "Auth Controller", "Express Routes", "Handles Google OAuth callbacks and token exchange.")
        Component(session_manager, "Session Manager", "TypeScript Class", "Manages the WebSocket lifecycle between the SPA and Gemini API.")
        Component(config_loader, "Config Loader", "TypeScript", "Fetches from Google Secret Manager on startup.")

        Rel(server_ts, auth_routes, "Delegates auth requests")
        Rel(server_ts, session_manager, "Passes WS connections")
        Rel(server_ts, config_loader, "Loads secrets at startup")
    }

    Rel(ws_client, session_manager, "Connects to (/ws/coach)", "WebSockets")
    Rel(app_ui, auth_routes, "Initiates login", "HTTPS")
```

## Key Components

### Single-Page Application
- **App UI & Routing**: The top-level React application structure orchestrating the user flow across three main screens: Setup (Concierge), Active Session (Training), and Review (Analysis).
- **Media Capture Hooks**: Custom React hooks responsible for requesting permissions and reading continuous frames from the browser's `getUserMedia` API.
- **WebSocket Client (`useGeminiLive`)**: Encapsulates the logic for connecting to the backend WebSocket server, sending media payloads (base64 image frames, raw PCM audio), and receiving AI text/audio responses.
- **Audio Utilities**: Helper functions that convert Float32 audio recorded by the browser down to the Int16 16kHz format required by the Gemini Live API.

### API & WebSocket Server
- **Express App (`server.ts`)**: The core entry point configuring middleware, HTTP routing, and the WebSocket server attachment.
- **Auth Controller**: Express route handlers (`/api/auth/*`) that implement the OAuth 2.0 authorization code flow and store user data in a secure, encrypted cookie session.
- **Session Manager (`sessionManager.ts`)**: A specialized class instantiated per WebSocket connection. It manages the connection state, configurations (e.g., system instructions for the AI coach), and handles translating standard WebSockets into the specific format expected by the Google GenAI SDK.
- **Config Loader**: Initialization logic that attempts to fetch required secrets (like `GEMINI_API_KEY` and `GOOGLE_CLIENT_SECRET`) from Google Secret Manager during application startup, falling back to local environment variables if necessary.
