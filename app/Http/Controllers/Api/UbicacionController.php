<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ubicacion;

class UbicacionController extends Controller
{
    public function index(Request $request)
    {
        // Permite filtrar por user_id opcionalmente
        $query = Ubicacion::query();
        if ($request->has('user_id')) {
            $query->where('user_id', $request->get('user_id'));
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'  => 'required|integer|exists:users,id',
            'province' => 'required|string|max:100',
            'canton'   => 'required|string|max:100',
            'district' => 'required|string|max:100',
        ]);

        $ubicacion = Ubicacion::create($data);
        return response()->json($ubicacion, 201);
    }

    public function show(Ubicacion $ubicacion)
    {
        return response()->json($ubicacion);
    }

    public function update(Request $request, Ubicacion $ubicacion)
    {
        $data = $request->validate([
            'user_id'  => 'sometimes|required|integer|exists:users,id',
            'province' => 'sometimes|required|string|max:100',
            'canton'   => 'sometimes|required|string|max:100',
            'district' => 'sometimes|required|string|max:100',
        ]);

        $ubicacion->update($data);
        return response()->json($ubicacion);
    }

    public function destroy(Ubicacion $ubicacion)
    {
        $ubicacion->delete();
        return response()->json(['message' => 'Ubicación eliminada']);
    }
}
