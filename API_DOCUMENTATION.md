# 📚 PDF Quiz Generator API Documentation

## Overview

The PDF Quiz Generator provides a comprehensive REST API for extracting quiz questions from PDF files and managing the exam workflow. The API includes security features like CSRF protection and input sanitization.

## Base URL

```text
http://localhost:5000
```

## Authentication & Security

### CSRF Protection

All POST endpoints require a valid CSRF token. Obtain a token from `/api/csrf-token` and include it in the `X-CSRF-Token` header.

### Input Sanitization

All user inputs are automatically sanitized to prevent XSS attacks.

## API Endpoints

### 🔐 Security Endpoints

#### GET /api/csrf-token

Generate a new CSRF token for form submissions.

**Response:**

```json
{
  "csrf_token": "abc123def456"
}
```

### 📁 File Management Endpoints

#### GET /api/sample-files

Retrieve list of available sample PDF files.

**Response:**

```json
{
  "status": "success",
  "files": [
    {
      "name": "CHSL-1.pdf",
      "path": "resources/CHSL-1.pdf",
      "size": 12345
    }
  ]
}
```

#### POST /api/upload

Upload custom files for question extraction.

**Headers:**

- `X-CSRF-Token`: Valid CSRF token
- `Content-Type`: `multipart/form-data`

**Form Data:**

- `files`: File(s) to upload

**Response:**

```json
{
  "status": "success",
  "uploaded_files": ["file1.pdf", "file2.pdf"]
}
```

#### GET /api/preview-samples

Preview content of sample files before extraction.

**Response:**

```json
{
  "status": "success",
  "previews": [
    {
      "filename": "CHSL-1.pdf",
      "preview": "Sample text content...",
      "page_count": 5
    }
  ]
}
```

### ⚙️ Extraction Endpoints

#### POST /api/start-extraction

Start the question extraction process from uploaded files.

**Headers:**

- `X-CSRF-Token`: Valid CSRF token
- `Content-Type`: `application/json`

**Request Body:**

```json
{
  "files": ["CHSL-1.pdf", "CHSL-2.pdf"],
  "options": {
    "question_count": 20,
    "difficulty": "medium",
    "include_answers": true
  }
}
```

**Response:**

```json
{
  "status": "success",
  "extraction_id": "ext_123456",
  "message": "Extraction started successfully"
}
```

#### GET /api/extraction-progress

Get the current progress of question extraction.

**Response:**

```json
{
  "status": "processing",
  "progress": 75,
  "message": "Processing page 15 of 20...",
  "current_file": "CHSL-1.pdf"
}
```

### 📝 Quiz Management Endpoints

#### GET /api/questions

Retrieve extracted questions for the exam interface.

**Response:**

```json
{
  "status": "success",
  "questions": [
    {
      "id": "q1",
      "text": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correct": "B",
      "explanation": "Paris is the capital and largest city of France."
    }
  ],
  "source": "PDF files"
}
```

#### POST /api/submit

Submit exam answers for grading.

**Headers:**

- `X-CSRF-Token`: Valid CSRF token
- `Content-Type`: `application/json`

**Request Body:**

```json
{
  "answers": {
    "q1": "2",
    "q2": "1"
  },
  "time_taken": 1800,
  "marked_questions": ["q3", "q5"]
}
```

**Response:**

```json
{
  "status": "success",
  "total": 20,
  "correct": 15,
  "incorrect": 3,
  "unattempted": 2,
  "percentage": 75,
  "grade": "B",
  "time_taken": 1800
}
```

#### POST /api/regenerate

Regenerate questions with different parameters.

**Headers:**

- `X-CSRF-Token`: Valid CSRF token
- `Content-Type`: `application/json`

**Request Body:**

```json
{
  "options": {
    "question_count": 25,
    "difficulty": "hard",
    "shuffle": true
  }
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Questions regenerated successfully"
}
```

### 🎨 Static Assets

#### GET /styles.css

Serve the main CSS stylesheet with dark mode support.

#### GET /script_api.js

Serve the main JavaScript file with all client-side functionality.

#### GET /file-selector.js

Serve the file selection JavaScript utilities.

## Error Responses

All endpoints return standardized error responses:

```json
{
  "status": "error",
  "message": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `INVALID_CSRF_TOKEN`: CSRF token missing or invalid
- `FILE_NOT_FOUND`: Requested file does not exist
- `EXTRACTION_FAILED`: Question extraction process failed
- `INVALID_INPUT`: Input validation failed
- `SERVER_ERROR`: Internal server error

## Rate Limiting

- API endpoints are rate-limited to prevent abuse
- CSRF tokens expire after 1 hour
- File uploads limited to 10MB per file

## Data Formats

### Question Format

```json
{
  "id": "string",
  "text": "string",
  "options": ["string"],
  "correct": "string (A/B/C/D)",
  "explanation": "string (optional)"
}
```

### File Format

```json
{
  "name": "string",
  "path": "string",
  "size": "number",
  "type": "string"
}
```

## WebSocket Support

The API supports real-time progress updates via WebSocket connections for long-running extraction processes.

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security Features

- **CSRF Protection**: All forms protected with tokens
- **Input Sanitization**: XSS prevention
- **CORS Configuration**: Cross-origin request handling
- **Secure Headers**: Security headers implemented
- **File Validation**: Uploaded files validated for type and size

## Performance Optimizations

- **Lazy Loading**: Questions loaded in batches
- **Caching**: Static assets cached with service worker
- **Compression**: Responses compressed for faster loading
- **Async Processing**: Non-blocking extraction processes

## Accessibility Features

- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus indicators
- **Semantic HTML**: Proper document structure

## Error Handling

- **Global Error Boundaries**: Comprehensive error catching
- **User-Friendly Messages**: Clear error communication
- **Graceful Degradation**: App continues working despite errors
- **Debug Logging**: Detailed error logging for developers
