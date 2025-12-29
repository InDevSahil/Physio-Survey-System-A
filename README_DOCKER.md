# Physio AI Doctor - Installation & Usage

## Option 1: Run with Docker (Recommended)
Calculated to be the easiest method for portability.

1. Install Docker Desktop.
2. Open a terminal in this folder.
3. Run:
   ```bash
   docker-compose up --build
   ```
4. Open browser to `http://localhost:3000`.

## Option 2: Run Locally (Node.js)
If you don't have Docker:

1. Install Node.js (v14+).
2. Open terminal in this folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start server:
   ```bash
   node server.js
   ```
5. Open browser to `http://localhost:3000`.
