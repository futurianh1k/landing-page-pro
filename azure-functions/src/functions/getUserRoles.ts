/**
 * Get User Roles Azure Function
 * Returns roles for the authenticated user
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../middleware/auth';
import { query } from '../lib/database';

export async function getUserRoles(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = await requireAuth(request, context);
    context.log(`[GetUserRoles] User: ${user.userId}`);

    const rows = await query<{ role: string }>(
      'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role',
      [user.userId]
    );

    return {
      status: 200,
      jsonBody: {
        success: true,
        roles: rows.map((row) => row.role),
      },
    };
  } catch (error) {
    context.error('[GetUserRoles] Error:', error);
    if (error instanceof Error && error.message == 'Unauthorized') {
      return { status: 401, jsonBody: { success: false, error: 'Unauthorized' } };
    }
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

app.http('getUserRoles', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'user/roles',
  handler: getUserRoles,
});
