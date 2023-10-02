import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useProyectos from '../hooks/useProyectos'
import useAdmin from '../hooks/useAdmin'
import ModalFormularioTarea from '../components/ModalFormularioTarea'
import ModalEliminarTarea from '../components/ModalEliminarTarea'
import ModalEliminarColaborador from '../components/ModalEliminarColaborador'
import Tarea from '../components/Tarea'
import Alerta from '../components/Alerta'
import Colaborador from '../components/Colaborador'
import io from 'socket.io-client'

let socket

const Proyecto = () => {
  
  const params = useParams()
  const { obtenerProyecto, proyecto, cargando, handleModalTarea, alerta, submitTareasProyecto, eliminarTareaProyecto, actualizarTareaProyecto, cambiarEstadoTarea } = useProyectos()
  const admin = useAdmin()

  useEffect(() => {
    obtenerProyecto(params.id)    
  }, [])

// useEffect para conectarme a socket.io que se ejecuta 1 sola vez
  useEffect(()=>{
    socket = io(import.meta.env.VITE_BACKEND_URL)
    socket.emit('abrir proyecto', params.id)
  },[])

  // useEffect para escuchar a socket.io que se ejecuta todo el tiempo
useEffect(()=>{

  socket.on('tarea agregada', (tareaNueva) =>{    
    if(tareaNueva.proyecto === proyecto._id){
      submitTareasProyecto(tareaNueva)
  }})

  socket.on('tarea eliminada', tareaEliminada =>{
    if(tareaEliminada.proyecto === proyecto._id){
      eliminarTareaProyecto(tareaEliminada)
    }
  })

  socket.on('tarea actualizada', tareaActualizada =>{
    if (tareaActualizada.proyecto._id === proyecto._id){       // aca tambien, como el proyecto viene con el objeto completo pregunto por ._id  !!
      actualizarTareaProyecto(tareaActualizada)
    }
  })

  socket.on('nuevo estado', nuevoEstadoTarea =>{
    if (nuevoEstadoTarea.proyecto._id === proyecto._id){
      cambiarEstadoTarea(nuevoEstadoTarea)
    }
  })


  return () => {
    socket.off("tarea agregada")
    socket.off("tarea eliminada")
    socket.off("tarea actualizada")
    socket.off("nuevo estado")
  }

})


  const { nombre } = proyecto
 
  if(cargando) return 'Cargando...'

  const { msg } = alerta 

  return (    
     // aca lo que hago es prevenir que si obtuve la url de un proyecto que no tendria que tener acceso, no muestro informacion cuando tengo una alerta de error solamente!
      <>
        <div className='flex justify-between'>
          <h1 className='font-black text-4xl'>{nombre}</h1>
          {admin && (
            <div className='flex items-center gap-2 text-gray-400 hover:text-black'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
              <Link
                className='uppercase font-bold'
                to={`/proyectos/editar/${params.id}`}
              >Editar</Link>
            </div>
          )}
        </div>

        {admin && (
          <button
            onClick={ handleModalTarea }
            type="button"
            className='text-sm px-5 py-3 w-full md:w-auto rounded-lg uppercase font-bold bg-sky-400 text-white text-center mt-5 flex gap-2 items-center justify-center'
          ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Nueva Tarea
          </button>
        )}

        <p className='font-bold text-xl mt-10'>Tareas del Proyecto</p>

        <div className='bg-white shadow mt-10 rounded-lg'>
          {proyecto.tareas?.length 
            ? 
              proyecto.tareas?.map( tarea => (
                <Tarea  
                  key={tarea.Id}
                  tarea={tarea}
                />
              ))
            : 
            <p className='text-center my-5 p-10'>No hay tareas en este proyecto</p>
          }    
        </div>


        { admin && (
          <>
            <div className='flex items-center justify-between mt-10'>
              <p className='font-bold text-xl'>Colaboradores</p>      
              <Link 
                to={`/proyectos/nuevo-colaborador/${proyecto._id}`}
                className='text-gray-400 hover:text-black uppercase font-bold'
              >Añadir</Link>
            </div>  

            <div className='bg-white shadow mt-10 rounded-lg'>
              {proyecto.colaboradores?.length 
                ? 
                  proyecto.colaboradores?.map( colaborador => (
                    <Colaborador  
                      key={colaborador._Id}
                      colaborador={colaborador}
                    />
                  ))
                : 
                <p className='text-center my-5 p-10'>No hay colaboradores en este proyecto</p>
              }    
            </div>      
          </>          
        )}

        <ModalFormularioTarea />
        <ModalEliminarTarea />
        <ModalEliminarColaborador />
      </>
    )
}

export default Proyecto
