// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // Base es la ruta base de tu aplicación
  // (usualmente se deja "/" por defecto)
  base: '/',

  // Configuración de build
  build: {
    // La carpeta donde se generarán tus archivos compilados
    outDir: 'dist',

    // Otras opciones de build
    // por ejemplo sourcemap: true
    // sourcemap: true,
  },

  // Configuración del servidor de desarrollo
  server: {
    port: 3000
  }
})

