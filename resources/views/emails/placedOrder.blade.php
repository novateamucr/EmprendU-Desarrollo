@component('mail::message')

{{-- Encabezado diferente según el tipo de destinatario --}}
@if($tipo === 'cliente')
# ¡Gracias por tu pedido, {{ $usuario->name ?? $usuario->nombre ?? 'Cliente' }}! 

Hemos recibido tu orden en **{{ $pedido->entrepreneurship->name ?? 'nuestro negocio' }}**  
y está siendo procesada. Pronto recibirás más información sobre la entrega.

@component('mail::button', ['url' => "https://empowerup.lat/orders/{$pedido->id}"])
Ver mi pedido
@endcomponent

@else
# ¡Tienes un nuevo pedido, {{ $emprendedor->name ?? $emprendedor->nombre ?? 'Emprendedor' }}! 

Has recibido un nuevo pedido para tu emprendimiento **{{ $pedido->entrepreneurship->name ?? 'tu negocio' }}**.  
Por favor revisa el pedido y contacta al cliente si es necesario.

@component('mail::button', ['url' => "https://empowerup.lat/entrepreneur/orders/{$pedido->id}"])
Ver pedidos
@endcomponent

@endif

---

### Información del pedido

- **Número de Pedido:** #{{ $pedido->id }}
- **Fecha:** {{ $pedido->created_at->format('d/m/Y') }}

---

{{-- Sólo al EMPRENDEDOR le interesan los datos del cliente --}}
@if($tipo === 'emprendedor')
### Datos del cliente

- **Nombre:** {{ $pedido->customer_name }}
- **Correo:** {{ $pedido->customer_email }}
- **Teléfono:** {{ $pedido->customer_phone_8 }}

@endif

{{-- Si hay notas, las mostramos siempre --}}
@if($pedido->notes)
---
### Notas del pedido
> {{ $pedido->notes }}
@endif


---

{{-- Mensaje de contacto para cliente --}}
@if($tipo === 'cliente')
Si tienes alguna duda, puedes contactar directamente al emprendedor:

**{{ $emprendedor->name }}**  
Correo: {{ $emprendedor->email }}

---
Gracias por comprar con nosotros.  
Equipo de EmpowerUp
@else
Recuerda mantener buena comunicación con tu cliente.  
¡Muchos éxitos con tus ventas!

Equipo de EmpowerUp
@endif

@endcomponent