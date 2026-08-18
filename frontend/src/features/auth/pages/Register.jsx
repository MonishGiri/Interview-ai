import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import Navbar from '../../../components/Navbar'
import LoadingScreen from '../../../components/LoadingScreen'

const Register = () => {
    const navigate = useNavigate()
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const { loading, handleRegister } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleRegister({ username, email, password })
        navigate("/")
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
                    <h1>Register</h1>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                onChange={(e) => { setUsername(e.target.value) }}
                                type="text" id="username" name='username' placeholder='Enter username' required />
                        </div>
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

                        <button type="submit" className='button primary-button'>Register</button>
                    </form>

                    <p className='auth-footer'>Already have an account? <Link to={"/login"}>Login</Link></p>
                </div>
            </main>
        </div>
    )
}

export default Register