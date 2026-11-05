import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { TaskFlowService } from './taskflow.service';

/**
 * Angular HTTP interceptor transmitting the current simulated user role
 * in the `x-user-role` header with every outgoing request.
 */
export const authRoleInterceptor: HttpInterceptorFn = (req, next) => {
  const taskflowService = inject(TaskFlowService);
  const currentRole = taskflowService.activeRole();
  const token = taskflowService.authToken();

  const headers: Record<string, string> = {
    'x-user-role': currentRole,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const clonedRequest = req.clone({
    setHeaders: headers,
  });

  return next(clonedRequest);
};

