import React from 'react'
import { GoogleLogin } from '@react-oauth/google'
import useAuthStore from '../store/authStore'


// Will be done later currently only a working login page
// and is not the final login page 


export default function Login() {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const guestLogin = useAuthStore((s) => s.guestLogin)
  const loading = useAuthStore((s) => s.loading)

  const onSuccess = (credentialResponse) => {
    loginWithGoogle(credentialResponse)
  }

  const onError = () => {
    console.error('Google login failed')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-4xl w-full bg-white shadow-xl rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold mb-2">NodeToCode</h1>
          <p className="mb-4 opacity-90">Design logic visually — connect nodes, edit code, and export working programs.</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white mt-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/></svg>
              <span>Visual node editor with live code preview</span>
            </li>
            <li className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white mt-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/></svg>
              <span>Save & sync projects to your account</span>
            </li>
            <li className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white mt-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/></svg>
              <span>Export generated code for integration</span>
            </li>
          </ul>
          <p className="mt-6 text-sm opacity-80">No account yet? You can continue as a guest, but saving requires signing in.</p>
        </div>

        <div className="p-8 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-semibold mb-2">Welcome back</h2>
            <p className="text-sm mb-6 text-gray-600">Sign in to access saved projects, collaboration, and version history.</p>

            <div className="mb-4">
              <GoogleLogin onSuccess={onSuccess} onError={onError} />
            </div>

            <button
              onClick={guestLogin}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-800 transition"
            >
              {loading ? 'Please wait...' : 'Continue as Guest'}
            </button>

            <div className="mt-6 text-xs text-gray-400 text-center">By continuing you agree to our terms and privacy policy.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
