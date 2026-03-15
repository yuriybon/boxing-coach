# Level 1: System Context Diagram

The System Context diagram provides a high-level overview of the Cornerman AI system, the user interacting with it, and the external systems it depends on.

```mermaid
C4Context
    title System Context diagram for Cornerman AI
    
    Person(user, "User (Boxer)", "A person who wants to train boxing and get real-time feedback.")
    
    System(cornerman, "Cornerman AI", "Real-time multimodal boxing coach application providing voice feedback based on video/audio streams.")
    
    System_Ext(gemini, "Gemini Live API", "Google's multimodal AI providing real-time analysis and voice coaching.")
    System_Ext(oauth, "Google OAuth 2.0", "Authentication provider for secure login.")
    System_Ext(secretManager, "Google Secret Manager", "Securely stores application secrets and credentials.")
    
    Rel(user, cornerman, "Trains using, streams audio & video to", "Web Browser")
    Rel(cornerman, gemini, "Streams real-time A/V, receives audio feedback", "WebSockets")
    Rel(cornerman, oauth, "Authenticates users via", "HTTPS")
    Rel(cornerman, secretManager, "Retrieves credentials securely", "HTTPS/GCP")
```

## Elements

- **User (Boxer)**: The end-user of the application. They interact with the frontend via their browser, allowing access to the camera and microphone.
- **Cornerman AI**: The core system described in this documentation.
- **Gemini Live API**: The external AI service that processes the multimodal data and returns coaching feedback.
- **Google OAuth 2.0**: The external identity provider used to securely authenticate users.
- **Google Secret Manager**: The external system providing secure storage and retrieval for the application's sensitive environment variables and keys.
