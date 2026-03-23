import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {

    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            if (data && data.user) {
                setUser(data.user)
                return { success: true }
            }
        } catch (err) {
            console.error('Login error:', err)
            return { success: false, error: err.response?.data?.message || 'Login failed' }
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            if (data && data.user) {
                setUser(data.user)
                return { success: true }
            }
        } catch (err) {
            console.error('Register error:', err)
            return { success: false, error: err.response?.data?.message || 'Registration failed' }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
            return { success: true }
        } catch (err) {
            console.error('Logout error:', err)
            return { success: false, error: 'Logout failed' }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            setLoading(true)
            try {
                const data = await getMe()
                if (data && data.user) {
                    setUser(data.user)
                } else {
                    setUser(null)
                }
            } catch (err) {
                console.error('GetMe error:', err)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()
    }, [setUser, setLoading])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}