# 🥊 Cornerman AI

**Cornerman AI** is your personal real-time boxing coach powered by the **Gemini Live API**. The application analyzes your movements through the camera and provides voice commands, technique tips, and motivation right during your workout.

## 🌟 Key Features

-   **Real-time Voice Coaching**: Low latency thanks to the Gemini Live API (Multimodal).
-   **Visual Analysis**: The coach "sees" you and corrects your stance, punches, and defense.
-   **Interactive Rounds**: Dynamic changes in pace and combinations.
-   **Secure Authorization**: Integration with Google OAuth 2.0.
-   **Cloud Integration**: Support for Google Cloud Secret Manager for storing keys.

## 🛠 Tech Stack

-   **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion.
-   **Backend**: Node.js, Express, WebSockets (ws).
-   **AI**: Google Gemini Live API (`gemini-2.5-flash-native-audio-preview-09-2025`).
-   **Auth**: Google OAuth 2.0 + `cookie-session`.
-   **Infrastructure**: Docker, Google Cloud Run, Google Cloud Build.

## 🏗 Architecture

Detailed architectural documentation, including C4 Model diagrams, can be found in the **[docs folder](./docs/README.md)**.

## 🚀 Quick Start

### 1. Requirements
- Node.js 22+
- Google Cloud Project with enabled APIs:
    - Generative Language API
    - Secret Manager API
    - Google Search (optional)

### 2. Environment Variables Setup (.env)
Create a `.env` file in the root of the project:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GEMINI_API_KEY=your_api_key
SESSION_SECRET=arbitrary_string
GOOGLE_CLOUD_PROJECT=your_project_id
APP_URL=http://localhost:3000
```

### 3. Installation and Launch
```bash
npm install
npm run dev
```

## ☁️ Deployment to Cloud Run

The application is completely ready for deployment via Cloud Build:
1. Configure a **Service Account** in Cloud Run.
2. Grant it the `Secret Manager Secret Accessor` role.
3. Add secrets to Secret Manager with the following names:
    - `GEMINI_API_KEY`
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `SESSION_SECRET`
4. Set the `APP_URL` environment variable in the Cloud Run settings.

## 🔒 Security
The application uses `SameSite: none` and `Secure` cookies to work within an iframe and correctly handles `trust proxy` for working in the Google Cloud environment.


## !!! Special Notes
⚠️ IMPORTANT: This version is optimised for use with a punching bag in a gym. Punch impacts are used as natural triggers to advance the coaching flow. If you are testing without a punching bag, you can trigger the next turn by saying "next" or by repeating the last combination back to the coach.