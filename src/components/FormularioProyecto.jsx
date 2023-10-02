import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import useProyectos from '../hooks/useProyectos'
import Alerta from "./Alerta"

const FormularioProyecto = () => {

  const [id, setId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [cliente, setCliente] = useState('')

  const params = useParams()
  const { mostrarAlerta, alerta, submitProyecto, proyecto } = useProyectos()
  
  useEffect( () => {
    if(params.id){           // si tengo un id en los parametros es que estoy editando. Para evitar problemas con el SPLIT en la fecha abajo, porque los parametros en la url son mas rapidos que la respuesta de la api, uso optional chaining "?"
      setId(proyecto._id)                         // uso este state como bandera, solo para saber si estoy editando y adaptar el texto del boton submit
      setNombre(proyecto.nombre)
      setDescripcion(proyecto.descripcion)
      setFechaEntrega(proyecto.fechaEntrega?.split('T')[0])  // esto es porque la fecha de proyecto viene con la hora al final y el control de fecha requiere solo fecha
      setCliente(proyecto.cliente)
    }
  },[params])



  const handleSubmit = async e => {
    e.preventDefault()
    if([nombre, descripcion, fechaEntrega, cliente].includes('')){
      mostrarAlerta({
        msg: 'Todos los Campos son Obligatorios',
        error: true
      })
      return
    }

    // pasar los datos hacia el provider    y le puedo poner await porque la fx es async y necesito esperar que finalice para limpiar formulario
    await submitProyecto({ id, nombre, descripcion, fechaEntrega, cliente })  // agrego pasar el "id" que solo va a tener valor en la edicion para poder manejar altas y modificaciones condicionalmente

    setId(null)    // este se usa en la edicion, pero esta parte es compartida. Al submit le tengo que poner await porque sino inicializa los campos antes de tiempo!!
    setNombre('')
    setDescripcion('')
    setFechaEntrega('')
    setCliente('')
  }

  const { msg } = alerta

  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-white py-10 px-5 md:w-1/2 rounded-lg shadow">

      {msg && <Alerta alerta={alerta} />}

      <div className="mb-5">
        <label 
          htmlFor="nombre"
          className="text-gray-700 uppercase font-bold text-sm"
        >Nombre Proyecto
        </label>
        <input 
        id="nombre"
          type="text"
          className="border w-full p-2 mt-2 placeholder-gray-400 rounded-md"
          placeholder="Nombre del Proyecto"
          value={nombre}
          onChange={e=>setNombre(e.target.value)}
        />
      </div>

      <div className="mb-5">
        <label 
          htmlFor="descripcion"
          className="text-gray-700 uppercase font-bold text-sm"
        >Descripcion
        </label>
        <textarea 
          id="descripcion"          
          className="border w-full p-2 mt-2 placeholder-gray-400 rounded-md"
          placeholder="Descripcion del Proyecto"
          value={descripcion}
          onChange={e=>setDescripcion(e.target.value)}
        />
      </div>

      <div className="mb-5">
        <label 
          htmlFor="fecha-entrega"
          className="text-gray-700 uppercase font-bold text-sm"
        >Fecha Entrega
        </label>
        <input
          id="fecha-entrega"          
          type="date" 
          className="border w-full p-2 mt-2 rounded-md"
          value={fechaEntrega}
          onChange={e=>setFechaEntrega(e.target.value)}
        />
      </div>

      <div className="mb-5">
        <label 
          htmlFor="cliente"
          className="text-gray-700 uppercase font-bold text-sm"
        >Nombre Cliente
        </label>
        <input 
        id="cliente"
          type="text"
          className="border w-full p-2 mt-2 placeholder-gray-400 rounded-md"
          placeholder="Nombre del Cliente"
          value={cliente}
          onChange={e=>setCliente(e.target.value)}
        />
      </div>

      <input 
        type="submit" 
        value={id ? 'Actualizar Proyecto' : 'Crear Proyecto'}
        className="bg-sky-600 w-full p-3 uppercase font-bold text-white rounded cursor-pointer hover:bg-sky-700 transition-colors" 
      />

    </form>
  )
}

export default FormularioProyecto
