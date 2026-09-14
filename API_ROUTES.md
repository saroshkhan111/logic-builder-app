# 📡 Logic Builder App - Project API Routes

**Created:** 2026-09-14  
**Status:** ✅ Complete

## Overview

RESTful API endpoints for managing Logic Builder projects with authentication and authorization.

## 🔒 Authentication

All endpoints require authentication via NextAuth.js v5 JWT session. Requests without valid sessions return `401 Unauthorized`.

## 📍 Endpoints

### `/api/projects`

#### `GET` - List User's Projects

Retrieves all projects belonging to the authenticated user.

**Request:**
```http
GET /api/projects
Authorization: Required (Session)
```

**Response (200):**
```json
[
  {
    "id": "clxxx...",
    "userId": "user123",
    "title": "Calculate Grade Average",
    "problemStatement": "Given student grades, calculate average",
    "inputs": [{ "name": "grades", "type": "array" }],
    "outputs": [{ "name": "average", "type": "number" }],
    "rules": ["All grades must be 0-100"],
    "algorithm": "INPUT grades\nSUM = 0...",
    "pythonCode": "def calculate_average(grades):\n    ...",
    "testCases": [{ "input": [85, 90, 78], "expected": 84.33 }],
    "completedSteps": 5,
    "isPublic": false,
    "createdAt": "2026-09-14T00:00:00.000Z",
    "updatedAt": "2026-09-14T01:30:00.000Z"
  }
]
```

#### `POST` - Create New Project

Creates a new project for the authenticated user.

**Request:**
```http
POST /api/projects
Content-Type: application/json
Authorization: Required (Session)
```

**Body (all fields optional):**
```json
{
  "title": "New Logic Problem",
  "problemStatement": "Describe the problem here",
  "inputs": [{ "name": "x", "type": "number" }],
  "outputs": [{ "name": "result", "type": "number" }],
  "rules": ["Rule 1", "Rule 2"],
  "completedSteps": 3,
  "isPublic": false
}
```

**Response (201):** Returns created project with all fields.

---

### `/api/projects/[id]`

#### `GET` - Get Single Project
Retrieves a specific project by ID. Users can access their own projects or public projects.

#### `PUT` - Update Project
Updates a project. Only the owner can update. Provide only fields to update.

#### `DELETE` - Delete Project
Deletes a project. Only the owner can delete.

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Access denied
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Database error

## 📊 Project Schema

```typescript
interface Project {
  id: string;
  userId: string;
  title: string;
  problemStatement: string;
  inputs: Json;
  outputs: Json;
  rules: Json;
  algorithm: string | null;
  pythonCode: string | null;
  testCases: Json | null;
  completedSteps: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
