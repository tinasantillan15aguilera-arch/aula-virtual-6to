/* ==========================================
   GESTIÓN DE DATOS JSON (Exportar / Importar Corregido PC/Celular)
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

      // Verificamos si estamos en un dispositivo móvil con soporte real de share con archivos
      const esCelular = /Mobi|Android/i.test(navigator.userAgent);

      if (esCelular && navigator.canShare && navigator.canShare({ files: [archivo] })) {
        try {
          await navigator.share({
            title: "Datos del Aula Virtual",
            text: "Copia de seguridad en formato JSON",
            files: [archivo]
          });
          return;
        } catch (error) {
          if (error.name !== "AbortError") {
            console.log("Error al compartir en móvil, usando descarga:", error);
          } else {
            return; // Si el usuario canceló, no hacemos nada
          }
        }
      }

      // Descarga tradicional directa (Ideal para PC y navegadores de escritorio)
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aula-datos.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
          inputImportar.value = ""; // Limpiamos para permitir reimportar el mismo archivo si hace falta
        } catch (err) {
          alert("❌ El archivo JSON no es válido.");
        }
      };
      lector.readAsText(archivo);
    });
  }
}