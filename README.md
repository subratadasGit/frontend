# Generator CMS - Frontend

This is the frontend application for **Generator CMS**, an AI-powered tool for content and image generation. It provides a modern, responsive, and dynamic user interface built with React and Vite.

## Features

- **Intuitive UI:** Clean and responsive design using Tailwind CSS.
- **AI Content Dashboard:** Interfaces for rewriting, expanding, shortening, humanizing, and generating full SEO articles.
- **Humanizer:** Rewrites machine-drafted prose into a natural voice — varied sentence length, no stock transitions or hedging. It is a better draft, not a guarantee about any AI detector's score.
- **AI Image Generator:** Interface to input prompts and view generated images.
- **Image Editor:** Crop (free or locked ratio), rotate, flip, one-click looks and eight adjustment sliders on a canvas, then export as PNG, JPG, JPEG or WEBP with quality and scale controls. Runs entirely in the browser; the stored original is never modified.
- **File Toolkit:** Merge PDFs, split a PDF (per page, fixed chunks, or named ranges), convert between formats — images (PNG/JPG/JPEG/WEBP/PDF), PDFs (per-page images or extracted text), and text or data files (TXT/MD/HTML/CSV/TSV/JSON/RTF/PDF) — compress images (by quality or to a byte target) and PDFs (rasterise + re-encode, for scanned/image-heavy documents), and generate QR codes (text, URL, Wi-Fi, email, SMS, phone, vCard) and barcodes (Code 128, EAN-13/8, UPC-A, Code 39, ITF-14, MSI, Pharmacode, Codabar). All client-side; nothing is uploaded.
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
- **Documents:** `pdf-lib` (writing PDFs), `pdfjs-dist` (reading and rasterising PDFs)
- **Codes:** `qrcode` (QR generation), `jsbarcode` (linear barcode generation)

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
- `src/page/tools/`: The client-side file toolkit (merge, split, convert).
- `src/utils/`: Helper functions and utilities, including `imageEditing.js` (canvas
  pipeline behind the image editor), `fileTools.js` (PDF and format conversion),
  `pdfCompression.js` / `imageCompression.js` (the two compressors), and
  `qrTools.js` / `barcodeTools.js` (code generation).
- `src/constant.js`: Application-wide constants.

## Troubleshooting

- **CORS Issues / API Not Found:** Ensure your backend is running and `VITE_API_BASE_URL` in `.env` is correctly pointing to it.
- **Image/Content Generation Hangs:** The frontend has a configured timeout. If it hangs or times out, check the backend console for provider errors (e.g., Hugging Face or Gemini being overloaded).
- **PDF-to-image conversion appears stuck:** rendering is driven by animation frames, which browsers pause for background tabs. Keep the tab in the foreground while a large PDF rasterises.
- **A file will not convert:** the converter handles images, PDFs, and text or data files. Office formats (DOCX, XLSX, PPTX) are not supported — they need a server-side converter.
- **Compressing a PDF made it bigger:** PDF compression works by rasterising each page to a JPEG — it shrinks scanned or image-heavy documents dramatically, but a text-based PDF is usually already small, and rasterising it can make it larger. The tool says so rather than hiding it; keep the original in that case.
