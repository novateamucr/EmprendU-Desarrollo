<?php

namespace App\Http\Controllers;

use App\Models\Entrepreneurship;
use App\Models\FeaturedBusiness;
use Illuminate\Http\Request;
use Carbon\Carbon;

class FeaturedBusinessController extends Controller
{
    // ✅ Obtener el emprendimiento del día
    public function today()
    {
        $today = Carbon::today()->toDateString();

        // Si ya está seleccionado hoy → devolverlo
        $todayFeatured = FeaturedBusiness::where('date', $today)->first();
        if ($todayFeatured) {
            return response()->json($todayFeatured->load('business'));
        }

        // Obtener últimos 7
        $lastFeatured = FeaturedBusiness::orderBy('date', 'desc')
            ->take(7)
            ->pluck('business_id')
            ->toArray();

        // Todos los negocios
        $businesses = Entrepreneurship::all();

        // Filtrar los que no se han usado en 7 días
        $available = $businesses->whereNotIn('id', $lastFeatured);

        // Si todos se usaron → usar todos de nuevo
        if ($available->isEmpty()) {
            $available = $businesses;
        }

        // Seleccionar uno aleatorio
        $selected = $available->random();

        // Guardar
        $featured = FeaturedBusiness::create([
            'business_id' => $selected->id,
            'date' => $today
        ]);

        return response()->json($featured->load('business'));
    }

    // ✅ Historial últimos 7
    public function history()
    {
        return FeaturedBusiness::with('business')
            ->orderBy('date', 'desc')
            ->take(7)
            ->get();
    }
}
