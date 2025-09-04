# 📘 Componente Navbar - Guía de Uso

Un componente Navbar reutilizable y configurable que mantiene el estilo exacto de tu navbar actual mientras añade soporte para dropdowns, responsividad móvil y configuración flexible.

## 🚀 Inicio Rápido

```tsx
import { Navbar } from './components/navbar';
import { User } from 'lucide-react';

// Uso básico
<Navbar
  logo={<img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />}
  items={[
    { type: 'link', label: 'Inicio', to: '/' },
    { type: 'link', label: 'Emprendimientos', to: '/emprendimientos' },
    { type: 'link', label: 'Ferias', to: '/ferias' },
  ]}
  rightContent={<User className="h-5 w-5" />}
/>
```

## 📋 Ejemplos

### Ejemplo 1: Navbar básico
```tsx
import { Navbar } from './components/navbar';
import { User } from 'lucide-react';

<Navbar
  logo={<img src="/src/assets/logo.svg" alt="logo" className="h-8 w-auto" />}
  items={[
    { type: 'link', label: 'Inicio', to: '/' },
    { type: 'link', label: 'Emprendimientos', to: '/emprendimientos' },
    { type: 'link', label: 'Ferias', to: '/ferias' },
  ]}
  rightContent={
    <button aria-label="Perfil" className="p-2 rounded-full hover:bg-gray-100">
      <User className="h-5 w-5" />
    </button>
  }
/>
```

### Ejemplo 2: Navbar con dropdown
```tsx
import { Navbar } from './components/navbar';
import { Settings, Users, BarChart, FileText, CreditCard } from 'lucide-react';

<Navbar
  logo={<img src="/src/assets/logo.svg" alt="logo" className="h-8 w-auto" />}
  items={[
    { type: 'link', label: 'Panel', to: '/admin' },
    {
      type: 'dropdown',
      label: 'Usuarios',
      icon: <Users className="h-4 w-4" />,
      items: [
        { type: 'link', label: 'Listado', to: '/admin/users', icon: <Users className="h-4 w-4" /> },
        { type: 'link', label: 'Permisos', to: '/admin/roles', icon: <Settings className="h-4 w-4" /> },
        {
          type: 'group',
          label: 'Reportes',
          items: [
            { label: 'Actividad', to: '/admin/reports/activity', icon: <BarChart className="h-4 w-4" /> },
            { label: 'Pagos', to: '/admin/reports/payments', icon: <CreditCard className="h-4 w-4" /> },
          ],
        },
      ],
    },
  ]}
  rightContent={<MenuAvatar />}
/>
```

### Ejemplo 3: Condicional por rol
```tsx
import { Navbar } from './components/navbar';
import { useAuth } from './hooks/useAuth';

function AppNavbar() {
  const { user } = useAuth();
  
  const items = [
    { type: 'link', label: 'Inicio', to: '/', visible: true },
    { type: 'link', label: 'Perfil', to: '/perfil', visible: !!user },
    { type: 'link', label: 'Administración', to: '/admin', visible: user?.isAdmin },
    {
      type: 'dropdown',
      label: 'Configuración',
      visible: user?.isAdmin,
      items: [
        { type: 'link', label: 'Usuarios', to: '/admin/users' },
        { type: 'link', label: 'Sistema', to: '/admin/system' },
      ],
    },
  ];

  return (
    <Navbar
      logo={<img src="/src/assets/logo.svg" alt="logo" className="h-8 w-auto" />}
      items={items}
      rightContent={user && <MenuUsuario user={user} />}
    />
  );
}
```

### Ejemplo 4: Dropdown con alineación y grupos
```tsx
<Navbar
  items={[
    {
      type: 'dropdown',
      label: 'Productos',
      align: 'center', // 'left' | 'center' | 'right'
      items: [
        { type: 'link', label: 'Todos los productos', to: '/productos' },
        {
          type: 'group',
          label: 'Categorías',
          items: [
            { label: 'Tecnología', to: '/productos/tecnologia' },
            { label: 'Alimentación', to: '/productos/alimentacion' },
            { label: 'Servicios', to: '/productos/servicios' },
          ],
        },
        {
          type: 'group',
          label: 'Herramientas',
          items: [
            { label: 'Calculadora', to: '/herramientas/calculadora' },
            { label: 'Comparador', to: '/herramientas/comparador' },
          ],
        },
      ],
    },
  ]}
/>
```

### Ejemplo 5: Navbar no fijo
```tsx
<Navbar
  sticky={false}
  className="relative top-0"
  maxWidth="max-w-2xl"
  items={[...]}
/>
```

## 🔧 API de Props

