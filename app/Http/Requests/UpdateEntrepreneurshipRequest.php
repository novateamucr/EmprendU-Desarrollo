<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEntrepreneurshipRequest extends FormRequest
{
    /**
     * Autorizar la petición de actualización.
     * Aquí es muy común verificar que el usuario esté logueado y sea el dueño
     * o tenga permiso para editar: ejemplo:
     *
     * return auth()->check() && (auth()->id() === $this->route('entrepreneurship')->user_id || auth()->user()->role == 1);
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Reglas para actualización — usamos "sometimes" para permitir actualizaciones parciales.
     */
    public function rules()
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'category' => 'sometimes|required|integer|exists:entrepreneurship_categories,id',
            'image_url' => 'sometimes|nullable|url|max:500',
            // si permites cambiar user_id (transferir propietario), valida existencia
            'user_id' => 'sometimes|required|exists:users,id',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'El nombre del emprendimiento es obligatorio cuando se envía.',
            'category.exists' => 'La categoría seleccionada no existe.',
            'user_id.exists' => 'El usuario indicado no existe.',
        ];
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'description' => $this->input('description') ?: null,
            'image_url' => $this->input('image_url') ?: null,
        ]);
    }
}
