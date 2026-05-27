import { useEffect, useState } from 'react';
import { Users, Trash2, Shield, User } from 'lucide-react';
import { fetchUsers, deleteUser } from '@/lib/api';
import { useAuth } from '@/app/contexts/AuthContext';

interface AppUser {
  id: string;
  email: string;
  is_manager: boolean;
  created_at: string;
}

export function ManagerTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError('Failed to load users. Is the backend running?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError('Failed to delete user. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Manager Dashboard</h2>
        <p className="text-sm text-gray-500">View and manage user accounts</p>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">User Accounts</h3>
            {!loading && (
              <span className="text-sm text-gray-400">({users.length} total)</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Passwords are encrypted and cannot be displayed. To reset a password, delete the account and ask the user to sign up again.
          </p>
        </div>

        {error && (
          <div className="m-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No accounts yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    u.is_manager ? 'bg-[#C9A961]/20' : 'bg-gray-100'
                  }`}
                >
                  {u.is_manager ? (
                    <Shield className="w-4 h-4 text-[#C9A961]" />
                  ) : (
                    <User className="w-4 h-4 text-gray-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400">
                    {u.is_manager ? 'Manager' : 'User'} · Joined{' '}
                    {new Date(u.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Can't delete yourself or other managers */}
                {!u.is_manager && u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id}
                    title="Delete account"
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
