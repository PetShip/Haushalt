import { getActiveKids } from '@/actions/kids'
import { isPinRequired } from '@/lib/pin'
import KidsList from '@/components/kids/KidsList'
import AddKidForm from '@/components/kids/AddKidForm'
import PinProtectedContent from '@/components/PinProtectedContent'

export const dynamic = 'force-dynamic'

export default async function KidsPage() {
  const kids = await getActiveKids()
  const pinRequired = await isPinRequired()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kids</h1>
        <p className="text-gray-600 mt-1">Manage kids in your household</p>
      </div>

      <PinProtectedContent 
        pinRequired={pinRequired}
        readOnlyChildren={
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Active Kids</h2>
            <div className="space-y-2">
              {kids.map((kid) => (
                <div
                  key={kid.id}
                  className="p-4 rounded-lg border bg-white border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {kid.firstName}
                    </span>
                  </div>
                </div>
              ))}
              {kids.length === 0 && (
                <p className="text-gray-500">No active kids yet.</p>
              )}
            </div>
          </div>
        }
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Active Kids</h2>
            <KidsList kids={kids} />
          </div>

          <div>
            <AddKidForm />
          </div>
        </div>
      </PinProtectedContent>
    </div>
  )
}
