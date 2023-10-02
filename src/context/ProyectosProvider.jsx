import { useEffect, useState, createContext } from 'react'
import clienteAxios from '../config/clienteAxios'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import io from 'socket.io-client'

let socket

const ProyectosContext = createContext()

const ProyectosProvider = ( {children} ) => {

  const [proyectos, setProyectos] = useState([])
  const [alerta, setAlerta] = useState({})
  const [proyecto, setProyecto] = useState({})
  const [cargando, setCargando] = useState(false)
  const [modalFormularioTarea, setModalFormularioTarea] = useState(false)
  const [modalEliminarTarea, setModalEliminarTarea] = useState(false)
  const [tarea, setTarea] = useState({})
  const [colaborador, setColaborador] = useState({})
  const [modalEliminarColaborador, setModalEliminarColaborador] = useState(false)
  const [buscador, setBuscador] = useState(false) 

  const navigate = useNavigate()
  const { auth } = useAuth()

/////////////////////////////////////////////////////////////////////////////////////
  useEffect( () => {
    const obtenerProyectos = async () => {     
      try {
        const token = localStorage.getItem('token')
        if(!token) return
  
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
  
        const { data } = await clienteAxios('/proyectos', config)  // por ser get se envia url + ' sin datos ' +  configuracion       (osea 2 parametros)
        setProyectos(data)   // pongo los proyectos en el state global        
        setAlerta({})        
      } catch (error) {
        console.log(error)
      }
    }

    obtenerProyectos()
  },[auth])

///////////////////////////////////////////////////////////////////////////////////// con esto establezco la conexion y la hago disponible a traves de la variable socket a todos
useEffect(()=>{
  socket = io(import.meta.env.VITE_BACKEND_URL)
},[])

/////////////////////////////////////////////////////////////////////////////////////
  const mostrarAlerta = alerta => {
    setAlerta(alerta)

    setTimeout(() => {
      setAlerta({})
    }, 5000);
  }


/////////////////////////////////////////////////////////////////////////////////////

  const submitProyecto = async proyecto => {
    if(proyecto.id) {
      await editarProyecto(proyecto)
    }else {
      await nuevoProyecto(proyecto)
    }
  }


/////////////////////////////////////////////////////////////////////////////////////
  const editarProyecto = async proyecto => {
    try {
      const token = localStorage.getItem('token')
      if(!token) return

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }      

      const { data } = await clienteAxios.put(`/proyectos/${proyecto.id}`, proyecto, config)
      // Sincronizar el state
      const proyectosActualizados = proyectos.map(proyectoState => proyectoState._id === data._id ? data : proyectoState)
      setProyectos(proyectosActualizados)

      // mostrar la alerta
      setAlerta({
        msg: 'Proyecto Actualizado Correctamente',
        error: false
      })
      // redireccionar a proyectos
      setTimeout(() => {
       setAlerta({})  // la reinicio para que no se quede ese state con datos cuando regrese
       navigate('/proyectos')
      }, 3000);
  

    } catch (error) {
      console.log(error)
    }
  }


/////////////////////////////////////////////////////////////////////////////////////
  const nuevoProyecto = async proyecto => {
    try {
      const token = localStorage.getItem('token')
      if(!token) return

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }
                                                                                      // por ser post se envia url, datos, configuracion
      const { data } = await clienteAxios.post('/proyectos', proyecto, config)  
      
      setProyectos([...proyectos, data])  // IMPORTANTE: aca lo que hago es MANUALMENTE agrego a mi state el proyecto que la api me devuelve agregado a la base de datos, para no tener que hacer otra consulta a la BD

      setAlerta({
        msg: 'Proyecto creado correctamente',
        error: false
      })

      // despues de crear el proyecto redirijo hacia la pantalla de proyectos
      setTimeout(() => {
        setAlerta({})  // la reinicio para que no se quede ese state con datos cuando regrese
        navigate('/proyectos')
      }, 3000);

    } catch (error) {
      console.log(error)
    }
  }

/////////////////////////////////////////////////////////////////////////////////////
  const obtenerProyecto = async id => {
    setCargando(true)
    try {
      const token = localStorage.getItem('token')
      if(!token) return

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }

      const { data } = await clienteAxios(`/proyectos/${id}`, config)  
      setProyecto(data)
    } catch (error) {
        navigate('/proyectos')
        setAlerta({
          msg: error.response.data.msg,
          error: true
         })
         setTimeout(() => {
          setAlerta({})            
        }, 3000);  
    } finally {
      setCargando(false)
    }
  }

/////////////////////////////////////////////////////////////////////////////////////
  const eliminarProyecto = async id => {    
    try {
      const token = localStorage.getItem('token')
      if(!token) return

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }

      const { data } = await clienteAxios.delete(`/proyectos/${id}`, config)     

      // Sincronizar el state      
      const proyectosActualizados = proyectos.filter(proyectoState._id !== id)
      setProyectos(proyectosActualizados)

      // mostrar la alerta
      setAlerta({
        msg: data.msg,
        error: false
      })

      // redireccionar al usuario      
      setTimeout(() => {
        setAlerta({})  // la reinicio para que no se quede ese state con datos cuando regrese
        navigate('/proyectos')
      }, 3000);      

    } catch (error) {
      console.log(error)
    }
  }

