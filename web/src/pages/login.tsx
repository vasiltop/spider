import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../api';
import { auth_context } from '../AuthContext';

type AuthMode = 'login' | 'register';

function LoginPage() {
	const [mode, set_mode] = useState<AuthMode>('login');
	const [username, set_username] = useState('');
	const [password, set_password] = useState('');
	const [is_submitting, set_is_submitting] = useState(false);
	const [error_message, set_error_message] = useState('');
	const [success_message, set_success_message] = useState('');

	const auth = useContext(auth_context);
	if (!auth) return (<> loading </>);
	const { login } = auth;

	const navigate = useNavigate();

	const handle_mode_change = (new_mode: AuthMode) => {
		set_mode(new_mode);
		set_error_message('');
		set_success_message('');
	};

	const handle_auth = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		set_is_submitting(true);
		set_error_message('');
		set_success_message('');

		const trimmed_username = username.trim();
		const trimmed_password = password.trim();

		if (!trimmed_username || !trimmed_password) {
			set_error_message('Please fill in all fields.');
			set_is_submitting(false);
			return;
		}

		if (mode === 'register') {
			if (trimmed_username.length < 3 || trimmed_username.length > 31) {
				set_error_message('Username must be between 3 and 31 characters.');
				set_is_submitting(false);
				return;
			}
			if (!/^[a-zA-Z0-9_]+$/.test(trimmed_username)) {
				set_error_message('Username can only contain letters, numbers, and underscores.');
				set_is_submitting(false);
				return;
			}
			if (trimmed_password.length < 8) {
				set_error_message('Password must be at least 8 characters long.');
				set_is_submitting(false);
				return;
			}
		}

		try {
			const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
			const { data, error } = await client.POST(endpoint, {
				body: { username: trimmed_username, password: trimmed_password }
			});

			if (error) {
				set_error_message(`Error: ${error.error || 'Authentication failed'}`);
				set_is_submitting(false);
			} else if (data) {
				const msg = mode === 'login'
					? 'Logged in successfully! Redirecting...'
					: 'Account created successfully! Redirecting...';


				login(data);
				set_success_message(msg);
				set_username('');
				set_password('');
				navigate('/');
			}
		} catch (e: any) {
			set_error_message(`Error: ${e.message || 'Internal server error'}`);
			set_is_submitting(false);
		}
	};

	return (
		<div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto w-full max-w-md">
				<h1 className="text-3xl font-bold text-gray-900 text-center">
				{mode === 'login'
					? 'Login'
					: 'Register'}
				</h1>
			</div>

			<div className="mt-8 sm:mx-auto w-full max-w-md">
				<div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">

					<div className="flex border-b border-gray-200 bg-gray-50">
						<button
							type="button"
							onClick={() => handle_mode_change('login')}
							disabled={is_submitting}
							className={`flex-1 py-3 text-center text-sm font-medium focus:outline-none transition-colors border-b-2 ${mode === 'login'
									? 'border-blue-600 text-blue-600 bg-white'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
								}`}
						>
							Sign In
						</button>
						<button
							type="button"
							onClick={() => handle_mode_change('register')}
							disabled={is_submitting}
							className={`flex-1 py-3 text-center text-sm font-medium focus:outline-none transition-colors border-b-2 ${mode === 'register'
									? 'border-blue-600 text-blue-600 bg-white'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
								}`}
						>
							Create Account
						</button>
					</div>

					<div className="px-4 py-6 sm:p-6">
						<form onSubmit={handle_auth} className="space-y-5">
							<div>
								<label htmlFor="username" className="block text-sm font-medium text-gray-700">
									Username
								</label>
								<div className="mt-1">
									<input
										id="username"
										name="username"
										type="text"
										required
										autoComplete="username"
										className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
										placeholder="admin"
										value={username}
										onChange={(e) => set_username(e.target.value)}
										disabled={is_submitting}
									/>
								</div>
								{mode === 'register' && (
									<p className="mt-1 text-xs text-gray-400">
										3-31 characters. Letters, numbers, and underscores only.
									</p>
								)}
							</div>

							<div>
								<label htmlFor="password" className="block text-sm font-medium text-gray-700">
									Password
								</label>
								<div className="mt-1">
									<input
										id="password"
										name="password"
										type="password"
										required
										autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
										className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
										placeholder="••••••••"
										value={password}
										onChange={(e) => set_password(e.target.value)}
										disabled={is_submitting}
									/>
								</div>
								{mode === 'register' && (
									<p className="mt-1 text-xs text-gray-400">
										Minimum 8 characters.
									</p>
								)}
							</div>

							{(error_message || success_message) && (
								<div className="text-sm mt-2 p-2 rounded bg-gray-50 border border-gray-100">
									{error_message && <span className="text-red-600 block break-all">{error_message}</span>}
									{success_message && <span className="text-green-600 block">{success_message}</span>}
								</div>
							)}

							<div className="pt-2">
								<button
									type="submit"
									disabled={is_submitting || !username.trim() || !password.trim()}
									className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
								>
									{is_submitting
										? (mode === 'login' ? 'Signing in...' : 'Registering...')
										: (mode === 'login' ? 'Sign In' : 'Register Account')}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}

export default LoginPage;
