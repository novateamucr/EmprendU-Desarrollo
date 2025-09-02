<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FairEntrepreneurship;
use App\Models\Fair;
use App\Models\Entrepreneurship;

class FairEntrepreneurshipController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $q = FairEntrepreneurship::query();

        if ($fair = $request->query('fair_id')) {
            $q->where('fair_id', $fair);
        }
        if ($entre = $request->query('entrepreneurship_id')) {
            $q->where('entrepreneurship_id', $entre);
        }

        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'fair_id' => 'required|exists:fairs,id',
            'entrepreneurship_id' => 'required|exists:entrepreneurships,id',
        ]);

        // evitar duplicados
        $exists = FairEntrepreneurship::where('fair_id', $data['fair_id'])
            ->where('entrepreneurship_id', $data['entrepreneurship_id'])->first();

        if ($exists) {
            return response()->json(['message' => 'Already linked'], 409);
        }

        $link = FairEntrepreneurship::create($data);
        return response()->json($link, 201);
    }

    public function show(FairEntrepreneurship $fairEntrepreneurship)
    {
        return response()->json($fairEntrepreneurship);
    }

    public function destroy(FairEntrepreneurship $fairEntrepreneurship)
    {
        $fairEntrepreneurship->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