/////////////////////////////////////////////////////////////////////////////////////
  const handleModalTarea = () => {
    setModalFormularioTarea(!modalFormularioTarea)
    setTarea({})
  }

/////////////////////////////////////////////////////////////////////////////////////
  const submitTarea = async tarea => {
    if (tarea?.id) {
      await editarTarea(tarea)
    } else {
      delete tarea.id // elimino el id null que viene del state  (esto tambien lo puedo hacer en backend)
      await crearTarea(tarea)
    }
  }


  const crearTarea = async tarea => {
    try {
      const token = localStorage.getItem('token')
      if(!token) return

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }

      const { data } = await clienteAxios.post('/tareas', tarea, config)
      // Agrega la nueva tarea al state (en data tengo lo que devolvio la API/base)
                    // AHORA ESTAS 3 LINEAS LAS MANEJO EN SOCKET.IO !!
                    // const proyectoActualizado = {...proyecto}
                    // proyectoActualizado.tareas = [...proyectoActualizado.tareas, data]
                    // setProyecto(proyectoActualizado)
      setAlerta({})
      setModalFormularioTarea(false)       // en este punto tenia el problema que al abrir un nuevo formulario se llevaba con la tarea anterior, pero ese state venia desde el formulario... ahi lo corrijo

      // SOCKET IO
      socket.emit('nueva tarea', data)
    } catch (error) {
      console.log(error)
    }
  }


  const editarTarea = async tarea => {
    try {
      const token = localStorage.getItem('token')
      if(!token) return

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }

      const { data } = await clienteAxios.put(`/tareas/${tarea.id}`, tarea, config)

      // la tarea que actualice es una de las tareas del proyecto que estoy actualizando, tengo que preservar/refrescar todo eso)
      // primero trabajo con una copia de lo que tengo en proyecto y recorro las tareas de ese proyecto, y voy preguntando si el id de esa tarea coincide con el id de la tarea que me devolvio la API en data
      // si coincide retorno el data, sino dejo lo que esta tareaState
            // ahora las 3 lineas siguientes las hago en socket.io
            // const proyectoActualizado = {...proyecto}
            // proyectoActualizado.tareas = proyectoActualizado.tareas.map ( tareaState => tareaState._id === data._id ? data : tareaState)
            // setProyecto(proyectoActualizado)

      setAlerta({})
      setModalFormularioTarea(false)
      // SOCKET.IO
      socket.emit('actualizar tarea', data)

    } catch (error) {
      console.log(error)
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////
  const handleModalEditarTarea = tarea => {    // cuando hago click en editar tarea, pongo esa tarea en el state y abro el formulario modal
    setTarea(tarea)
    setModalFormularioTarea(true)
  }

/////////////////////////////////////////////////////////////////////////////////////
const handleModalEliminarTarea = tarea => {    // cuando hago click en eliminar tarea, pongo esa tarea en el state y abro el formulario modal
  setTarea(tarea)
  setModalEliminarTarea(!modalEliminarTarea)
}

/////////////////////////////////////////////////////////////////////////////////////
const handleModalEliminarColaborador = colaborador => {    // cuando hago click en eliminar colaborador, pongo ese colaborador en el state y abro el formulario modal
  setModalEliminarColaborador(!modalEliminarColaborador)
  setColaborador(colaborador)
}

/////////////////////////////////////////////////////////////////////////////////////
const eliminarTarea = async () => {
  try {
    const token = localStorage.getItem('token')
    if(!token) return

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    }

    const { data } = await clienteAxios.delete(`/tareas/${tarea._id}`, config)  // el _id es el que vino desde la base
    setAlerta({
      msg: data.msg,
      error: false
    })
              // pasado a socket.io
              // const proyectoActualizado = {...proyecto}                                                                        // trabaja con las tareas que forman parte de un proyecto
              // proyectoActualizado.tareas = proyectoActualizado.tareas.filter(tareaState => tareaState._id !== tarea._id)
              // setProyecto(proyectoActualizado)
    setModalEliminarTarea(false)
   
    // SOCKET  (como el backend no retorna la tarea que elimino, la tomamos del state y luego lo vacio)
    socket.emit('eliminar tarea', tarea)

    setTarea({})
    setTimeout(() => {
      setAlerta({})
    }, 3000);
  } catch (error) {
    
  }
}

/////////////////////////////////////////////////////////////////////////////////////
const submitColaborador = async email => {
  setCargando(true)
  try {
    const token = localStorage.getItem('token')
    if(!token) return

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    }
    
    const { data } = await clienteAxios.post('/proyectos/colaboradores', {email}, config)
    setColaborador(data)
    setAlerta({})
  } catch (error) {
    setAlerta({
      msg: error.response.data.msg,
      error: true
    })
  } finally{
    setCargando(false)
  }
}


