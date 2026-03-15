# Sequence Diagram: Authentication Flow

This diagram illustrates the Google OAuth 2.0 authentication process for Cornerman AI.

```mermaid
sequenceDiagram
    autonumber
    
    actor User as User (Boxer)
    participant SPA as Single-Page Application
    participant API as Node.js Backend (/api/auth)
    participant Google as Google OAuth 2.0
    
    User->>SPA: Clicks "Sign in with Google"
    SPA->>API: GET /api/auth/google/url
    API->>Google: Generate Auth URL
    Google-->>API: Returns Authorization URL
    API-->>SPA: Returns URL (JSON)
    SPA->>User: Opens Popup/Redirects to Google
    
    User->>Google: Logs in and grants permissions
    Google->>API: Redirects to /api/auth/google/callback?code=...
    
    API->>Google: Exchange 'code' for Tokens
    Google-->>API: Returns Access Token & ID Token
    
    API->>Google: Verify ID Token
    Google-->>API: Returns User Profile Data
    
    API->>API: Create Encrypted Cookie Session (cookie-session)
    API-->>SPA: Returns Success HTML Page
    
    SPA->>API: GET /api/auth/me (with secure cookie)
    API-->>SPA: Returns User Data
    SPA->>User: Shows Authenticated UI (Concierge/Training)
```

## Description

1. **Initiation**: The user initiates the login process from the frontend.
2. **URL Generation**: The backend securely generates the correct Google OAuth URL containing the necessary scopes and the `redirect_uri`.
3. **User Consent**: The user is redirected to Google's consent screen.
4. **Callback**: Google redirects the user back to the backend's callback URL with an authorization `code`.
5. **Token Exchange**: The backend securely exchanges this `code` for an access token and an ID token (using the `GOOGLE_CLIENT_SECRET`).
6. **Session Creation**: The backend verifies the user's identity and establishes a session using `cookie-session`, which sets a secure, HTTP-only cookie.
7. **Confirmation**: The SPA detects the successful login, fetches the user profile using the established cookie, and grants access to the application.
