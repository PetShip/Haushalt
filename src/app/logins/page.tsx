import { getRecentLogins } from '@/actions/loginLogs'
import PinProtectedContent from '@/components/PinProtectedContent'

export const dynamic = 'force-dynamic'

export default async function LoginsPage() {
  const logins = await getRecentLogins(100)

  return (
    <PinProtectedContent>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Login History</h1>
          <p className="text-gray-600 mt-1">Track who has accessed the system</p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Agent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logins.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No login records found
                  </td>
                </tr>
              ) : (
                logins.map((login) => (
                  <tr key={login.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(login.createdAt).toLocaleString('de-DE', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {login.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-md">
                      {login.userAgent || 'Unknown'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {logins.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Showing the last {logins.length} login{logins.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </PinProtectedContent>
  )
}
