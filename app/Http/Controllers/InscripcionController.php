<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inscripcion;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class InscripcionController extends Controller
{
    // Registrar inscripción
    public function store(Request $request)
    {
        // Aceptamos variantes en el payload: feria_id / fair_id  and emprendimiento_id / entrepreneurships_id
        $payload = $request->all();

        $userId = $payload['user_id'] ?? null;
        $feriaId = $payload['feria_id'] ?? $payload['fair_id'] ?? null;
        $emprendimientoId = $payload['emprendimiento_id'] ?? $payload['entrepreneurships_id'] ?? null;

        // Validamos los ids (usar nombres lógicos para las reglas)
        $v = Validator::make(
            [
                'user_id' => $userId,
                'feria_id' => $feriaId,
                'emprendimiento_id' => $emprendimientoId,
            ],
            [
                'user_id' => 'required|exists:users,id',
                'feria_id' => 'required|exists:fairs,id',
                'emprendimiento_id' => 'required|exists:entrepreneurships,id',
            ]
        );

        if ($v->fails()) {
            return response()->json([
                'message' => 'Validación fallida',
                'errors' => $v->errors(),
            ], 422);
        }

        // Mapear a los nombres reales de la tabla en tu BD
        $toInsert = [
            'user_id' => (int) $userId,
            'fair_id' => (int) $feriaId,                // columna real en BD
            'entrepreneurships_id' => (int) $emprendimientoId, // columna real en BD
        ];

        // Log para depuración (revisa storage/logs/laravel.log)
        Log::info('Inscripcion::toInsert', $toInsert);

        // Crear la inscripción
        $inscripcion = Inscripcion::create($toInsert);

        return response()->json([
            'message' => 'Inscripción registrada correctamente',
            'data' => $inscripcion,
        ]);
    }

    // Obtener inscripciones de un usuario
    public function getByUser($userId)
    {
        $inscripciones = Inscripcion::where('user_id', $userId)
            ->with(['feria', 'emprendimiento'])
            ->get();

        return response()->json($inscripciones);
    }
// Obtener inscripciones por feria (participantes)
public function getByFair($fairId)
{
    $inscripciones = Inscripcion::where('fair_id', $fairId)
        ->with(['usuario', 'emprendimiento'])
        ->get();

    return response()->json($inscripciones);
}

    
}