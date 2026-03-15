# Level 2: Container Diagram

The Container diagram zooms into the Cornerman AI system, showing the high-level technical structure and how the different containers communicate.

```mermaid
C4Container
    title Container diagram for Cornerman AI

    Person(user, "User (Boxer)", "Trains and receives feedback")

    System_Ext(gemini, "Gemini Live API", "Provides real-time AI coaching")
    System_Ext(oauth, "Google OAuth 2.0", "Identity Provider")
    System_Ext(secretManager, "Google Secret Manager", "Secrets store")

    System_Boundary(c1, "Cornerman AI") {
        Container(spa, "Single-Page Application", "React, Vite, Tailwind", "Provides the user interface, captures camera/mic, and plays audio feedback.")
        Container(backend, "API & WebSocket Server", "Node.js, Express", "Serves the SPA, handles OAuth flow, and manages the secure WebSocket proxy to Gemini.")
    }

    Rel_D(user, spa, "Visits, allows camera/mic access", "HTTPS")
    Rel_D(spa, backend, "Authenticates and fetches user info", "HTTPS")
    Rel_D(spa, backend, "Streams audio/video and receives coaching", "WebSockets (WSS)")
    
    Rel_R(backend, oauth, "Validates tokens, gets user info", "HTTPS")
    Rel_L(backend, secretManager, "Fetches keys at startup", "HTTPS")
    Rel_D(backend, gemini, "Proxies stream to AI model", "WebSockets (WSS)")
```

## Containers

- **Single-Page Application (SPA)**: Built with React and Vite. It runs in the user's browser, handles the visual UI, and utilizes standard browser APIs (WebRTC/MediaDevices) to capture audio and video. It converts the data to a compatible format before sending it to the backend.
- **API & WebSocket Server**: A Node.js and Express server. It has three main responsibilities:
  1. Serves the static SPA files (in production) or runs a Vite middleware (in development).
  2. Provides REST API endpoints for the Google OAuth 2.0 authentication flow and session management.
  3. Acts as a WebSocket proxy server. It accepts WebSocket connections from the SPA and opens a downstream WebSocket connection to the Gemini Live API, facilitating secure and authenticated real-time communication.
