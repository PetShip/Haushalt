import { getTasksWithKids } from '@/actions/tasks'
import { getActiveKids } from '@/actions/kids'
import { isPinRequired } from '@/lib/pin'
import TasksList from '@/components/tasks/TasksList'
import AddTaskForm from '@/components/tasks/AddTaskForm'
import PinProtectedContent from '@/components/PinProtectedContent'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const tasks = await getTasksWithKids()
  const kids = await getActiveKids()
  const pinRequired = await isPinRequired()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600 mt-1">Manage household tasks</p>
      </div>

      <PinProtectedContent 
        pinRequired={pinRequired}
        readOnlyChildren={
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">All Tasks</h2>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border ${
                    task.isActive ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={task.isActive ? 'font-medium' : 'text-gray-500'}>
                      {task.title}
                    </span>
                    <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                      {task.group === 'REGULAR' ? 'Regular' : '10-Min'}
                    </span>
                    {!task.isActive && (
                      <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-gray-500">No tasks yet.</p>
              )}
            </div>
          </div>
        }
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold mb-4">All Tasks</h2>
            <TasksList tasks={tasks} kids={kids} />
          </div>

          <div>
            <AddTaskForm kids={kids} />
          </div>
        </div>
      </PinProtectedContent>
    </div>
  )
}