### NavbarProps
```tsx
interface NavbarProps {
  logo?: ReactNode;              // Componente del logo
  items: NavbarItemConfig[];     // Array de elementos de navegación
  rightContent?: ReactNode;      // Contenido para el lado derecho (perfil, botones, etc.)
  className?: string;            // Clases CSS adicionales
  sticky?: boolean;              // Posicionamiento fijo (por defecto: true)
  maxWidth?: 'max-w-3xl' | 'max-w-2xl'; // Ancho máximo del contenedor
}
```

### NavLinkItem
```tsx
type NavLinkItem = {
  type: 'link';
  label: string;                 // Texto a mostrar
  to: string;                    // Ruta de destino
  icon?: ReactNode;              // Ícono opcional
  exact?: boolean;               // Coincidencia exacta de ruta (por defecto: false)
  visible?: boolean;             // Mostrar/ocultar elemento (por defecto: true)
};
```

### NavDropdownItem
```tsx
type NavDropdownItem = {
  type: 'dropdown';
  label: string;                 // Texto a mostrar
  icon?: ReactNode;              // Ícono opcional
  align?: 'left' | 'center' | 'right'; // Alineación del dropdown (por defecto: 'left')
  visible?: boolean;             // Mostrar/ocultar elemento (por defecto: true)
  items: Array<DropdownItem>;    // Contenido del dropdown
};
```

### Elementos del Dropdown
```tsx
// Link simple en dropdown
{ type: 'link', label: string, to: string, icon?: ReactNode, visible?: boolean }

// Grupo con sub-elementos
{
  type: 'group',
  label: string,
  items: { label: string, to: string, icon?: ReactNode, visible?: boolean }[]
}
```

## 🎨 Características de Estilo

- **Coincidencia exacta de estilo**: Mantiene la apariencia actual de tu navbar
- **Fondo blanco**: `bg-white` con `rounded-[16px]`
- **Sombra suave**: `shadow-soft` con `border border-border`
- **Tipografía Inter**: Hereda tu familia de fuentes
- **Efectos hover**: Subrayado con `underline-offset-4` para links
- **Transiciones suaves**: Todas las interacciones están animadas
- **Estados de foco**: Accesibilidad completa con teclado

## 📱 Comportamiento Responsivo

### Escritorio
- Los dropdowns se abren con hover y foco
- Se cierran al salir del mouse o presionar Escape
- Soporte para navegación con teclado

### Móvil
- Aparece el botón de menú hamburguesa
- Panel lateral se desliza desde la derecha
- Los dropdowns se convierten en acordeones
- Interacciones amigables al tacto

## ♿ Características de Accesibilidad

- **Etiquetas ARIA**: `aria-label`, `aria-expanded`, `aria-haspopup`
- **Navegación con teclado**: Soporte para Tab, Enter, Escape
- **Soporte para lectores de pantalla**: Roles y descripciones apropiadas
- **Gestión de foco**: Indicadores de foco visibles
- **Accesibilidad móvil**: Objetivos táctiles de mínimo 44px

## 🔄 Migración desde el Navbar Actual

Reemplaza el uso actual de tu Navbar:

```tsx
// Antes
<Navbar maxWidth="max-w-3xl" />

// Después
<Navbar
  logo={<img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />}
  maxWidth="max-w-3xl"
  items={[
    { type: 'link', label: 'Inicio', to: '/home' },
    { type: 'link', label: 'Emprendimientos', to: '/emprendimientos' },
    { type: 'link', label: 'Ferias', to: '/ferias' },
  ]}
  rightContent={
    <Link
      to="/perfil"
      className="p-2 rounded-full transition-colors hover:bg-gray-100"
      aria-label="Ir al perfil"
    >
      <User className="w-5 h-5" />
    </Link>
  }
/>
```

## 💡 Consejos

1. **Rendimiento**: Los elementos con `visible: false` se filtran completamente
2. **Íconos**: Usa íconos de Lucide React para consistencia
3. **Coincidencia exacta**: Usa `exact: true` para rutas como `/` vs `/home`
4. **Grupos**: Usa grupos para organizar elementos del dropdown con separadores
5. **Móvil**: Prueba el comportamiento del dropdown en dispositivos móviles
6. **Accesibilidad**: Siempre proporciona `aria-label` para botones solo con íconos

## 🐛 Solución de Problemas

**¿El dropdown no se abre con hover?**
- Verifica si estás en móvil - móvil usa click/tap en su lugar

**¿Los elementos no se muestran?**
- Verifica que la prop `visible` no esté establecida en `false`
- Revisa si el array de elementos está estructurado correctamente

**¿El estilo se ve diferente?**
- Asegúrate de que las clases de Tailwind estén disponibles
- Verifica si CSS personalizado está sobrescribiendo los estilos

**¿El menú móvil no funciona?**
- Verifica que tengas elementos en el array `items`
- Revisa si el viewport es realmente de tamaño móvil
