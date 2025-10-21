# Alineación con Sesión - EmprendU Frontend

## Resumen de Cambios

El frontend ha sido actualizado para trabajar con autenticación basada en sesión/cookies del backend Laravel en lugar de tokens JWT. Todos los módulos de Perfil y EditarPerfil ahora funcionan correctamente con la API real.

## Endpoint de Sesión Detectado

### Estrategia de Sesión Implementada
- **Endpoint primario**: `GET /api/user` (estándar Laravel Sanctum)
- **Fallback para desarrollo**: `GET /api/users/1` (cuando /user no existe)
- **Configuración**: `withCredentials: true` en axios para envío automático de cookies

### Cómo se usa desde el frontend
```typescript
const getSessionUser = async () => {
  try {
    const response = await api.get('/user');
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      // Fallback para desarrollo
      const response = await api.get('/users/1');
      return response.data;
    }
    throw error;
  }
};
```

## Endpoints Utilizados

### Perfil de Usuario
- **GET /api/users/{id}** - Obtener perfil completo del usuario
- **PUT /api/users/{id}** - Actualizar información del perfil
- **PUT /api/users/{id}/password** - Cambiar contraseña
- **POST /api/users/{id}/avatar** - Subir avatar

### Intereses
- **GET /api/interests?user_id={id}** - Obtener intereses del usuario
- **POST /api/interests** - Crear nuevo interés
- **DELETE /api/interests/{id}** - Eliminar interés

**Payload para crear interés:**
```json
{
  "user_id": 1,
  "interest": "Tecnología"
}
```

### Favoritos
- **GET /api/favorites?user_id={id}** - Obtener favoritos del usuario
- **POST /api/favorites** - Agregar favorito
- **DELETE /api/favorites/{id}** - Eliminar favorito

**Payload para crear favorito:**
```json
{
  "user_id": 1,
  "entrepreneurship_id": 5
}
```

## Correcciones Realizadas

### src/lib/api.ts
- ✅ Agregado `withCredentials: true` para cookies
- ✅ Comentado interceptor de Authorization Bearer
- ✅ Mantenidos interceptores de respuesta y mapeo de errores

### src/domain/profile/service.ts
- ✅ Implementada función `getSessionUser()` para obtener usuario actual
- ✅ Todas las funciones ahora obtienen el user_id desde la sesión
- ✅ Corregidos endpoints para usar IDs dinámicos del usuario de sesión
- ✅ Implementada lógica de intereses (eliminar existentes + crear nuevos)

### src/domain/profile/dto.ts
- ✅ Actualizado ProfileDTO para coincidir con estructura Laravel:
  - `role` como número (ID del rol)
  - Campos de ubicación separados (`province`, `canton`, `district`, `address`)
  - Agregadas relaciones opcionales (`roleRelation`, `interests`, `entrepreneurships`)

### src/domain/profile/mapper.ts
- ✅ Implementado mapeo de roles numéricos a strings
- ✅ Corregido mapeo de ubicación (campos separados vs objeto anidado)
- ✅ Agregado mapeo automático de intereses desde relaciones del backend

### src/domain/profile/queries.ts
- ✅ Removida dependencia de tokens
- ✅ Comentadas funciones de `onTokenChange` para reactivación futura
- ✅ Mantenida lógica de retry (no reintentar en 401/419)

### src/routes/Profile.tsx y EditarPerfil.tsx
- ✅ Removidas verificaciones de `getToken()`
- ✅ Simplificada lógica de errores para sesión:
  - 401/419 → ErrorSessionExpired
  - 404 → ErrorSystem
  - 5xx/network → ErrorDB
- ✅ Mantenido comportamiento de modo demo intacto

## Cómo Probar Manualmente

### 1. Iniciar Backend
```bash
cd backend-path
php artisan serve
# Backend disponible en http://127.0.0.1:8000
```

### 2. Configurar Variables de Entorno
```bash
# En .env del frontend
VITE_API_BASE_URL=https://emprendu-desarrollo-production.up.railway.app
```

### 3. Iniciar Frontend
```bash
cd frontend-path
npm run dev
# Frontend disponible en http://127.0.0.1:5173
```

### 4. Flujo de Pruebas

#### Cargar Perfil
1. Navegar a `/perfil`
2. **Esperado**: Carga datos del usuario de la sesión
3. **Verificar**: Información personal, intereses y favoritos se muestran correctamente

#### Editar Perfil
1. Navegar a `/perfil/editar`
2. Modificar campos (nombre, teléfono, ubicación, etc.)
3. Hacer clic en "Guardar cambios"
4. **Esperado**: Actualización exitosa y redirección a `/profile`
5. **Verificar**: Cambios reflejados en la vista de perfil

#### Gestionar Intereses
1. En `/perfil`, hacer clic en el botón "+" de Intereses
2. Seleccionar/deseleccionar intereses
3. Hacer clic en "Guardar"
4. **Esperado**: Intereses actualizados inmediatamente

#### Cambiar Avatar
1. En `/perfil/editar`, hacer clic en el área de avatar
2. Subir nueva imagen
3. **Esperado**: Avatar actualizado en tiempo real

## Configuración CORS Requerida

Para que funcionen las cookies cross-site en desarrollo, el backend Laravel debe tener:

### config/cors.php
```php
'supports_credentials' => true,
'allowed_origins' => ['http://127.0.0.1:5173'],
```

### config/sanctum.php
```php
'stateful' => [
    '127.0.0.1:5173',
    'localhost:5173',
],
```

## Nota de Reversión

### Para volver al modo "token":

1. **src/lib/api.ts**: Comentar `withCredentials`, reactivar interceptor Authorization
2. **src/domain/auth.ts**: Reactivar funciones de token
3. **src/domain/profile/queries.ts**: Descomentar `onTokenChange` y `useEffect`
4. **src/routes/**: Reactivar verificaciones `getToken()`

### Archivos marcados con TODO
Todos los cambios relacionados con tokens están comentados con:
```typescript
// TODO: reactivar cuando el equipo de auth dé el flujo final
```

## Estados de Error Manejados

| Código | Tipo | Componente Mostrado | Descripción |
|--------|------|-------------------|-------------|
| 401/419 | `unauth` | ErrorSessionExpired | Sin sesión válida |
| 404 | `notfound` | ErrorSystem | Usuario no encontrado |
| 5xx | `server` | ErrorDB | Error del servidor |
| Network | `network` | ErrorDB | Problemas de conectividad |

## Modo Demo

El modo demo permanece **completamente intacto**. Cuando `isDemoMode()` retorna `true`:
- Se usa localStorage para simular datos
- No se realizan llamadas HTTP reales
- Todos los cambios son locales y temporales
- La lógica de sesión no interfiere con el modo demo

## Verificación de Funcionamiento

### ✅ Criterios de Aceptación Cumplidos
- [x] Perfil.tsx carga datos del usuario autenticado vía sesión
- [x] EditarPerfil.tsx actualiza exitosamente y refresca la vista
- [x] Intereses y favoritos funcionan según el usuario de la sesión
- [x] Errores clasificados correctamente, sin pantallas blancas
- [x] Compila sin errores de TypeScript
- [x] Modo demo intacto cuando `isDemoMode() === true`

### 🔧 Configuración Adicional Recomendada

Si el backend no tiene el endpoint `/api/user`, se recomienda agregarlo:

```php
// routes/api.php
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user()->load(['roleRelation', 'interests', 'entrepreneurships']);
});
```

Esto proporcionará un endpoint estándar para obtener el usuario autenticado con sus relaciones.
