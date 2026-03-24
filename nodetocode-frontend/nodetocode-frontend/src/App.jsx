import React from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Dashboard from './pages/Dashboard'
import ProblemPage from './pages/ProblemPage'
import DSAProblemPage from './pages/DSAProblemPage'
import ProjectPage from './pages/ProjectPage'
import ProblemsListPage from './pages/ProblemsListPage'
import ProjectsListPage from './pages/ProjectsListPage'
import ProfilePage from './pages/ProfilePage'
import ArenaPage from './pages/ArenaPage'
import Navbar from './components/Navbar'
import FloatingNav from './components/FloatingNav'
import { GoogleOAuthProvider } from '@react-oauth/google'
import LoginPage from './pages/LoginPage'

const clientId = '345977090426-ne16h9j385a2f04466fdbttoi3sn1hcf.apps.googleusercontent.com'

function Home() {
	return (
		<div style={{padding:20}}>
			<h1>Home</h1>
			<p>Welcome to the app. Go to <Link to="/login">Login</Link>.</p>
		</div>
	)
}

function RequireAuth({ children }) {
	const user = useAuthStore((s) => s.user)
	const initialized = useAuthStore((s) => s.initialized)
	const restoreToken = useAuthStore((s) => s.restoreToken)
	const location = useLocation()

	React.useEffect(() => {
		if (!initialized) restoreToken()
	}, [initialized, restoreToken])

	if (!initialized) return <div className="h-screen flex items-center justify-center text-white/60">Loading...</div>
	if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
	return children
}

function App() {
	const user = useAuthStore((s) => s.user)

	return (
		<GoogleOAuthProvider clientId={clientId}>
			<BrowserRouter>
				{user && <Navbar />}
				{user && <FloatingNav />}
				<Routes>
					<Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
					<Route path="/problems" element={<RequireAuth><ProblemsListPage /></RequireAuth>} />
					<Route path="/problems/:id" element={<RequireAuth><ProblemPage /></RequireAuth>} />
					<Route path="/dsa-problems/:id" element={<RequireAuth><DSAProblemPage /></RequireAuth>} />
					<Route path="/projects" element={<RequireAuth><ProjectsListPage /></RequireAuth>} />
					<Route path="/projects/:id" element={<RequireAuth><ProjectPage /></RequireAuth>} />
					<Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
					<Route path="/arena" element={<RequireAuth><ArenaPage /></RequireAuth>} />
				</Routes>
			</BrowserRouter>
		</GoogleOAuthProvider>
	)
}

export default App