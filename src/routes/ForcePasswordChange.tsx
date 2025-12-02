import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  animation: ${fadeIn} 0.5s ease-out;
`;

export default function ForcePasswordChange() {
    const { user, logout, login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });

    const [errors, setErrors] = useState<{
        current_password?: string;
        password?: string;
        password_confirmation?: string;
    }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field when user starts typing
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!formData.current_password) {
            newErrors.current_password = 'La contraseña actual es requerida';
        }

        if (!formData.password) {
            newErrors.password = 'La nueva contraseña es requerida';
        } else if (formData.password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        }

        if (!formData.password_confirmation) {
            newErrors.password_confirmation = 'Debes confirmar la nueva contraseña';
        } else if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!user?.id) {
            toast.error('Error: Usuario no identificado');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/users/${user.id}/password`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422) {
                    // Validation errors
                    if (data.message) {
                        toast.error(data.message);
                    }
                    if (data.errors) {
                        setErrors(data.errors);
                    }
                    return;
                }
                throw new Error(data.message || 'Error al cambiar la contraseña');
            }

            // Success - update user in both localStorage and auth context
            const authData = localStorage.getItem('auth');
            if (authData && token) {
                const parsed = JSON.parse(authData);
                const updatedUser = {
                    ...parsed.user,
                    must_change_password: false
                };

                // Update localStorage
                parsed.user = updatedUser;
                localStorage.setItem('auth', JSON.stringify(parsed));

                // Update auth context to refresh the session
                login({
                    token: token,
                    user: updatedUser
                });
            }

            toast.success('Contraseña actualizada exitosamente');

            // Redirect to home
            setTimeout(() => {
                navigate('/home');
            }, 1000);

        } catch (error: any) {
            console.error('Error changing password:', error);
            toast.error(error.message || 'Error al cambiar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:bg-backgroundDark flex items-center justify-center p-4">
            <Container className="w-full max-w-md">
                <div className="bg-white dark:bg-cardDark rounded-2xl shadow-xl p-8 dark:border dark:border-cardDark">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
                            <Lock className="text-orange-600 dark:text-orange-300" sx={{ fontSize: 32 }} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Cambio de Contraseña Requerido
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Por seguridad, debes cambiar tu contraseña temporal antes de continuar
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Current Password */}
                        <div>
                            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Contraseña Actual (Temporal)
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    id="current_password"
                                    name="current_password"
                                    value={formData.current_password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:bg-backgroundDark dark:text-white dark:border-cardDark ${errors.current_password ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Ingresa tu contraseña temporal"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                </button>
                            </div>
                            {errors.current_password && (
                                <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                            )}
                        </div>

                        {/* New Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:bg-backgroundDark dark:text-white dark:border-cardDark ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Mínimo 8 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Confirmar Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:bg-backgroundDark dark:text-white dark:border-cardDark ${errors.password_confirmation ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Repite tu nueva contraseña"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Cambiando contraseña...
                                </span>
                            ) : (
                                'Cambiar Contraseña'
                            )}
                        </button>

                        {/* Logout Option */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Tips */}
                <div className="mt-6 bg-blue-50 dark:bg-cardDark rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-white mb-2">Consejos de seguridad:</h3>
                    <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                        <li>• Usa al menos 8 caracteres</li>
                        <li>• Combina letras mayúsculas y minúsculas</li>
                        <li>• Incluye números y símbolos</li>
                        <li>• No uses información personal</li>
                    </ul>
                </div>
            </Container>
        </div>
    );
}
