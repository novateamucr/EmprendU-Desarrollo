import { z } from 'zod';

export const profileFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['comprador', 'emprendedor', 'administrador']),
  phone: z.string().optional(),
  email: z.string().email('Ingresa un email válido'),
  location: z.object({
    province: z.string().optional(),
    canton: z.string().optional(),
    district: z.string().optional(),
    address: z.string().optional()
  })
});

export const passwordSchema = z.object({
  current_password: z.string().min(6, 'La contraseña actual debe tener al menos 6 caracteres'),
  password: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La nueva contraseña debe incluir al menos una letra mayúscula')
    .regex(/[0-9]/, 'La nueva contraseña debe incluir al menos un número'),
  password_confirmation: z.string()
}).refine(data => data.password === data.password_confirmation, {
  path: ['password_confirmation'],
  message: 'Las contraseñas no coinciden'
});

// Esquema para restablecer contraseña por un administrador (sin contraseña actual)
export const adminPasswordSchema = z.object({
  password: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La nueva contraseña debe incluir al menos una letra mayúscula')
    .regex(/[0-9]/, 'La nueva contraseña debe incluir al menos un número'),
  password_confirmation: z.string()
}).refine(data => data.password === data.password_confirmation, {
  path: ['password_confirmation'],
  message: 'Las contraseñas no coinciden'
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;
export type AdminPasswordFormData = z.infer<typeof adminPasswordSchema>;
