<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Fair;

class FairController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $q = Fair::with('owner');

        if ($user = $request->query('user_id')) {
            $q->where('user_id', $user);
        }

        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'province' => 'required|string|max:100',
            'canton' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'address' => 'required|string',
        ]);

        $fair = Fair::create($data);
        return response()->json($fair, 201);
    }

    public function show(Fair $fair)
    {
        return response()->json($fair->load('entrepreneurships','owner'));
    }

    public function update(Request $request, Fair $fair)
    {
        $data = $request->validate([
            'user_id' => 'sometimes|required|exists:users,id',
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after_or_equal:start_date',
            'province' => 'sometimes|required|string|max:100',
            'canton' => 'sometimes|required|string|max:100',
            'district' => 'sometimes|required|string|max:100',
            'address' => 'sometimes|required|string',
        ]);

        $fair->update($data);
        return response()->json($fair->fresh()->load('entrepreneurships','owner'));
    }

    public function destroy(Fair $fair)
    {
        $fair->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
