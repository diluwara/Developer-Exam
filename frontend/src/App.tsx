import { useEffect, useState } from 'react';
import { UserForm } from './components/UserForm';
import { UserList } from './components/UserList';

const API_URL = import.meta.env.VITE_API_URL;

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  department: string | null;
  created_at: string;
  posts: Post[];
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/users`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserCreated = () => {
    // Refresh the user list after creating a new user
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">User Management System</h1>
          <p className="mt-2 text-gray-600">
            Create and manage users with their posts
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <UserForm onUserCreated={handleUserCreated} />
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">All Users</h2>
            <UserList users={users} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
