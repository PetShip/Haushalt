import { getKids } from '@/actions/kids'
import KidsList from '@/components/kids/KidsList'
import AddKidForm from '@/components/kids/AddKidForm'

export const dynamic = 'force-dynamic'

export default async function KidsPage() {
  const kids = await getKids()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kids</h1>
        <p className="text-gray-600 mt-1">Manage kids in your household</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">All Kids</h2>
          <KidsList kids={kids} />
        </div>

        <div>
          <AddKidForm />
        </div>
      </div>
    </div>
  )
}
