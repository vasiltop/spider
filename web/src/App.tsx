import { Routes, Route, Link, useLocation } from 'react-router-dom';
import SearchPage from './pages/search.tsx';
import AdminPage from './pages/admin.tsx';
import LoginPage from './pages/login.tsx';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, auth_context } from './AuthContext';

function Layout({ children }: { children: React.ReactNode }) {
	const { user, is_admin, is_loading, logout } = useContext(auth_context);
	const location = useLocation();
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
			<nav className="bg-white shadow-sm mb-8">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">

						<div className="flex items-center space-x-8 h-full">
							<Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium h-full">
								Search
							</Link>
							{!is_loading && is_admin && (
								<Link to="/admin" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium h-full">
									Admin Dashboard
								</Link>
							)}
						</div>

						<div className="flex items-center space-x-6 h-full">
							{!is_loading && user && (
								<>
									<button
										onClick={async () => {
											logout();
											navigate('/login');
										}}
										className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-red-300 text-sm font-medium text-gray-500 hover:text-red-600 cursor-pointer h-full"
									>
										Logout
									</button>
								</>
							)}

							{!is_loading && !user && location.pathname !== '/login' && (
								<Link to="/login" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-300 text-sm font-medium text-blue-600 hover:text-blue-800 h-full">
									Login
								</Link>
							)}

							<span className="text-xl font-bold text-gray-800 tracking-tight self-center">
								spider
							</span>
						</div>

					</div>
				</div>
			</nav>
			<main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
				{children}
			</main>
		</div>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Layout>
					<Routes>
						<Route path="/" element={<SearchPage />} />
						<Route path="/admin" element={<AdminPage />} />
						<Route path="/login" element={<LoginPage />} />
					</Routes>
				</Layout>
			</AuthProvider>
		</BrowserRouter>
	);
}
