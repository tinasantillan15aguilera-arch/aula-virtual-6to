/* ==========================================
   ESTADO GLOBAL Y ALMACENAMIENTO
   ========================================== */

const CLAVE_STORAGE = "aula-datos-v2";

let baseDatos = {
  modo: "docente",
  alumnoActual: "",
  cursos: [
    {
      id: 1,
      codigo: "PROG6",
      nombre: "Programación Web",
      docente: "Prof. Gómez",
      color: "#D6457C"
    }
  ],
  materiales: [],
  tareas: [],
  entregas: [],
  comentarios: []
};

let cursoActualId = null;
let tareaActualId = null;

function cargarDatos() {
  const datosGuardados = localStorage.getItem(CLAVE_STORAGE);
  if (datosGuardados) {
    try {
      baseDatos = JSON.parse(datosGuardados);
      if (!baseDatos.comentarios) baseDatos.comentarios = [];
    } catch (e) {
      console.error("Error al parsear datos", e);
    }
  } else {
    guardarDatos();
  }
}

function guardarDatos() {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(baseDatos));
    return true;
  } catch (e) {
    console.error("Error de almacenamiento:", e);
    alert("❌ El espacio de almacenamiento del navegador está lleno.");
    return false;
  }
}

/* ==========================================
   NAVEGACIÓN Y VISTAS
   ========================================== */

function mostrarVista(nombreVista) {
  document.querySelectorAll(".vista").forEach(v => v.style.display = "none");
  const vista = document.getElementById(`vista-${nombreVista}`);
  if (vista) vista.style.display = "flex";
}

function actualizarInterfazRol() {
  const selectorRol = document.getElementById("selector-rol");
  if (selectorRol) selectorRol.value = baseDatos.modo;

  document.querySelectorAll(".solo-docente").forEach(el => {
    el.style.display = baseDatos.modo === "alumno" ? "none" : "";
  });

  document.querySelectorAll(".solo-alumno").forEach(el => {
    el.style.display = baseDatos.modo === "docente" ? "none" : "";
  });

  renderizarCursos();
  renderizarCalendarioVencimientos();
  if (cursoActualId) renderizarMuro();
  if (tareaActualId) renderizarEntregas();
}

/* ==========================================
   GESTIÓN DE CURSOS Y CALENDARIO
   ========================================== */

function renderizarCursos() {
  const grilla = document.getElementById("grilla-cursos");
  if (!grilla) return;
  grilla.innerHTML = "";

  if (baseDatos.cursos.length === 0) {
    grilla.innerHTML = "<p>No hay cursos creados todavía.</p>";
    return;
  }

  baseDatos.cursos.forEach(curso => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-curso";
    tarjeta.innerHTML = `
      <div class="franja-curso" style="background-color: ${curso.color || '#D6457C'};"></div>
      <div class="tarjeta-curso-contenido">
        <span style="font-size: 0.75rem; font-weight: bold; color: #718096;">[${curso.codigo}]</span>
        <h3>${curso.nombre}</h3>
        <p>Docente: ${curso.docente}</p>
        <div class="acciones-tarjeta solo-docente" style="display: ${baseDatos.modo === 'docente' ? 'flex' : 'none'};">
          <button type="button" class="btn-editar" data-id="${curso.id}">Editar</button>
          <button type="button" class="btn-borrar" data-id="${curso.id}">Borrar</button>
        </div>
      </div>
    `;

    tarjeta.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;
      abrirCurso(curso.id);
    });

    grilla.appendChild(tarjeta);
  });

  grilla.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      cargarCursoParaEditar(Number(btn.dataset.id));
    });
  });

  grilla.querySelectorAll(".btn-borrar").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      borrarCurso(Number(btn.dataset.id));
    });
  });
}

function renderizarCalendarioVencimientos() {
  const listaCalendario = document.getElementById("lista-calendario-vencimientos");
  if (!listaCalendario) return;
  listaCalendario.innerHTML = "";

  const tareasOrdenadas = [...baseDatos.tareas].sort((a, b) => {
    return new Date(a.fechaLimite) - new Date(b.fechaLimite);
  });

  if (tareasOrdenadas.length === 0) {
    listaCalendario.innerHTML = "<li><p style='color: var(--color-texto-secundario); font-size: 0.9rem;'>No hay tareas programadas próximamente.</p></li>";
    return;
  }

  tareasOrdenadas.forEach(tarea => {
    const curso = baseDatos.cursos.find(c => c.id === tarea.cursoId);
    const nombreCurso = curso ? curso.nombre : "Curso general";
    const fechaFormateada = tarea.fechaLimite ? tarea.fechaLimite.replace("T", " ") : "Sin fecha";

    const li = document.createElement("li");
    li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: var(--color-fondo); border-radius: 8px; border: 1px solid var(--color-borde);";
    li.innerHTML = `
      <div>
        <strong style="color: var(--color-texto);">${tarea.titulo}</strong>
        <span style="display: block; font-size: 0.8rem; color: var(--color-texto-secundario);">📚 ${nombreCurso}</span>
      </div>
      <div style="text-align: right; font-size: 0.85rem; font-weight: 600; color: var(--color-primario);">
        📅 ${fechaFormateada}
      </div>
    `;
    listaCalendario.appendChild(li);
  });
}

