import { NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';

// DELETE /api/kanban/tasks/[taskId] - Delete a task
export async function DELETE(request, { params }) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const session = neo4jService.getSession();

    try {
      // Delete task (verify ownership)
      const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:HAS_TASK]->(t:Task {id: $taskId})
        DETACH DELETE t
        RETURN count(t) as deleted
        `,
        { userId, taskId }
      );

      const deleted = result.records[0].get('deleted').toNumber();

      if (deleted === 0) {
        return NextResponse.json(
          { error: 'Task not found or not authorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
