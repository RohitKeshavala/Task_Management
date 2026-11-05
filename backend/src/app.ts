import express from 'express';
import cors from 'cors';
import { projectRouter } from './routes/projectRoutes.js';
import { taskRouter } from './routes/taskRoutes.js';
import { tagRouter } from './routes/tagRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'taskflow-backend',
      timestamp: new Date().toISOString(),
    });
  });

  // REST API Routes
  app.use('/api/projects', projectRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/tags', tagRouter);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

