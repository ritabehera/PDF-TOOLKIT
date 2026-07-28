# PDF AI Toolkit - Modern AI-Powered PDF & Document Suite

A professional, responsive, and modern **PDF Toolkit Web Application** built with Node.js, Express, PDF-Lib, Tesseract.js OCR, Sharp, PDF.js, and an intelligent AI document processing engine.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Express](https://img.shields.io/badge/express-4.19.2-lightgrey.svg)

---

## ✨ Key Features

### 🛠️ Basic PDF Tools
- **Merge PDF**: Combine multiple PDF files into one.
- **Split PDF**: Extract page ranges or single pages.
- **Rotate PDF**: Rotate pages by 90°, 180°, or 270°.
- **Compress PDF**: Optimize streams and flatten objects to reduce file size.
- **Watermark PDF**: Apply custom text or confidential overlays.
- **Header & Footer**: Insert page numbers (`Page X of Y`) and headers.
- **Organize Pages**: Delete, reorder, or duplicate pages.
- **Security**: Lock & Encrypt PDF with password protection or decrypt unlocked files.

### 🤖 AI Intelligence Engine
- **AI PDF Summary**: Sentence ranking algorithms, reading time estimates, and executive bullet points.
- **AI Explain PDF**: Simplify technical terms into plain English.
- **AI Chat with PDF**: Interactive Q&A over document text with semantic matching.
- **AI Flashcards & Quiz Generator**: Automatically build study cards and multiple-choice quizzes.
- **AI Document Analyzers**: Specialized extraction for **Resumes**, **Invoices**, and **Legal Contracts**.

### 🔍 OCR & Format Conversions
- **Image to Text OCR**: Multi-language text recognition powered by Tesseract.js.
- **Searchable PDF Generator**: Convert scanned images into searchable PDF documents.
- **Format Converter**: JPG/PNG Images to PDF, PDF to Text, and PDF to HTML.

### 🎨 Canvas Annotation & Digital Signatures
- Freehand drawing tool with custom color pickers and width sliders.
- Highlighter and text tool.
- Digital signature modal with canvas signature capture and PDF stamping.

### 💻 Modern UI & Dashboards
- **Glassmorphic UI**: Dark & Light theme toggle, custom cursor effects, toast notifications, and micro-animations.
- **Voice Commands**: Web Speech API assistant integration.
- **Dashboards**: Usage metrics, recent activity logs, and admin server diagnostics.
- **PWA Offline Support**: Service Worker caching and Web Manifest.

---

## 📁 Repository Structure

```
PDF TOOLKIT/
├── config/             # DB & server configurations
├── controllers/        # Express route logic
├── middleware/         # Auth, upload, rate limiters, error handler
├── models/             # Data models (User, FileRecord, History, Favorite, AILog)
├── public/             # Glassmorphism SPA (HTML, CSS, JS modules, Service Worker)
├── routes/             # REST API routers
├── services/           # PDF-Lib, AI processing, OCR, and Conversion services
├── utils/              # Logger & file helpers
├── package.json
└── server.js           # Main Express server entry point
```

---

## 🚀 Quick Start (Local Setup)

1. **Clone Repository**:
   ```bash
   git clone https://github.com/ritabehera/PDF-TOOLKIT.git
   cd PDF-TOOLKIT
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Application**:
   ```bash
   npm start
   ```

4. **Access in Browser**:
   Open [http://localhost:3000](http://localhost:3000)

---

## 📄 License
This project is licensed under the MIT License.
