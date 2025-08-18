import { requireAuth } from '@/lib/auth/session'
import { userOperations } from '@/lib/db/operations'
import UserProfileForm from '@/components/profile/user-profile-form'

export default async function ProfilePage() {
  const currentUser = await requireAuth()
  
  // Get full user data from database
  const user = await userOperations.findById(currentUser.id)
  
  if (!user) {
    throw new Error('User not found')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8">
            <div className="flex items-center space-x-6">
              <img
                src={user.avatar || '/default-avatar.png'}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <p className="text-orange-100">{user.email}</p>
                <p className="text-orange-200 text-sm mt-1">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <UserProfileForm user={user} />
          </div>
        </div>
      </div>
    </div>
  )
}
