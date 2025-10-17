<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inscripcion extends Model
{
    // Asegura que apunta a la tabla real
    protected $table = 'inscripciones';

    // Columnas asignables que debes permitir
    protected $fillable = [
        'user_id',
        'fair_id',
        'entrepreneurships_id',
    ];

    // Relaciones (opcional pero útiles)
    public function feria()
    {
        return $this->belongsTo(\App\Models\Fair::class, 'fair_id');
    }

    public function emprendimiento()
    {
        return $this->belongsTo(\App\Models\Entrepreneurship::class, 'entrepreneurships_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}