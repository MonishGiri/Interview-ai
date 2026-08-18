import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import Navbar from '../../../components/Navbar'
import LoadingScreen from '../../../components/LoadingScreen'

const Login = () => {
    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleLogin({ email, password })
        navigate('/')
    }

    if (loading) {
        return (
            <>
                <Navbar />
                <LoadingScreen useCase="auth" />
            </>
        )
    }

    return (
        <div className='page-wrapper'>
            <Navbar />
            <main className='auth-page'>
                <div className="form-container">
                    <h1>Login</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                onChange={(e) => { setEmail(e.target.value) }}
                                type="email" id="email" name='email' placeholder='Enter email address' required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                onChange={(e) => { setPassword(e.target.value) }}
                                type="password" id="password" name='password' placeholder='Enter password' required />
                        </div>
                        <button type="submit" className='button primary-button'>Login</button>
                    </form>
                    <p className='auth-footer'>Don't have an account? <Link to={"/register"}>Register</Link></p>
                </div>
            </main>
        </div>
    )
}

export default Login