/////////////////////////////////////////////////////////////////////////////////////
const agregarColaborador = async email => {
  try {
    const token = localStorage.getItem('token')
    if(!token) return

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    }

    const { data } = await clienteAxios.post(`/proyectos/colaboradores/${proyecto._id}`, email, config)
    setAlerta({
      msg: data.msg,
      error: false
    })
    setColaborador({})  // despues de agregarlo, reseteo ese objeto para que este vacio

    setAlerta({
      msg: 'Colaborador agregado correctamente',
      error: false
    })
    // despues de crear el proyecto redirijo hacia la pantalla de proyectos
    setTimeout(() => {
      setAlerta({})  // la reinicio para que no se quede ese state con datos cuando regrese      
    }, 3000);    

  } catch (error) {
    setAlerta({
      msg: error.response.data.msg,
      error: true
    })
  } 
}

/////////////////////////////////////////////////////////////////////////////////////
const eliminarColaborador = async () => {   // este colaborador ya esta en el state, no hace falta pasarlo
  try {
    const token = localStorage.getItem('token')
    if(!token) return

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    }

    const { data } = await clienteAxios.post(`/proyectos/eliminar-colaborador/${proyecto._id}`, { id: colaborador._id }, config)

    // tengo que quitar el colaborador del state del proyecto
    const proyectoActualizado = {...proyecto}
    proyectoActualizado.colaboradores = proyectoActualizado.colaboradores.filter(colaboradorState => colaboradorState._id != colaborador._id)
    setProyecto(proyectoActualizado)

    setAlerta({
      msg: data.msg,
      error: false
    })
    setTimeout(() => {
      setAlerta({})  // la reinicio para que no se quede ese state con datos cuando regrese      
    }, 3000);     

    setColaborador({})
    setModalEliminarColaborador(false)

  } catch (error) {
    console.log(error.response)
  }
}

/////////////////////////////////////////////////////////////////////////////////////
const completarTarea = async id =>{
  try {
    const token = localStorage.getItem('token')
    if(!token) return

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    }
    
    const { data } = await clienteAxios.post(`/tareas/estado/${id}`, {}, config)

          // ahora lo hago a traves de socket.io
          // const proyectoActualizado = {...proyecto}
          // proyectoActualizado.tareas = proyectoActualizado.tareas.map(tareaState => tareaState._id === data._id ? data : tareaState)
          // setProyecto(proyectoActualizado)

    // SOCKET  
    socket.emit('cambiar estado', data)

    setTarea({})
    setAlerta({})
  } catch (error) {
    console.log(error.response)
  }
}


/////////////////////////////////////////////////////////////////////////////////////
const handleBuscador = () => {
  setBuscador(!buscador)
}


/////////////////////////////////////////////////////////////////////////////////////
// Socket io
const submitTareasProyecto = (tarea)=>{                    // Esta Tarea llega a traves de socket.io porque alguien o yo mismo la di de alta
  const proyectoActualizado = {...proyecto}
  proyectoActualizado.tareas = [...proyectoActualizado.tareas, tarea]
  setProyecto(proyectoActualizado)
}


const eliminarTareaProyecto = tarea => {                    // Esta Tarea llega a traves de socket.io porque alguien o yo mismo la di de alta
  const proyectoActualizado = {...proyecto}           
  proyectoActualizado.tareas = proyectoActualizado.tareas.filter(tareaState => tareaState._id !== tarea._id)
  setProyecto(proyectoActualizado)  
}


const actualizarTareaProyecto = tarea => {
  const proyectoActualizado = {...proyecto}
  proyectoActualizado.tareas = proyectoActualizado.tareas.map ( tareaState => tareaState._id === tarea._id ? tarea : tareaState)
  setProyecto(proyectoActualizado)
}

const cambiarEstadoTarea = tarea => {
  const proyectoActualizado = {...proyecto}
  proyectoActualizado.tareas = proyectoActualizado.tareas.map(tareaState => tareaState._id === tarea._id ? tarea : tareaState)
  setProyecto(proyectoActualizado)
}

const cerrarSesionProyectos = () => {
  setProyectos([])
  setProyecto({})
  setAlerta({})

}

  return (
    <ProyectosContext.Provider
      value={{
        proyectos,
        mostrarAlerta,
        alerta,
        submitProyecto,
        obtenerProyecto,
        proyecto,
        cargando,
        eliminarProyecto,
        modalFormularioTarea,
        handleModalTarea,
        submitTarea,
        handleModalEditarTarea,
        tarea,
        modalEliminarTarea,
        handleModalEliminarTarea,
        eliminarTarea,
        submitColaborador,
        colaborador,
        agregarColaborador,
        handleModalEliminarColaborador,
        modalEliminarColaborador,
        eliminarColaborador,
        completarTarea,
        buscador,
        handleBuscador,
        submitTareasProyecto,
        eliminarTareaProyecto,
        actualizarTareaProyecto,
        cambiarEstadoTarea,
        cerrarSesionProyectos
      }}
    >{children}
    </ProyectosContext.Provider>
  )
}

export {
  ProyectosProvider
}

export default ProyectosContext