function abrirCurso(cursoId) {
  cursoActualId = cursoId;
  const curso = baseDatos.cursos.find(c => c.id === cursoId);
  if (curso) {
    const titulo = document.getElementById("titulo-curso-actual");
    if (titulo) titulo.textContent = `${curso.nombre} (${curso.docente})`;
    renderizarMuro();
    mostrarVista("curso");
  }
}

function inicializarFormularioCurso() {
  const form = document.getElementById("formulario-crear-curso");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const idEditando = document.getElementById("id-curso-editando").value;
    const codigo = document.getElementById("codigo-curso").value.trim();
    const nombre = document.getElementById("nombre-curso").value.trim();
    const docente = document.getElementById("docente-curso").value.trim();
    const color = document.getElementById("color-curso").value;

    if (!nombre || !codigo) {
      alert("Completá los campos obligatorios.");
      return;
    }

    if (idEditando) {
      const curso = baseDatos.cursos.find(c => c.id === Number(idEditando));
      if (curso) {
        curso.codigo = codigo;
        curso.nombre = nombre;
        curso.docente = docente;
        curso.color = color;
      }
    } else {
      const nuevoId = baseDatos.cursos.length > 0 ? Math.max(...baseDatos.cursos.map(c => c.id)) + 1 : 1;
      baseDatos.cursos.push({ id: nuevoId, codigo, nombre, docente, color });
    }

    if (guardarDatos()) {
      renderizarCursos();
      renderizarCalendarioVencimientos();
      resetearFormularioCurso();
      alert("¡Curso guardado correctamente!");
    }
  });

  const btnCancelar = document.getElementById("boton-cancelar-edicion");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", resetearFormularioCurso);
  }
}

function cargarCursoParaEditar(id) {
  const curso = baseDatos.cursos.find(c => c.id === id);
  if (!curso) return;

  document.getElementById("id-curso-editando").value = curso.id;
  document.getElementById("codigo-curso").value = curso.codigo;
  document.getElementById("nombre-curso").value = curso.nombre;
  document.getElementById("docente-curso").value = curso.docente;
  document.getElementById("color-curso").value = curso.color || "#D6457C";
  document.getElementById("titulo-formulario-curso").textContent = "Editar curso";
  document.getElementById("boton-guardar-curso").textContent = "Guardar Cambios";
  document.getElementById("boton-cancelar-edicion").style.display = "inline-block";

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetearFormularioCurso() {
  document.getElementById("formulario-crear-curso").reset();
  document.getElementById("id-curso-editando").value = "";
  document.getElementById("titulo-formulario-curso").textContent = "Crear nuevo curso";
  document.getElementById("boton-guardar-curso").textContent = "Crear Curso";
  document.getElementById("boton-cancelar-edicion").style.display = "none";
}

function borrarCurso(id) {
  if (confirm("¿Estás seguro de eliminar este curso?")) {
    baseDatos.cursos = baseDatos.cursos.filter(c => c.id !== id);
    baseDatos.materiales = baseDatos.materiales.filter(m => m.cursoId !== id);
    baseDatos.tareas = baseDatos.tareas.filter(t => t.cursoId !== id);
    baseDatos.comentarios = baseDatos.comentarios.filter(com => com.cursoId !== id);
    if (guardarDatos()) {
      renderizarCursos();
      renderizarCalendarioVencimientos();
    }
  }
}

/* ==========================================
   GESTIÓN DEL MURO Y PUBLICACIONES
   ========================================== */

function inicializarFormularioPublicar() {
  const selectTipo = document.getElementById("tipo-publicacion");
  const formulario = document.getElementById("formulario-publicar");
  const botonCancelar = document.getElementById("boton-cancelar-edicion-publicacion");

  if (!selectTipo || !formulario) return;

  actualizarCampoContenido(selectTipo.value);

  selectTipo.addEventListener("change", () => {
    actualizarCampoContenido(selectTipo.value);
  });

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    procesarGuardadoPublicacion();
  });

  if (botonCancelar) {
    botonCancelar.addEventListener("click", resetearFormularioPublicacion);
  }
}

