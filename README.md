# 🥊 Cornerman AI

**Cornerman AI** — это ваш персональный боксерский тренер в реальном времени, работающий на базе **Gemini Live API**. Приложение анализирует ваши движения через камеру и дает голосовые команды, советы по технике и мотивацию прямо во время тренировки.

## 🌟 Основные возможности

-   **Голосовой коучинг в реальном времени**: Низкая задержка благодаря Gemini Live API (Multimodal).
-   **Визуальный анализ**: Тренер «видит» вас и корректирует стойку, удары и защиту.
-   **Интерактивные раунды**: Динамическая смена темпа и комбинаций.
-   **Безопасная авторизация**: Интеграция с Google OAuth 2.0.
-   **Облачная интеграция**: Поддержка Google Cloud Secret Manager для хранения ключей.

## 🛠 Технологический стек

-   **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion.
-   **Backend**: Node.js, Express, WebSockets (ws).
-   **AI**: Google Gemini Live API (`gemini-2.5-flash-native-audio-preview-09-2025`).
-   **Auth**: Google OAuth 2.0 + `cookie-session`.
-   **Infrastructure**: Docker, Google Cloud Run, Google Cloud Build.

## 🚀 Быстрый старт

### 1. Требования
- Node.js 22+
- Google Cloud Project с включенными API:
    - Generative Language API
    - Secret Manager API
    - Google Search (опционально)

### 2. Настройка переменных окружения (.env)
Создайте файл `.env` в корне проекта:
```env
GOOGLE_CLIENT_ID=ваш_client_id
GOOGLE_CLIENT_SECRET=ваш_client_secret
GEMINI_API_KEY=ваш_api_key
SESSION_SECRET=произвольная_строка
GOOGLE_CLOUD_PROJECT=ваш_project_id
APP_URL=http://localhost:3000
```

### 3. Установка и запуск
```bash
npm install
npm run dev
```

## ☁️ Деплой в Cloud Run

Приложение полностью готово к деплою через Cloud Build:
1. Настройте **Service Account** в Cloud Run.
2. Дайте ему роль `Secret Manager Secret Accessor`.
3. Добавьте секреты в Secret Manager с именами:
    - `GEMINI_API_KEY`
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `SESSION_SECRET`
4. Установите переменную окружения `APP_URL` в настройках Cloud Run.

## 🔒 Безопасность
Приложение использует `SameSite: none` и `Secure` куки для работы внутри iframe и корректно обрабатывает `trust proxy` для работы в облаке Google.
