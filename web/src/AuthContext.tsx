import { createContext, useState, useEffect, type ReactNode } from 'react';
import { client } from './api';

interface UserProfile {
  id: string;
  username: string;
  role: string;
}

interface AuthContext {
  is_admin: boolean;
  user: UserProfile | null;
  is_loading: boolean;
  login: (user_data: UserProfile) => void;
  logout: () => void;
  check_auth: () => Promise<void>;
}

export const auth_context = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, set_user] = useState<UserProfile | null>(null);
  const [is_admin, set_is_admin] = useState<boolean>(false);
  const [is_loading, set_is_loading] = useState<boolean>(true);

	async function check_auth() {
		set_is_loading(true);
		
		try {
			const res = await client.GET('/auth/me');

			if (res.error || !res.data) {
				set_user(null);
				set_is_admin(false);
			} else {
				set_user(res.data);
				set_is_admin(res.data.role === 'admin');
			}
		} catch (err) {
			set_user(null);
			set_is_admin(false);
		} finally {
			set_is_loading(false);
		}
	}

	useEffect(() => {
		check_auth();
	}, []);

  const login = (user_data: UserProfile) => {
    set_user(user_data);
    set_is_admin(user_data.role === 'admin');
    set_is_loading(false);
  };

  const logout = async () => {
    set_is_loading(true);
    try {
      await client.POST('/auth/logout');
    } catch (err) {
      console.error('Failed to logout on backend:', err);
    } finally {
      set_user(null);
      set_is_admin(false);
      set_is_loading(false);
    }
  };

  return (
    <auth_context.Provider value={{ is_admin, user, is_loading, login, logout, check_auth }}>
      {children}
    </auth_context.Provider>
  );
}
