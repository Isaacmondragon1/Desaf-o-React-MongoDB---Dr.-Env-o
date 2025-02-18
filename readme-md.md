# Desafío React/MongoDB - Dr. Envío

## Introducción

Este proyecto es una solución para el Desafío React/MongoDB de Dr. Envío. La aplicación permite gestionar productos y precios especiales para diferentes usuarios. Consta de un frontend desarrollado en React con TypeScript, un backend con Node.js y Express, y utiliza MongoDB como base de datos.

## Pasos para ejecutar localmente

### Requisitos previos
- Node.js (v14 o superior)
- npm o yarn
- MongoDB Atlas (se proporciona la URL de conexión)

### Backend
1. Navega a la carpeta del backend:
   ```
   cd backend
   ```
2. Instala las dependencias:
   ```
   npm install
   ```
3. Inicia el servidor en modo desarrollo:
   ```
   npm run dev
   ```
   El servidor estará disponible en http://localhost:5000

### Frontend
1. Navega a la carpeta del frontend:
   ```
   cd frontend
   ```
2. Instala las dependencias:
   ```
   npm install
   ```
3. Inicia la aplicación:
   ```
   npm start
   ```
   La aplicación estará disponible en http://localhost:3000

## Justificación de elecciones técnicas

### TypeScript vs JavaScript
He elegido **TypeScript** por las siguientes razones:
- **Tipado estático**: Permite detectar errores en tiempo de compilación
- **Mejor documentación**: Los tipos sirven como documentación integrada
- **Autocompletado mejorado**: Facilita el desarrollo y reduce errores
- **Mantenibilidad**: En proyectos que crecen, TypeScript facilita el refactoring y la comprensión del código

### Estructura del proyecto
- **Monorepo simplificado**: Mantener el frontend y backend en carpetas separadas facilita el desarrollo y el despliegue independiente
- **Arquitectura MVC en el backend**: Organización en controladores, modelos y rutas para una mejor separación de responsabilidades
- **Componentes y páginas en el frontend**: Separación clara entre componentes reutilizables y páginas específicas

### MongoDB (Diseño de la colección)
Para la colección de precios especiales (`preciosEspecialesPerez42`), he diseñado la siguiente estructura:
- `userId`: Identificador del usuario
- `productSku`: SKU del producto (permite relacionarlo con la colección productos)
- `price`: Precio especial para el usuario

He creado un índice compuesto sobre `userId` y `productSku` para optimizar las consultas y garantizar que no haya duplicados.

### Context API para gestión de estado
En lugar de usar Redux, he optado por Context API por:
- **Simplicidad**: Para una aplicación de este tamaño, Context API es suficiente
- **Integración nativa**: Es parte de React, no requiere dependencias adicionales
- **Curva de aprendizaje**: Es más sencillo de entender y mantener

## Descripción de la estructura del proyecto

### Backend
- **controllers/**: Contiene la lógica de negocio
- **models/**: Define los esquemas de MongoDB
- **routes/**: Configura las rutas de la API
- **config/**: Configuraciones como la conexión a MongoDB
- **index.ts**: Punto de entrada de la aplicación

### Frontend
- **api/**: Contiene los métodos para comunicarse con el backend
- **components/**: Componentes reutilizables (Navbar, etc.)
- **pages/**: Páginas principales (ArticlesPage, UploadPage)
- **context/**: Contextos para el estado global (UserContext)
- **types/**: Definiciones de interfaces y tipos
- **App.tsx**: Componente principal con la configuración de rutas
- **index.tsx**: Punto de entrada de la aplicación React

## Funcionalidades implementadas

1. **Vista de Artículos**: Muestra todos los productos con sus precios. Si un usuario tiene precios especiales, estos se muestran resaltados.
2. **Subida de Precios Especiales**: Permite agregar precios especiales para los usuarios seleccionados.
3. **Selección de Usuario**: Simula un login básico para probar diferentes usuarios.
4. **Validación**: Verifica que los precios especiales sean menores que los precios originales.

## Consideraciones adicionales

- **Seguridad**: En un entorno de producción, se debería implementar autenticación JWT y protección contra CSRF.
- **Optimización**: Para una aplicación más grande, se podrían implementar técnicas como memoización o virtualización de listas.
- **Despliegue**: El proyecto está estructurado para facilitar el despliegue en plataformas como Vercel (frontend) y Heroku (backend).
