# Level 1: System Context Diagram

The System Context diagram provides a high-level overview of the Cornerman AI system, the user interacting with it, and the external systems it depends on.


```mermaid
graph TD
    %% Define C4-like styles
    classDef person fill:#08427b,stroke:#073b6e,color:white,font-weight:bold
    classDef system fill:#1168bd,stroke:#0b4884,color:white,font-weight:bold
    classDef external fill:#999999,stroke:#666666,color:white,font-weight:bold
    %% Nodes
    User["User (Boxer)<br/>(A person who wants to train)"]:::person
    Cornerman["Cornerman AI<br/>(Real-time coaching system)"]:::system

       subgraph External_Systems [External Dependencies]
           direction LR
           Gemini["Gemini Live API<br/>(AI Analysis)"]:::external
           OAuth["Google OAuth 2.0<br/>(Auth)"]:::external
           SecretManager["Google Secret Manager<br/>(Secrets)"]:::external
       end

       %% Relationships
       User -- "Streams A/V via Browser" --> Cornerman
       Cornerman -- "HTTPS Auth" --> OAuth
       Cornerman -- "WSS Proxy" --> Gemini
       Cornerman -- "GCP API" --> SecretManager

       %% Layout Hints
       %% This ensures User is at the top, Cornerman in middle, and Externals are grouped
```

## Elements

- **User (Boxer)**: The end-user of the application. They interact with the frontend via their browser, allowing access to the camera and microphone.
- **Cornerman AI**: The core system described in this documentation.
- **Gemini Live API**: The external AI service that processes the multimodal data and returns coaching feedback.
- **Google OAuth 2.0**: The external identity provider used to securely authenticate users.
- **Google Secret Manager**: The external system providing secure storage and retrieval for the application's sensitive environment variables and keys.
