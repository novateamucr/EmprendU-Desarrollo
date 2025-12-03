<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Services\R2FileUploadService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Mail\UserNotification;

use App\Mail\PasswordResetMail;
use App\Http\Requests\PasswordResetRequest;


class UserController extends Controller
{
    // index paginado
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $users = User::with('roleRelation')->paginate($perPage);
        return response()->json($users);
    }


    public function show(User $user)
    {
        // Include related data needed by frontend (profile and entrepreneur views)
        $user->load(['roleRelation', 'interests', 'entrepreneurships']);
        return response()->json($user);
    }

    // Add these methods to the UserController class


    /**
     * Send password reset email with temporary password
     *
     * @param  \App\Http\Requests\PasswordResetRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendPasswordReset(PasswordResetRequest $request)
    {
        try {
            \Log::info('Password reset requested for: ' . $request->email);

            // Find the user by email
            $user = User::where('email', $request->email)->firstOrFail();
            \Log::info('User found: ' . $user->id);

            // Generate a random temporary password
            $temporaryPassword = Str::random(12);
            \Log::info('Temporary password generated');

            // Hash and update the user's password
            $user->password = Hash::make($temporaryPassword);
            $user->must_change_password = true;
            $user->save();
            \Log::info('Password updated in database');

            // Send email with the temporary password
            \Log::info('Sending password reset email to: ' . $user->email);
            Mail::to($user->email)->send(new PasswordResetMail($temporaryPassword));
            \Log::info('Password reset email sent successfully');

            return response()->json([
                'success' => true,
                'message' => 'Se ha enviado una nueva contraseña temporal a tu correo electrónico.'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in sendPasswordReset: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }




    public function store(Request $request, R2FileUploadService $fileUploadService)
    {
        DB::beginTransaction();
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email',
                'password' => 'required|string|min:6',
                'role' => 'required|integer|exists:user_roles,id',
                'phone' => 'nullable|string|max:20',
                'province' => 'nullable|string|max:100',
                'canton' => 'nullable|string|max:100',
                'district' => 'nullable|string|max:100',
                'address' => 'nullable|string',
                'banned' => 'nullable|boolean',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'avatar_url' => 'nullable|string',
            ]);

            $data['password'] = Hash::make($data['password']);
            $data['confirmation_token'] = Str::random(40);
            $data['is_confirmed'] = false;

            // Handle avatar upload if provided
            if ($request->hasFile('avatar')) {
                $avatar = $request->file('avatar');
                $data['avatar_url'] = $fileUploadService->upload($avatar, 'users/avatars');
            }

            $user = User::create($data);

            // Send welcome email with confirmation link
            $confirmationUrl = url("/api/confirm-email/{$user->confirmation_token}");

            Mail::to($user->email)->send(new UserNotification([
                'subject' => 'Bienvenido a ' . config('app.name'),
                'greeting' => '¡Gracias por registrarte, ' . $user->name . '!',
                'content' => 'Tu cuenta ha sido creada exitosamente. Por favor, confirma tu dirección de correo electrónico para activar tu cuenta.',
                'action_url' => $confirmationUrl,
                'action_text' => 'Confirmar mi correo'
            ]));

            DB::commit();

            return response()->json([
                'message' => 'Usuario registrado exitosamente. Por favor revisa tu correo para confirmar tu cuenta.',
                'user' => $user
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error al registrar usuario: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al registrar el usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }



    public function confirmEmail($token)
    {
        DB::beginTransaction();
        try {
            $user = User::where('confirmation_token', $token)
                ->whereNull('email_verified_at')
                ->firstOrFail();

            $user->update([
                'isConfirmed' => true,
                'confirmation_token' => null,
                'email_verified_at' => now(),
            ]);

            DB::commit();

            // Return the success view instead of JSON
            return view('emails.confirmation-success');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error confirming email: ' . $e->getMessage());

            // You might want to create an error view as well
            return response()->view('emails.confirmation-error', [
                'message' => 'Enlace de confirmación inválido o expirado'
            ], 400);
        }
    }

    // confirm email
    public function confirm(Request $request)
    {
        $token = $request->query('token');

        $record = DB::table('email_tokens')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'message' => 'Token inválido o expirado'], 400);
        }

        // Confirmar usuario
        User::where('id', $record->user_id)->update(['isConfirmed' => true]);

        // Eliminar token
        DB::table('email_tokens')->where('token', $token)->delete();

        return response()->json(['success' => true, 'message' => 'Correo confirmado correctamente']);
    }

    // login
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            // Bloquear login si el usuario no ha confirmado su correo
            if (!$user->isConfirmed) {
                Auth::logout();
                return response()->json(['message' => 'Debes confirmar tu correo antes de iniciar sesión'], 403);
            }

            $token = $user->createToken('auth-token')->plainTextToken;
            $user->load(['roleRelation', 'interests', 'entrepreneurships']);

            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'must_change_password' => (bool) $user->must_change_password,
                'token' => $token,
                'token_type' => 'Bearer'
            ], 200);
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }


    /**
     * Update the specified user in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\User  $user
     * @param  \App\Services\R2FileUploadService  $fileUploadService
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, User $user, R2FileUploadService $fileUploadService)
    {


        return $this->updateUserProfile($request, $user, $fileUploadService);
    }

    /**
     * Update the authenticated user's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Services\R2FileUploadService  $fileUploadService
     * @return \Illuminate\Http\Response
     */
    public function updateProfile(Request $request, R2FileUploadService $fileUploadService)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        return $this->updateUserProfile($request, $user, $fileUploadService);
    }

    /**
     * Common method to update user profile data.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\User  $user
     * @param  \App\Services\R2FileUploadService  $fileUploadService
     * @return \Illuminate\Http\Response
     */
    protected function updateUserProfile(Request $request, User $user, R2FileUploadService $fileUploadService)
    {
        // Get all input data, handling both form data and JSON
        $input = $request->all();

        // Validation rules
        $rules = [
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'password' => 'nullable|string|min:6',
            'role' => 'integer|exists:user_roles,id',
            'phone' => 'nullable|string|max:20',
            'province' => 'nullable|string|max:100',
            'canton' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'banned' => 'boolean',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'avatar_url' => 'nullable|string',
        ];

        // If _method is present, it's a form submission
        if ($request->has('_method')) {
            $data = $input;
            unset($data['_method']);
            unset($data['id']);

            // Handle empty strings as null for optional fields
            $data = array_map(function ($value) {
                return $value === '' ? null : $value;
            }, $data);

            $validator = Validator::make($data, $rules);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
        } else {
            // For JSON requests
            $data = $request->validate($rules);
        }

        Log::info('Update User Request:', [
            'user_id' => $user->id,
            'input_data' => $input,
            'processed_data' => $data,
            'files' => $request->hasFile('avatar') ? 'File present' : 'No file'
        ]);

        DB::beginTransaction();
        try {
            // Handle avatar upload if a new file is provided
            if ($request->hasFile('avatar')) {
                $avatar = $request->file('avatar');
                $avatarUrl = $fileUploadService->upload($avatar, 'users/avatars');
                if (!$avatarUrl) {
                    throw new \Exception('Error al subir la imagen de perfil');
                }
                $data['avatar_url'] = $avatarUrl;
            } elseif (isset($data['avatar_url']) && $data['avatar_url'] === '') {
                // Handle avatar removal if avatar_url is an empty string
                $data['avatar_url'] = null;
            } else {
                // Don't update avatar_url if not provided
                unset($data['avatar_url']);
            }

            // Hash password if provided
            if (!empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            // Update user
            $user->update($data);

            // Reload the user with relationships
            $user->load(['roleRelation', 'interests', 'entrepreneurships']);

            DB::commit();

            return response()->json([
                'message' => 'Perfil actualizado exitosamente',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating user: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Error al actualizar el perfil',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Update the user's password.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePassword(Request $request, User $user)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:6|confirmed',
        ]);

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta'
            ], 422);
        }

        // Update password and reset flag
        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return response()->json([
            'message' => 'Contraseña actualizada correctamente'
        ]);
    }
}