function actualizarCampoContenido(tipo, valorContenido = "", valorFecha = "", valorPuntaje = 100) {
  const contenedor = document.getElementById("contenedor-campo-contenido");
  if (!contenedor) return;

  if (tipo === "tarea") {
    contenedor.innerHTML = `
      <label for="contenido-publicacion">Consigna de la Tarea:</label>
      <textarea id="contenido-publicacion" rows="3" required placeholder="Escribí las consignas...">${valorContenido}</textarea>
      
      <label for="fecha-limite-tarea">Fecha y hora límite de entrega:</label>
      <input type="datetime-local" id="fecha-limite-tarea" required value="${valorFecha}">
      
      <label for="puntaje-max-tarea">Puntaje máximo:</label>
      <input type="number" id="puntaje-max-tarea" min="1" max="1000" required value="${valorPuntaje}">
    `;
  } else if (tipo === "enlace") {
    contenedor.innerHTML = `
      <label for="contenido-publicacion">Enlace web (https://...):</label>
      <input type="text" id="contenido-publicacion" required placeholder="https://ejemplo.com" value="${valorContenido}">
    `;
  } else if (tipo === "archivo") {
    contenedor.innerHTML = `
      <label for="archivo-publicacion">Seleccionar archivo (PDF, Word, Imagen, etc.):</label>
      <input type="file" id="archivo-publicacion" required>
      <small id="info-pub-archivo" style="color:var(--color-texto-secundario); font-size:0.8rem;"></small>
    `;
  } else {
    contenedor.innerHTML = `
      <label for="contenido-publicacion">Contenido / Apunte:</label>
      <textarea id="contenido-publicacion" rows="4" required placeholder="Escribí el texto...">${valorContenido}</textarea>
    `;
  }
}

function procesarGuardadoPublicacion() {
  const idEditando = document.getElementById("id-publicacion-editando").value;
  const tipo = document.getElementById("tipo-publicacion").value;
  const titulo = document.getElementById("titulo-publicacion").value.trim();

  if (!titulo) {
    alert("El título es obligatorio.");
    return;
  }

  if (tipo === "tarea") {
    const consigna = document.getElementById("contenido-publicacion").value.trim();
    const fechaLimite = document.getElementById("fecha-limite-tarea").value;
    const puntajeMax = Number(document.getElementById("puntaje-max-tarea").value);

    if (!fechaLimite) {
      alert("La fecha límite es obligatoria para las tareas.");
      return;
    }

    if (idEditando) {
      const tarea = baseDatos.tareas.find(t => t.id === Number(idEditando));
      if (tarea) {
        tarea.titulo = titulo;
        tarea.consigna = consigna;
        tarea.fechaLimite = fechaLimite;
        tarea.puntajeMax = puntajeMax;
      }
    } else {
      const nuevoId = baseDatos.tareas.length > 0 ? Math.max(...baseDatos.tareas.map(t => t.id)) + 1 : 1;
      baseDatos.tareas.push({
        id: nuevoId,
        cursoId: cursoActualId,
        titulo,
        consigna,
        fechaLimite,
        puntajeMax,
        fecha: Date.now()
      });
    }
    if (guardarDatos()) {
      renderizarMuro();
      renderizarCalendarioVencimientos();
      resetearFormularioPublicacion();
      alert("¡Tarea guardada con éxito!");
    }
  } else if (tipo === "archivo") {
    const inputArchivo = document.getElementById("archivo-publicacion");
    const archivo = inputArchivo.files[0];

    if (!archivo && !idEditando) {
      alert("Debes seleccionar un archivo.");
      return;
    }

    if (archivo && archivo.size > 2 * 1024 * 1024) {
      alert("⚠️ El archivo es demasiado pesado (supera los 2 MB). Por favor, subilo a Google Drive y compartilo como enlace web.");
      return;
    }

    if (archivo) {
      const lector = new FileReader();
      lector.onload = function(evento) {
        const archivoDatos = {
          nombre: archivo.name,
          tipo: archivo.type,
          datos: evento.target.result
        };
        guardarMaterialConArchivo(idEditando, tipo, titulo, archivoDatos);
      };
      lector.readAsDataURL(archivo);
    } else {
      const matAnt = baseDatos.materiales.find(m => m.id === Number(idEditando));
      guardarMaterialConArchivo(idEditando, tipo, titulo, matAnt ? matAnt.archivo : null);
    }
  } else {
    const contenido = document.getElementById("contenido-publicacion").value.trim();
    guardarMaterialConArchivo(idEditando, tipo, titulo, contenido);
  }
}

function guardarMaterialConArchivo(idEditando, tipo, titulo, contenidoOArchivo) {
  if (idEditando) {
    const mat = baseDatos.materiales.find(m => m.id === Number(idEditando));
    if (mat) {
      mat.tipo = tipo;
      mat.titulo = titulo;
      if (tipo === "archivo") mat.archivo = contenidoOArchivo;
      else mat.contenido = contenidoOArchivo;
    }
  } else {
    const nuevoId = baseDatos.materiales.length > 0 ? Math.max(...baseDatos.materiales.map(m => m.id)) + 1 : 1;
    const nuevoMat = {
      id: nuevoId,
      cursoId: cursoActualId,
      tipo,
      titulo,
      fecha: Date.now()
    };
    if (tipo === "archivo") nuevoMat.archivo = contenidoOArchivo;
    else nuevoMat.contenido = contenidoOArchivo;

    baseDatos.materiales.push(nuevoMat);
  }

  if (guardarDatos()) {
    renderizarMuro();
    resetearFormularioPublicacion();
    alert("¡Publicación guardada con éxito!");
  }
}

