# Guía del Modo Demo - EmprendU Frontend

## ¿Qué es el Modo Demo?

El modo demo permite mostrar avances al cliente sin depender del backend real. Funciona completamente offline usando datos falsos almacenados en localStorage, imitando las respuestas de la API real.

**Scope:** Solo funciona para las páginas de Perfil (`/perfil` y `/perfil/editar`) y sus servicios relacionados.

## 🚀 Cómo Activar el Modo Demo

### 1. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto frontend (si no existe) y agrega:

```bash
# Copiar desde .env.example
cp .env.example .env
```

Edita el archivo `.env` y configura:
```env
VITE_DEMO_MODE=true
VITE_DEMO_TOKEN=demo-123
```

### 2. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

### 3. Navegar a las Páginas de Perfil
- Ve a `/perfil` - Verás el perfil con datos demo
- Ve a `/perfil/editar` - Podrás editar el perfil con datos demo

## 🔄 Cómo Desactivar el Modo Demo

### 1. Cambiar Variable de Entorno
Edita el archivo `.env`:
```env
VITE_DEMO_MODE=false
```

### 2. Limpiar Datos Demo (Opcional)
Abre la consola del navegador (F12) y ejecuta:
```javascript
localStorage.removeItem('demo_profile');
localStorage.removeItem('demo_interests');
localStorage.removeItem('demo_favorites');
```

### 3. Reiniciar Servidor
```bash
# Detener servidor (Ctrl+C) y reiniciar
npm run dev
```

## 📊 Datos Demo Incluidos

### Perfil de Usuario
```json
{
  "id": 2568,
  "name": "Juan Fallas",
  "username": "JuanFallas2568",
  "role": "comprador",
  "email": "nombre@ejemplo.com",
  "phone": "+506 0000 0000",
  "location": {
    "province": "San José",
    "canton": "Hatillo", 
    "district": "Merced",
    "address": "200m norte del parque"
  },
  "avatar_url": "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg"
}
```

### Intereses
- Comida
- Joyería
- Ropa
- Arte

### Favoritos
- Panadería Alma (Comida)
- Bisutería La Abuelita (Joyería)

## ⚙️ Funcionalidades en Modo Demo

### ✅ Lo que SÍ funciona:
- Ver perfil de usuario
- Editar información del perfil
- Cambiar contraseña (simulado)
- Gestionar intereses
- Ver favoritos
- Subir avatar (simulado)
- Todas las validaciones de formulario
- Loaders y estados de carga
- Navegación entre páginas

### ❌ Lo que NO funciona:
- Validación real de credenciales
- Conexión con backend Laravel
- Persistencia real de datos
- Autenticación real
- Otras páginas fuera del scope de perfil

## 🔧 Características Técnicas

### Autenticación Demo
- Token falso: `demo-123`
- No valida credenciales reales
- Desactiva errores de sesión expirada

### Almacenamiento
- Datos en `localStorage` del navegador
- Claves: `demo_profile`, `demo_interests`, `demo_favorites`
- Simula latencia de red (150-400ms)

### Reversibilidad
- Cambio instantáneo con variable de entorno
- No afecta código de producción
- No requiere cambios de código adicionales

## 🚨 Importante

1. **No commitear archivos .env** - Están en .gitignore
2. **Limpiar datos demo** antes de presentar la versión final
3. **El modo demo es solo para perfil** - otras funciones seguirán requiriendo backend
4. **Reversión toma menos de 1 minuto** - solo cambiar .env y reiniciar

## 🐛 Resolución de Problemas

### El modo demo no se activa
- Verificar que `VITE_DEMO_MODE=true` en `.env`
- Reiniciar el servidor de desarrollo
- Verificar que no hay errores en consola

### Los datos no se guardan
- Verificar que localStorage esté habilitado
- Limpiar caché del navegador
- Verificar que no estés en modo incógnito

### Volver a producción
- Cambiar `VITE_DEMO_MODE=false`
- Limpiar localStorage (opcional)
- Reiniciar servidor

## 📝 Notas para Desarrolladores

- El switch demo/producción está en `src/domain/profile/service.ts`
- La configuración demo está en `src/domain/demo.ts`
- La autenticación demo está en `src/domain/auth.ts`
- Los componentes Perfil.tsx y EditarPerfil.tsx manejan errores de demo
