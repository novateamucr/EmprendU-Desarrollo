<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserRole;

class RoleController extends Controller
{
    public function index()
    {
        return response()->json(UserRole::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:50|unique:user_roles,nombre'
        ]);

        // Debug: Log what we're actually receiving
        \Log::info('Role creation data:', $data);
        \Log::info('Raw request data:', $request->all());

        $role = UserRole::create($data);
        return response()->json($role, 201);
    }

    public function show(UserRole $role)
    {
        return response()->json($role);
    }

    public function update(Request $request, UserRole $role)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:50|unique:user_roles,nombre,' . $role->id
        ]);

        $role->update($data);
        return response()->json($role);
    }

    public function destroy(UserRole $role)
    {
        $role->delete();
        return response()->json(['message' => 'Role deleted']);
    }
}
