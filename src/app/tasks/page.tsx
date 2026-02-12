import { getTasks } from '@/actions/tasks'
import TasksList from '@/components/tasks/TasksList'
import AddTaskForm from '@/components/tasks/AddTaskForm'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const tasks = await getTasks()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600 mt-1">Manage household tasks</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">All Tasks</h2>
          <TasksList tasks={tasks} />
        </div>

        <div>
          <AddTaskForm />
        </div>
      </div>
    </div>
  )
}
