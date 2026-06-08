import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import GuruProfile from './GuruProfile';
import SiswaProfile from './SiswaProfile';

export default function Profile() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(res => {
      const userData = res.data?.data || res.data;
      const fetchedRole = userData?.role || (Array.isArray(userData?.roles) ? userData.roles[0] : null);
      setRole((fetchedRole || localStorage.getItem("user_role") || "guru").toLowerCase());
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (role === 'siswa' || role === 'murid') {
    return <SiswaProfile />;
  }

  // Default to Guru Profile for guru and admin
  return <GuruProfile />;
}
