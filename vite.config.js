// vite.config.js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // Indica la ruta base de tu aplicación.
  // Normalmente se deja '/' al desarrollar localmente.
  base: '/',

  // Configuración para el servidor de desarrollo
  server: {
    // Puerto en el que correrá Vite en local.
    port: 3000,
    // Abre automáticamente el navegador al iniciar el servidor.
    open: true
  },

  // Configuración para el build (para producción)
  build: {
    // Carpeta donde se generarán los archivos cuando ejecutes `npm run build`
    outDir: 'dist'
  }
})


