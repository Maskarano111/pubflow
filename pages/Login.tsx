import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDb } from '../context/FirebaseContext';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { Staff, StaffRole } from '../types';
import { useAuth } from '../context/AuthContext';
import * as firestoreService from '../services/firestoreService';

const roleToHome: Record<StaffRole, string> = {
  superadmin: '/admin/dashboard',
  admin: '/admin/dashboard',
  counter: '/counter/dashboard',
  waiter: '/waiter/dashboard',
};

const LoginPage: React.FC = () => {
  const { role } = useParams<{ role: StaffRole }>();
  const db = useDb();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canCreateAdmin, setCanCreateAdmin] = useState(false);
  const [canCreateSuper, setCanCreateSuper] = useState(false);

  const resolvedRole: StaffRole | null = role === 'superadmin' || role === 'admin' || role === 'counter' || role === 'waiter' ? role : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!resolvedRole) {
      setError('Unknown role.');
      return;
    }
    try {
      setLoading(true);
      const staffQ = query(
        collection(db, 'staff'),
        where('email', '==', email.trim().toLowerCase())
      );
      const snap = await getDocs(staffQ);
      if (snap.empty) {
        if (resolvedRole === 'admin') {
          // Admin self-create disabled; require an existing admin or superadmin to add the account
          setCanCreateAdmin(false);
          setError('No admin account found for this email. Ask an existing admin or super admin to create one for you.');
        } else if (resolvedRole === 'superadmin') {
          // Only allow creating superadmin if none exists in the system
          const superQ = query(collection(db, 'staff'), where('role', '==', 'superadmin'), limit(1));
          const superSnap = await getDocs(superQ);
          if (superSnap.empty) {
            setCanCreateSuper(true);
            setError('No super admin exists. You can create the first super admin below.');
          } else {
            setError('No account found for this email.');
          }
        } else {
          setError('No account found for this email.');
        }
      } else {
        const doc = snap.docs[0];
        const data = doc.data() as Staff;
        if (data.role !== resolvedRole) {
          setError(`This email belongs to a ${data.role} account.`);
        } else if (data.active === false) {
          setError('This staff account is suspended. Contact an admin.');
        } else {
          login({ id: doc.id, email: data.email, role: data.role, name: data.name });
          navigate(roleToHome[data.role], { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onCreateSuper = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!resolvedRole || resolvedRole !== 'superadmin') return;
      // Double-check existence to be safe
      const superQ = query(collection(db, 'staff'), where('role', '==', 'superadmin'), limit(1));
      const superSnap = await getDocs(superQ);
      if (!superSnap.empty) {
        setError('A super admin already exists.');
        setCanCreateSuper(false);
        return;
      }
      const normalized = email.trim().toLowerCase();
      const added = await firestoreService.addStaff(db, {
        name: 'Super Admin',
        email: normalized,
        role: 'superadmin'
      });
      // Auto-login after creation
      login({ id: added.id, email: normalized, role: 'superadmin', name: 'Super Admin' });
      setCanCreateSuper(false);
      navigate(roleToHome['superadmin'], { replace: true });
    } catch (err) {
      console.error(err);
      setError('Could not create super admin.');
    } finally {
      setLoading(false);
    }
  };

  // Admin self-create intentionally disabled. Accounts must be created by an existing admin or super admin.

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 p-6">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">{resolvedRole ? `${resolvedRole[0].toUpperCase()}${resolvedRole.slice(1)} Login` : 'Login'}</h1>
        <p className="text-sm text-gray-400 mb-6">Enter your work email to continue.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            className="w-full p-3 bg-slate-700 rounded-lg text-gray-100"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
        {/* Admin self-create disabled; no button shown. */}
        {canCreateSuper && resolvedRole === 'superadmin' && (
          <button
            type="button"
            onClick={onCreateSuper}
            disabled={loading || !email}
            className="w-full bg-purple-700 text-white font-bold py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Creating super admin...' : 'Create Super Admin and Continue'}
          </button>
        )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">Back</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