/* ==========================================
   COMENTARIOS EN CADA MATERIAL DEL MURO
   ========================================== */

function renderizarMuro() {
  const contenedor = document.getElementById("muro-publicaciones");
  if (!contenedor || !cursoActualId) return;
  contenedor.innerHTML = "";

  const elementos = [
    ...baseDatos.materiales.filter(m => m.cursoId === cursoActualId).map(m => ({ ...m, categoria: 'material' })),
    ...baseDatos.tareas.filter(t => t.cursoId === cursoActualId).map(t => ({
      ...t,
      tipo: "tarea",
      contenido: t.consigna,
      categoria: 'tarea'
    }))
  ].sort((a, b) => b.fecha - a.fecha);

  if (elementos.length === 0) {
    contenedor.innerHTML = "<p>No hay publicaciones en el muro todavía.</p>";
    return;
  }

  elementos.forEach(item => {
    const div = document.createElement("div");
    div.className = "elemento-muro";
    let icono = item.tipo === "enlace" ? "🔗" : item.tipo === "tarea" ? "📋" : item.tipo === "archivo" ? "📁" : "📝";

    let cuerpo = "";
    if (item.tipo === "tarea") {
      cuerpo = `<p><strong>Consigna:</strong> ${item.contenido}</p><p style="font-size:0.85rem; color:#718096;">📅 Vence: ${item.fechaLimite.replace("T"," ")} | 🏆 ${item.puntajeMax} pts</p>`;
    } else if (item.tipo === "archivo" && item.archivo) {
      cuerpo = `<p>📎 <strong>Archivo adjunto:</strong> <a href="${item.archivo.datos}" download="${item.archivo.nombre}" target="_blank" style="color:var(--color-primario); font-weight:500;">${item.archivo.nombre} (Descargar / Ver)</a></p>`;
    } else if (item.tipo === "enlace") {
      cuerpo = `<a href="${item.contenido}" target="_blank" style="color:var(--color-primario);">${item.contenido} ↗</a>`;
    } else {
      cuerpo = `<p>${item.contenido || ""}</p>`;
    }

    const pubKey = `${item.categoria}_${item.id}`;
    const comentariosItem = baseDatos.comentarios.filter(c => c.pubKey === pubKey);

    let htmlComentarios = comentariosItem.map(c => `
      <li class="comentario-item">
        <strong>${c.autor}:</strong> ${c.texto}
      </li>
    `).join("");

    div.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: flex-start; width: 100%;">
        <div class="icono-publicacion">${icono}</div>
        <div class="contenido-publicacion-detalle">
          <h4>${item.titulo}</h4>
          ${cuerpo}
          <div class="acciones-tarjeta solo-docente" style="display: ${baseDatos.modo === 'docente' ? 'flex' : 'none'}; margin-top:0.5rem;">
            <button type="button" class="btn-editar-pub" data-id="${item.id}" data-tipo="${item.tipo}">Editar</button>
            <button type="button" class="btn-borrar-pub" data-id="${item.id}" data-tipo="${item.tipo}">Borrar</button>
          </div>
        </div>
      </div>

      <!-- Sección de Comentarios -->
      <div class="seccion-comentarios">
        <h5 style="font-size: 0.9rem; color: var(--color-texto);">💬 Comentarios (${comentariosItem.length})</h5>
        <ul class="lista-comentarios">
          ${htmlComentarios.length > 0 ? htmlComentarios : '<li style="font-size: 0.85rem; color: var(--color-texto-secundario);">No hay comentarios aún. ¡Escribe el primero!</li>'}
        </ul>
        <form class="form-agregar-comentario" data-pubkey="${pubKey}" style="margin: 0; padding: 0.6rem; border: none; box-shadow: none; background: transparent;">
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" class="input-texto-comentario" placeholder="Escribe un comentario..." required style="flex: 1; padding: 0.4rem 0.6rem; font-size: 0.85rem;">
            <button type="submit" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Comentar</button>
          </div>
        </form>
      </div>
    `;

    div.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT" || e.target.tagName === "FORM") return;
      if (item.tipo === "tarea") abrirTarea(item.id);
    });

    contenedor.appendChild(div);
  });

  contenedor.querySelectorAll(".btn-editar-pub").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      cargarPublicacionParaEditar(Number(btn.dataset.id), btn.dataset.tipo);
    });
  });

  contenedor.querySelectorAll(".btn-borrar-pub").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      borrarPublicacion(Number(btn.dataset.id), btn.dataset.tipo);
    });
  });

  contenedor.querySelectorAll(".form-agregar-comentario").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const pubKey = form.dataset.pubkey;
      const input = form.querySelector(".input-texto-comentario");
      const texto = input.value.trim();

      if (!texto) return;

      let autor = baseDatos.modo === "docente" ? "Profesor/a" : (baseDatos.alumnoActual || "Alumno Anónimo");

      baseDatos.comentarios.push({
        pubKey,
        autor,
        texto,
        fecha: Date.now()
      });

      if (guardarDatos()) {
        renderizarMuro();
      }
    });
  });
}

function abrirTarea(tareaId) {
  tareaActualId = tareaId;
  const tarea = baseDatos.tareas.find(t => t.id === tareaId);
  if (!tarea) return;

  document.getElementById("titulo-tarea-actual").textContent = tarea.titulo;
  document.getElementById("consigna-tarea-actual").textContent = tarea.consigna;
  document.getElementById("meta-fecha-limite").textContent = `📅 Vencimiento: ${tarea.fechaLimite.replace("T", " ")}`;
  document.getElementById("meta-puntaje").textContent = `🏆 Puntaje Máx: ${tarea.puntajeMax} pts`;

  renderizarEntregas();
  mostrarVista("tarea");
}

function cargarPublicacionParaEditar(id, tipo) {
  if (tipo === "tarea") {
    const tarea = baseDatos.tareas.find(t => t.id === id);
    if (!tarea) return;
    document.getElementById("id-publicacion-editando").value = tarea.id;
    document.getElementById("tipo-publicacion").value = "tarea";
    document.getElementById("titulo-publicacion").value = tarea.titulo;
    actualizarCampoContenido("tarea", tarea.consigna, tarea.fechaLimite, tarea.puntajeMax);
  } else {
    const mat = baseDatos.materiales.find(m => m.id === id);
    if (!mat) return;
    document.getElementById("id-publicacion-editando").value = mat.id;
    document.getElementById("tipo-publicacion").value = mat.tipo;
    document.getElementById("titulo-publicacion").value = mat.titulo;
    actualizarCampoContenido(mat.tipo, mat.tipo === "archivo" ? "" : mat.contenido);
    
    if (mat.tipo === "archivo" && mat.archivo) {
      const info = document.getElementById("info-pub-archivo");
      if (info) info.textContent = `Archivo actual: ${mat.archivo.nombre}`;
    }
  }

  document.getElementById("titulo-formulario-publicacion").textContent = "Editar publicación";
  document.getElementById("boton-guardar-publicacion").textContent = "Guardar Cambios";
  document.getElementById("boton-cancelar-edicion-publicacion").style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function borrarPublicacion(id, tipo) {
  if (confirm("¿Estás seguro de eliminar esta publicación?")) {
    if (tipo === "tarea") {
      baseDatos.tareas = baseDatos.tareas.filter(t => t.id !== id);
      baseDatos.entregas = baseDatos.entregas.filter(e => e.tareaId !== id);
      baseDatos.comentarios = baseDatos.comentarios.filter(c => c.pubKey !== `tarea_${id}`);
    } else {
      baseDatos.materiales = baseDatos.materiales.filter(m => m.id !== id);
      baseDatos.comentarios = baseDatos.comentarios.filter(c => c.pubKey !== `material_${id}`);
    }
    if (guardarDatos()) {
      renderizarMuro();
      renderizarCalendarioVencimientos();
    }
  }
}

function resetearFormularioPublicacion() {
  document.getElementById("formulario-publicar").reset();
  document.getElementById("id-publicacion-editando").value = "";
  document.getElementById("tipo-publicacion").value = "texto";
  document.getElementById("titulo-formulario-publicacion").textContent = "Publicar en el muro";
  document.getElementById("boton-guardar-publicacion").textContent = "Publicar";
  document.getElementById("boton-cancelar-edicion-publicacion").style.display = "none";
  actualizarCampoContenido("texto");
}

/* ==========================================
   GESTIÓN DE ENTREGAS
   ========================================== */

function inicializarFormularioEntrega() {
  const form = document.getElementById("formulario-entrega");
  const btnFijar = document.getElementById("boton-fijar-alumno");
  const btnCancelarEntrega = document.getElementById("boton-cancelar-entrega");

  if (btnFijar) {
    btnFijar.addEventListener("click", () => {
      const nombre = document.getElementById("input-alumno-actual").value.trim();
      if (!nombre) {
        alert("Ingresá tu nombre.");
        return;
      }
      baseDatos.alumnoActual = nombre;
      guardarDatos();
      renderizarEntregas();
      alert(`¡Hola, ${nombre}!`);
    });
  }

  if (btnCancelarEntrega) {
    btnCancelarEntrega.addEventListener("click", resetearFormularioEntrega);
  }

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!baseDatos.alumnoActual) {
      alert("Establecé tu nombre de alumno primero.");
      return;
    }

    const idEntregaEditando = document.getElementById("id-entrega-editando").value;
    const respuestaTexto = document.getElementById("respuesta-entrega").value.trim();
    const inputArchivo = document.getElementById("archivo-entrega");
    const archivo = inputArchivo.files[0];
    const tarea = baseDatos.tareas.find(t => t.id === tareaActualId);
    
    if (!tarea) {
      alert("Error: No se encontró la tarea.");
      return;
    }

    const ahora = new Date().toISOString().slice(0, 16);
    let estado = (tarea.fechaLimite && ahora > tarea.fechaLimite) ? "tarde" : "a tiempo";

    if (archivo) {
      if (archivo.type.startsWith("image/")) {
        const lector = new FileReader();
        lector.onload = function(evento) {
          const img = new Image();
          img.onload = function() {
            const canvas = document.createElement("canvas");
            let ancho = img.width;
            let alto = img.height;
            const anchoMaximo = 800;

            if (ancho > anchoMaximo) {
              alto = Math.round((alto * anchoMaximo) / ancho);
              ancho = anchoMaximo;
            }

            canvas.width = ancho;
            canvas.height = alto;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, ancho, alto);

            const datosComprimidos = canvas.toDataURL("image/jpeg", 0.6);
            const tamanioBytes = Math.round((datosComprimidos.length * 3) / 4);
            const tamanioKB = Math.round(tamanioBytes / 1024);

            if (tamanioKB > 200) {
              alert(`⚠️ Advertencia: La imagen comprimida pesa ${tamanioKB} KB (supera los 200 KB recomendados para localStorage).`);
            }

            const archivoDatos = {
              nombre: archivo.name.replace(/\.[^/.]+$/, "") + ".jpg",
              tipo: "image/jpeg",
              datos: datosComprimidos
            };
            procesarGuardadoEntrega(idEntregaEditando, respuestaTexto, archivoDatos, estado);
          };
          img.src = evento.target.result;
        };
        lector.readAsDataURL(archivo);
      } else {
        if (archivo.size > 2 * 1024 * 1024) {
          alert("⚠️ El archivo es demasiado pesado (supera los 2 MB). Por favor, subilo a Google Drive y compartinos el enlace.");
          return;
        }
        const lector = new FileReader();
        lector.onload = function(evento) {
          const archivoDatos = {
            nombre: archivo.name,
            tipo: archivo.type,
            datos: evento.target.result
          };
          procesarGuardadoEntrega(idEntregaEditando, respuestaTexto, archivoDatos, estado);
        };
        lector.readAsDataURL(archivo);
      }
    } else {
      let archivoAnterior = null;
      if (idEntregaEditando) {
        const entregaAnt = baseDatos.entregas.find(en => en.id === Number(idEntregaEditando));
        if (entregaAnt) archivoAnterior = entregaAnt.archivo;
      }
      procesarGuardadoEntrega(idEntregaEditando, respuestaTexto, archivoAnterior, estado);
    }
  });
}

function procesarGuardadoEntrega(idEditando, respuestaTexto, archivoDatos, estado) {
  if (idEditando) {
    const entrega = baseDatos.entregas.find(e => e.id === Number(idEditando));
    if (entrega) {
      entrega.respuesta = respuestaTexto;
      if (archivoDatos !== undefined) entrega.archivo = archivoDatos;
      entrega.fechaEntrega = new Date().toISOString().slice(0, 16);
      entrega.estado = estado;
    }
  } else {
    const nuevoId = baseDatos.entregas.length > 0 ? Math.max(...baseDatos.entregas.map(e => e.id)) + 1 : 1;
    baseDatos.entregas.push({
      id: nuevoId,
      tareaId: tareaActualId,
      nombreAlumno: baseDatos.alumnoActual,
      respuesta: respuestaTexto,
      archivo: archivoDatos,
      fechaEntrega: new Date().toISOString().slice(0, 16),
      estado,
      nota: null,
      devolucion: null
    });
  }

  if (guardarDatos()) {
    renderizarEntregas();
    resetearFormularioEntrega();
    alert("¡Entrega enviada con éxito!");
  }
}

function cargarEntregaParaEditar(idEntrega) {
  const entrega = baseDatos.entregas.find(e => e.id === idEntrega);
  if (!entrega) return;

  if (entrega.estado === "corregida") {
    alert("Esta entrega ya fue corregida y no se puede modificar.");
    return;
  }

  document.getElementById("id-entrega-editando").value = entrega.id;
  document.getElementById("respuesta-entrega").value = entrega.respuesta || "";
  
  const infoArchivo = document.getElementById("info-archivo-actual");
  if (infoArchivo) {
    infoArchivo.textContent = entrega.archivo ? `Archivo actual: ${entrega.archivo.nombre}` : "Sin archivo adjunto previo";
  }

  document.getElementById("titulo-formulario-entrega").textContent = "Editar mi entrega";
  document.getElementById("boton-enviar-entrega").textContent = "Guardar Cambios";
  document.getElementById("boton-cancelar-entrega").style.display = "inline-block";

  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function resetearFormularioEntrega() {
  document.getElementById("formulario-entrega").reset();
  document.getElementById("id-entrega-editando").value = "";
  const infoArchivo = document.getElementById("info-archivo-actual");
  if (infoArchivo) infoArchivo.textContent = "";
  document.getElementById("titulo-formulario-entrega").textContent = "Realizar entrega";
  document.getElementById("boton-enviar-entrega").textContent = "Entregar Tarea";
  document.getElementById("boton-cancelar-entrega").style.display = "none";
}

function renderizarEntregas() {
  const lista = document.getElementById("lista-entregas");
  if (!lista || !tareaActualId) return;
  lista.innerHTML = "";

  const tarea = baseDatos.tareas.find(t => t.id === tareaActualId);
  const entregas = baseDatos.entregas.filter(e => e.tareaId === tareaActualId);

  const metaPendientes = document.getElementById("meta-pendientes");
  if (metaPendientes) {
    metaPendientes.textContent = `⏳ Faltan corregir: ${entregas.filter(e => e.estado !== "corregida").length}`;
  }

  if (baseDatos.modo === "alumno") {
    const formEntrega = document.getElementById("formulario-entrega");
    if (formEntrega) formEntrega.style.display = baseDatos.alumnoActual ? "flex" : "none";
    
    const misEntregas = entregas.filter(e => e.nombreAlumno.toLowerCase() === (baseDatos.alumnoActual || "").toLowerCase());

    if (misEntregas.length === 0) {
      lista.innerHTML = "<li><p>No realizaste entregas aún.</p></li>";
      return;
    }

    misEntregas.forEach(en => {
      let archivoHtml = "";
      if (en.archivo) {
        archivoHtml = `<p>📎 <strong>Archivo adjunto:</strong> <a href="${en.archivo.datos}" download="${en.archivo.nombre}" target="_blank" style="color:var(--color-primario); font-weight:500;">${en.archivo.nombre} (Descargar / Ver)</a></p>`;
      }

      let btnEditarHtml = en.estado !== "corregida" 
        ? `<button type="button" class="btn-editar-entrega" data-id="${en.id}" style="background-color: var(--color-violeta-suave); font-size: 0.8rem; padding: 0.4rem 0.8rem; align-self: flex-start; margin-top: 0.5rem;">Editar Entrega</button>` 
        : "";

      lista.innerHTML += `
        <li class="elemento-entrega">
          <h4>👤 ${en.nombreAlumno} <span class="etiqueta-estado estado-${en.estado}">${en.estado}</span></h4>
          ${en.respuesta ? `<p><strong>Comentario:</strong> ${en.respuesta}</p>` : ""}
          ${archivoHtml}
          <p style="font-size:0.8rem; color:#718096;">📅 Entregado el: ${en.fechaEntrega.replace("T"," ")}</p>
          ${en.estado === "corregida" ? `<div style="background:#f0fff4; padding:0.8rem; border-radius:8px; margin-top:0.5rem;"><p style="color:#22543d; font-weight:bold;">🏆 Nota: ${en.nota}/${tarea.puntajeMax}</p><p style="color:#22543d;">💬 ${en.devolucion}</p></div>` : `<p style="color:#dd6b20; font-size:0.85rem;">⏳ Pendiente de corrección</p>`}
          ${btnEditarHtml}
        </li>
      `;
    });

    lista.querySelectorAll(".btn-editar-entrega").forEach(btn => {
      btn.addEventListener("click", () => cargarEntregaParaEditar(Number(btn.dataset.id)));
    });

  } else {
    if (entregas.length === 0) {
      lista.innerHTML = "<li><p>No hay entregas recibidas de alumnos.</p></li>";
      return;
    }

    entregas.forEach(en => {
      let archivoHtml = "";
      if (en.archivo) {
        archivoHtml = `<p>📎 <strong>Archivo adjunto:</strong> <a href="${en.archivo.datos}" download="${en.archivo.nombre}" target="_blank" style="color:var(--color-primario); font-weight:500;">${en.archivo.nombre} (Descargar / Ver archivo)</a></p>`;
      }

      const li = document.createElement("li");
      li.className = "elemento-entrega";
      li.innerHTML = `
        <h4>👤 ${en.nombreAlumno} <span class="etiqueta-estado estado-${en.estado}">${en.estado}</span></h4>
        ${en.respuesta ? `<p><strong>Comentario:</strong> ${en.respuesta}</p>` : ""}
        ${archivoHtml}
        <p style="font-size:0.8rem; color:#718096;">📅 Entregado el: ${en.fechaEntrega.replace("T"," ")}</p>
        <form class="form-calificar" data-id="${en.id}" style="margin-top:0.8rem; background:var(--color-fondo); padding:1rem; border-radius:8px;">
          <h4 style="font-size:0.95rem; margin-bottom:0.5rem;">Calificar entrega</h4>
          <label>Nota (1 al ${tarea.puntajeMax}):</label>
          <input type="number" class="input-nota" min="1" max="${tarea.puntajeMax}" value="${en.nota || ''}" required style="margin-bottom:0.5rem;">
          <label>Devolución:</label>
          <textarea class="txt-devolucion" required style="margin-bottom:0.5rem;" placeholder="Escribí comentarios...">${en.devolucion || ''}</textarea>
          <button type="submit" style="padding:0.4rem 1rem; font-size:0.85rem;">Guardar Calificación</button>
        </form>
      `;
      lista.appendChild(li);
    });

    lista.querySelectorAll(".form-calificar").forEach(f => {
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const idEntrega = Number(f.dataset.id);
        const nota = Number(f.querySelector(".input-nota").value);
        const devolucion = f.querySelector(".txt-devolucion").value.trim();

        const en = baseDatos.entregas.find(x => x.id === idEntrega);
        if (en) {
          en.nota = nota;
          en.devolucion = devolucion;
          en.estado = "corregida";
          if (guardarDatos()) {
            renderizarEntregas();
            alert("¡Calificación guardada con éxito!");
          }
        }
      });
    });
  }
}

/* ==========================================
   GESTIÓN DE DATOS JSON (Exportar / Importar)
   ========================================== */

function inicializarExportarImportar() {
  const btnExportar = document.getElementById("boton-exportar");
  const btnImportar = document.getElementById("boton-importar");
  const inputImportar = document.getElementById("input-archivo-importar");

  if (btnExportar) {
    btnExportar.addEventListener("click", async () => {
      const jsonStr = JSON.stringify(baseDatos, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const archivo = new File([blob], "aula-datos.json", { type: "application/json" });

      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        try {
          await navigator.share({
            title: "Datos del Aula Virtual",
            text: "Copia de seguridad en formato JSON",
            files: [archivo]
          });
          return;
        } catch (error) {
          if (error.name !== "AbortError") {
            console.log("Error al compartir:", error);
          } else {
            return;
          }
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aula-datos.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (btnImportar && inputImportar) {
    btnImportar.addEventListener("click", () => {
      inputImportar.click();
    });

    inputImportar.addEventListener("change", (e) => {
      const archivo = e.target.files[0];
      if (!archivo) return;

      const lector = new FileReader();
      lector.onload = function(evento) {
        try {
          baseDatos = JSON.parse(evento.target.result);
          guardarDatos();
          actualizarInterfazRol();
          alert("¡Datos importados con éxito!");
        } catch (err) {
          alert("❌ El archivo JSON no es válido.");
        }
      };
      lector.readAsText(archivo);
    });
  }
}

/* ==========================================
   AVISO DISCRETO DE CONEXIÓN (Paso 7)
   ========================================== */

function inicializarAvisoConexion() {
  if (document.getElementById("aviso-conexion")) return;

  const aviso = document.createElement("div");
  aviso.id = "aviso-conexion";
  aviso.style.cssText = `
    background-color: #feebc8;
    color: #7b341e;
    text-align: center;
    padding: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    display: none;
    border-bottom: 1px solid #fbd38d;
    position: sticky;
    top: 0;
    z-index: 9999;
  `;
  aviso.textContent = "Sin conexión: tus datos se siguen guardando en este celular";
  document.body.prepend(aviso);

  function actualizarEstadoConexion() {
    if (!navigator.onLine) {
      aviso.style.display = "block";
    } else {
      aviso.style.display = "none";
    }
  }

  window.addEventListener("online", actualizarEstadoConexion);
  window.addEventListener("offline", actualizarEstadoConexion);
  
  actualizarEstadoConexion();
}

/* ==========================================
   INICIALIZACIÓN GENERAL
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();

  const selectorRol = document.getElementById("selector-rol");
  if (selectorRol) {
    selectorRol.addEventListener("change", (e) => {
      baseDatos.modo = e.target.value;
      guardarDatos();
      actualizarInterfazRol();
    });
  }

  document.getElementById("boton-volver-cursos")?.addEventListener("click", () => mostrarVista("mis-cursos"));
  document.getElementById("boton-volver-curso")?.addEventListener("click", () => {
    tareaActualId = null;
    mostrarVista("curso");
  });

  inicializarFormularioCurso();
  inicializarFormularioPublicar();
  inicializarFormularioEntrega();
  inicializarExportarImportar();
  inicializarAvisoConexion();
  actualizarInterfazRol();
  mostrarVista("mis-cursos");
});

/* ==========================================
   REGISTRO Y DETECCIÓN DE ACTUALIZACIÓN (Paso 4 y Paso 8)
   ========================================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then((reg) => {
        console.log("Service Worker registrado con éxito:", reg.scope);

        // Detectar si hay una nueva versión lista para instalar (Paso 8)
        reg.addEventListener("updatefound", () => {
          const nuevoWorker = reg.installing;
          if (nuevoWorker) {
            nuevoWorker.addEventListener("statechange", () => {
              if (nuevoWorker.state === "installed" && navigator.serviceWorker.controller) {
                alert("Hay una versión nueva: cerrá y volvé a abrir la app");
              }
            });
          }
        });
      })
      .catch((err) => {
        console.log("Error al registrar el Service Worker:", err);
      });
  });
}