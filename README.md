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
-   **Infrastructure**: Docker, Google Cloud Run, Google Cloud Build, Terraform.

## 🏗 Architecture

Detailed architectural documentation, including C4 Model diagrams, can be found in the **[docs folder](./docs/README.md)**.

## 🚀 Quick Start (Local Development)

### 1. Requirements
- Node.js 22+
- Google Cloud Project with enabled APIs:
    - Generative Language API
    - Secret Manager API

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
Access the app at `http://localhost:3000`.

## ☁️ Deployment from Scratch (Google Cloud)

Follow these steps to deploy Cornerman AI to your own Google Cloud environment using Terraform and Cloud Build.

### 1. Manual Secret Generation

Before running Terraform, you must manually obtain your API credentials:

*   **Gemini API Key**:
    1.  Go to **[Google AI Studio](https://aistudio.google.com/)**.
    2.  Follow the [official instructions](https://ai.google.dev/gemini-api/docs/api-key) to generate an API key.

*   **Google OAuth 2.0 Credentials**:
    1.  Follow the [Google Cloud OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2/web-server).
    2.  Create an **OAuth Client ID** for a "Web Application".
    3.  Set the **Authorized Redirect URI** to `https://<YOUR_APP_URL>/auth/google/callback`.
    4.  Note down your **Client ID** and **Client Secret**.

### 2. Setup Infrastructure with Terraform

#### Prerequisites
* Install [Terraform](https://developer.hashicorp.com/terraform/downloads) and [gcloud CLI](https://cloud.google.com/sdk/docs/install).

#### Execution steps:

1. **Login to Google Cloud**:
   ```sh
   gcloud auth application-default login
   gcloud config set project <YOUR_PROJECT_ID>
   ```

2. **Enable Required APIs**:
   ```sh
   gcloud services enable cloudbuild.googleapis.com \
     secretmanager.googleapis.com \
     run.googleapis.com \
     cloudresourcemanager.googleapis.com \
     iam.googleapis.com \
     artifactregistry.googleapis.com
   ```

3. **Configure Terraform Variables**:
   Update `iac/terraform.tfvars` with your project details. Use `europe-west1` or your preferred region.

4. **Bootstrap & Migrate State**:
   Because Terraform needs a bucket to store its state, but we are using Terraform to *create* that bucket:

   a. **First Run (Local State)**:
      Open `iac/backend.tf` and temporarily **comment out** the `terraform { backend "gcs" { ... } }` block.
      ```sh
      cd iac
      terraform init
      terraform apply
      ```

   b. **Migrate to Cloud State**:
      **Uncomment** the backend block in `iac/backend.tf` and run:
      ```sh
      terraform init -migrate-state
      ```

### 3. Store Secrets in Secret Manager

Terraform creates the secret containers, but they are empty. You must add the actual values:
1. Go to the [Secret Manager Console](https://console.cloud.google.com/security/secret-manager).
2. For `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET`:
   - Click the secret name.
   - Click **Create New Version**.
   - Paste the corresponding value and save.

### 4. Deploy the Application

Deployment is triggered by pushing a Git tag:

1. **Create and push a tag**:
   ```sh
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Monitor Build**:
   Check the [Cloud Build Dashboard](https://console.cloud.google.com/cloud-build/builds). Once finished, your app will be live on Cloud Run.

## 🔒 Security
The application uses `SameSite: none` and `Secure` cookies to work within an iframe and correctly handles `trust proxy` for working in the Google Cloud environment.

## 🥊 Pro Tip
⚠️ This version is optimized for use with a punching bag. Punch impacts are used as natural triggers. If testing without a bag, you can say "next" or repeat the combination to the coach to advance the flow.
