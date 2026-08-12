import React from 'react'
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
const Register = () => {
    const {loading, handleRegister} = useAuth()
    const navigate = useNavigate();
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) =>{
        e.preventDefault();
        await handleRegister({username, email, password})
        navigate('/login');
    }
    if(loading){
        return <h1>Loading...</h1>
    }
  return (
    <main>
        <div className="form-container">
            <h1>Register</h1>

            <form onSubmit={handleSubmit}>
                 <div className="input-group">
                    <label htmlFor="username">Username</label>
                    <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text" id="username" name="username" placeholder='Enter username' />
                </div>

                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email" id="email" name="email" placeholder='Enter email address' />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password" id="password" name="password" placeholder='Enter Password' />
                </div>

                <button className='button primary-button'>Register</button>
            </form>

            <p>Already have an account?<Link to={'/login'}> Login</Link></p>
        </div>
    </main>
  )
}

export default Register