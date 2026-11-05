import { createApp } from './app.js';
import { initDatabase } from './db/database.js';

const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

const app = createApp();

app.listen(PORT, () => {
  console.log(`[TaskFlow Backend] Server running on http://localhost:${PORT}`);
  console.log(`[TaskFlow Backend] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[TaskFlow Backend] Projects API: http://localhost:${PORT}/api/projects`);
  console.log(`[TaskFlow Backend] Tasks API:    http://localhost:${PORT}/api/tasks`);
});

