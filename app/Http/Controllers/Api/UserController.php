<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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
            'username' => 'required|string|max:255|unique:users,username',
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

        return response()->json($user->load('roleRelation'), 201);
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
            'username' => ['sometimes','required','string','max:255', Rule::unique('users','username')->ignore($user->id)],
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
}
