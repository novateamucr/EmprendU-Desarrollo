<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    // index paginado
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $users = User::with('roleRelation')->paginate($perPage);
        return response()->json($users);
    }

    // store
    public function store(Request $request)
    {
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
            'avatar_url' => 'nullable|url|max:500',
        ]);

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        // Generate Sanctum token for the new user
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user->load('roleRelation'),
            'token' => $token,
            'token_type' => 'Bearer'
        ], 201);
    }

    // show
    public function show(User $user)
    {
        return response()->json($user->load(['roleRelation','interests','entrepreneurships']));
    }

    // update
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes','required','email','max:255', Rule::unique('users','email')->ignore($user->id)],
            'password' => 'sometimes|nullable|string|min:6',
            'role' => 'sometimes|required|integer|exists:user_roles,id',
            'phone' => 'nullable|string|max:20',
            'province' => 'nullable|string|max:100',
            'canton' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'banned' => 'nullable|boolean',
            'avatar_url' => 'nullable|url|max:500',
        ]);

        if (isset($data['password']) && $data['password']) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user->fresh()->load('roleRelation'));
    }

    // destroy
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted'], 200);
    }

    // login
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Attempt to authenticate the user
        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            
            // Generate Sanctum token
            $token = $user->createToken('auth-token')->plainTextToken;
            
            // Load user relationships
            $user->load(['roleRelation', 'interests', 'entrepreneurships']);
            
            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer'
            ], 200);
        }

        return response()->json([
            'message' => 'Invalid credentials'
        ], 401);
    }

    /**
     * Update the user's password securely.
     * Expects: current_password, password, password_confirmation
     */
    public function updatePassword(Request $request, User $user)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string', 'min:6'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'La contraseña actual es incorrecta.'], 422);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        return response()->json(['message' => 'Contraseña actualizada correctamente.'], 200);
    }
}
