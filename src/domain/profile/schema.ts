import { z } from 'zod';

export const profileFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  role: z.enum(['cliente', 'emprendedor', 'administrador']),
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
  current_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  password_confirmation: z.string().min(8, 'Confirma tu nueva contraseña')
}).refine(data => data.password === data.password_confirmation, {
  path: ['password_confirmation'],
  message: 'Las contraseñas no coinciden'
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;
