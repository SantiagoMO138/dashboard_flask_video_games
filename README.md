Esta página es un **dashboard web para gestión y visualización de datos de ventas de videojuegos** construido con Flask. Te hago un resumen breve de sus funcionalidades principales:

## Funcionalidades Principales

### Autenticación y Roles
La aplicación maneja dos tipos de usuarios con diferentes permisos [1](#0-0) :
- **Administradores**: Acceso completo a CRUD y gestión de usuarios
- **Usuarios regulares**: Solo visualización del dashboard

### API Endpoints Principales
El sistema expone varios endpoints REST [2](#0-1) :

- `/api/video_games` - Obtiene todos los datos de videojuegos
- `/api/filtros` - Datos filtrados por parámetros (plataforma, género, año, editor) [3](#0-2) 
- `/api/opciones` - Opciones disponibles para filtros [4](#0-3) 
- `/api/list_video_games` - Lista completa con IDs (solo admins) [5](#0-4) 

### Operaciones CRUD (Solo Administradores)
Los administradores pueden gestionar videojuegos mediante endpoints protegidos:
- `POST /add/video_games` - Crear videojuego [6](#0-5) 
- `DELETE /del/video_games/<id>` - Eliminar videojuego [7](#0-6) 
- `PUT /upd/video_games/<id>` - Actualizar videojuego [8](#0-7) 

### Visualización de Datos
El dashboard incluye múltiples tipos de gráficos organizados en pestañas [9](#0-8) :
- Ventas por plataforma y región
- Ventas por género y año
- Gráficos radar y temporales
- Top editores y títulos

### Filtros Interactivos
Sistema de filtros dinámicos para visualizar datos específicos [10](#0-9) :
- Por plataforma, género, año y editor
- Actualización en tiempo real de gráficos

La página utiliza tecnologías como Flask, SQLAlchemy, Chart.js y DataTables para proporcionar una experiencia completa de análisis de datos de videojuegos.

## Notes

El sistema está diseñado con una arquitectura de tres capas (presentación, lógica de negocio, datos) y implementa control de acceso basado en roles. Los endpoints de la API están protegidos según el tipo de usuario, garantizando que solo los administradores puedan modificar datos.

Wiki pages you might want to explore:
- [Overview (SantiagoMO138/dashboard_flask_video_games)](/wiki/SantiagoMO138/dashboard_flask_video_games#1)
