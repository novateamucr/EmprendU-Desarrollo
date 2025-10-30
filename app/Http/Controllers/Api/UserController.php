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
        return response()->json($user);
    }


    // store (registro)
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
                'avatar_url' => 'nullable|string', // For existing URLs if needed
            ]);

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $avatar = $request->file('avatar');
                $avatarUrl = $fileUploadService->upload($avatar, 'users/avatars');
                if (!$avatarUrl) {
                    throw new \Exception('Error al subir la imagen de perfil');
                }
                $data['avatar_url'] = $avatarUrl;
            } elseif (empty($data['avatar_url'])) {
                $data['avatar_url'] = null;
            }

            $data['password'] = Hash::make($data['password']);
            $data['isConfirmed'] = false; // usuario no confirmado al crear

            $user = User::create($data);

            // Generar token de confirmación
            $token = Str::random(60);
            DB::table('email_tokens')->insert([
                'user_id' => $user->id,
                'token' => $token,
                'created_at' => now(),
                'expires_at' => Carbon::now()->addDay(), // token válido 24h
            ]);

            // Enviar correo de confirmación directamente con Mail::raw
            $confirmLink = url("/api/confirm?token={$token}");
            Mail::raw("Hola {$user->name},\n\nHaz clic aquí para confirmar tu correo: $confirmLink\n\nSi no creaste esta cuenta, ignora este mensaje.", function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Confirma tu correo');
            });

            DB::commit();
            
            return response()->json([
                'message' => 'Usuario registrado. Revisa tu correo para confirmar tu cuenta.',
                'user' => $user->load('roleRelation')
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating user: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear el usuario',
                'error' => $e->getMessage()
            ], 500);
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
                'token' => $token,
                'token_type' => 'Bearer'
            ], 200);
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }
}
