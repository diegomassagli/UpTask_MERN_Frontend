import { useState, useEffect, createContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import clienteAxios from '../config/clienteAxios'

const AuthContext = createContext()

const AuthProvider = ( { children } ) => {

  const [auth, setAuth] = useState({})
  const [cargando, setCargando] = useState(true)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect( () => {
    const autenticarUsuario = async () => {
      const token = localStorage.getItem('token')      
      if(!token) {
        setCargando(false)
        return
      }

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }

      try {
        const { data } = await clienteAxios('/usuarios/perfil', config)
        setAuth(data)      
        if(data._id && location.pathname === '/') {
          navigate('/proyectos')  // esto es opcional, si esta logueado, ya lo llevo hacia proyectos.
        }

      } catch (error) {
        setAuth({})
      } finally{
        setCargando(false)
      }      
   }
    autenticarUsuario()
  },[])

  const cerrarSesionAuth = () => {
    setAuth({})
  }

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        cargando,
        cerrarSesionAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider }

export default AuthContext