# Generator CMS - Frontend

This is the frontend application for **Generator CMS**, an AI-powered tool for content and image generation. It provides a modern, responsive, and dynamic user interface built with React and Vite.

## Features

- **Intuitive UI:** Clean and responsive design using Tailwind CSS.
- **AI Content Dashboard:** Interfaces for rewriting, expanding, shortening, and generating full SEO articles.
- **AI Image Generator:** Interface to input prompts and view generated images.
- **History Tracking:** Dedicated views to see past generated content and images.
- **Authentication:** Protected routes for authenticated users only, with seamless login and signup flows.
- **Form Validation:** Robust client-side validation using React Hook Form and Zod.

## Tech Stack

- **Framework:** React 19, Vite
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router v7
- **State Management:** React Context API
- **Form Handling:** React Hook Form, Zod (resolvers)
- **HTTP Client:** Axios
- **Notifications:** React Toastify
- **Dates:** Moment.js

## Prerequisites

- Node.js (v18 or higher recommended)
- Running instance of the Generator CMS Backend

## Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```
*(Update the URL if your backend is running on a different port or host.)*

## Installation and Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The application will typically run on `http://localhost:5173`.*

## Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production into the `dist/` directory.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to find and fix code style issues.

## Project Structure Highlights

- `src/components/`: Reusable UI components.
- `src/page/`: Main page components mapping to routes (e.g., Dashboard, Login, Image Generation).
- `src/services/` & `src/api.js`: Axios configuration and API call wrappers.
- `src/context/`: React Context providers for global state (e.g., Authentication state).
- `src/utils/`: Helper functions and utilities.
- `src/constant.js`: Application-wide constants.

## Troubleshooting

- **CORS Issues / API Not Found:** Ensure your backend is running and `VITE_API_BASE_URL` in `.env` is correctly pointing to it.
- **Image/Content Generation Hangs:** The frontend has a configured timeout. If it hangs or times out, check the backend console for provider errors (e.g., Hugging Face or Gemini being overloaded).
