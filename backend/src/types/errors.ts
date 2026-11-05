export class AppError extends Error {
  statusCode: number;
  extra?: Record<string, any>;

  constructor(message: string, statusCode: number = 400, extra?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.extra = extra;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CircularDependencyError extends AppError {
  cyclePath: string[];

  constructor(cyclePath: string[]) {
    const pathStr = cyclePath.join(' -> ');
    const message = `Circular dependency detected: ${pathStr}`;
    super(message, 400, { cyclePath, error: 'Circular dependency detected' });
    this.name = 'CircularDependencyError';
    this.cyclePath = cyclePath;
    Object.setPrototypeOf(this, CircularDependencyError.prototype);
  }
}

export class StatusGuardError extends AppError {
  blockingTasks: any[];

  constructor(targetStatus: string, blockingTasks: any[]) {
    const list = blockingTasks.map(t => `${t.id} (${t.status})`).join(', ');
    const message = `Cannot transition task to ${targetStatus}: prerequisite task(s) not in DONE status: ${list}`;
    super(message, 400, { blockingTasks, error: 'Status transition blocked by unfinished prerequisites' });
    this.name = 'StatusGuardError';
    this.blockingTasks = blockingTasks;
    Object.setPrototypeOf(this, StatusGuardError.prototype);
  }
}

