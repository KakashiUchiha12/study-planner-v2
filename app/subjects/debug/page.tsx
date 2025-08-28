"use client"

import { useSession } from 'next-auth/react'
import { useSubjects } from '@/hooks/useSubjects'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const { subjects, loading, error, createSubject } = useSubjects()

  const handleTestCreate = async () => {
    try {
      const result = await createSubject({
        name: 'Test Subject',
        color: '#FF0000',
        description: 'Test Description'
      })
      console.log('Subject created:', result)
    } catch (error) {
      console.error('Failed to create subject:', error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Session Information</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Session:</strong> {session ? 'Yes' : 'No'}</p>
            {session?.user && (
              <>
                <p><strong>User ID:</strong> {(session.user as any).id || 'Not found'}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Name:</strong> {session.user.name}</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Subjects Hook</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>Subjects Count:</strong> {subjects.length}</p>
          </div>
          <button
            onClick={handleTestCreate}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Create Subject
          </button>
        </div>
      </div>

      <div className="mt-6 bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Subjects List</h2>
        {subjects.length > 0 ? (
          <ul className="space-y-2">
            {subjects.map(subject => (
              <li key={subject.id} className="p-2 bg-muted rounded">
                {subject.name} - {subject.description}
              </li>
            ))}
          </ul>
        ) : (
          <p>No subjects found</p>
        )}
      </div>
    </div>
  )
}
