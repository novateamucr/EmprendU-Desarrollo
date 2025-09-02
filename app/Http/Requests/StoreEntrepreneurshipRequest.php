<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEntrepreneurshipRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Por defecto devuelvo true para permitir que la validación se ejecute.
     * Aquí puedes implementar lógica de autorización, p. ej.:
     * return auth()->check() && auth()->user()->can('create', Entrepreneurship::class);
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Reglas pensadas para creación de un emprendimiento.
     */
    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|integer|exists:entrepreneurship_categories,id',
            'image_url' => 'nullable|url|max:500',
            'user_id' => 'required|exists:users,id',
        ];
    }

    /**
     * Mensajes personalizados (opcional).
     */
    public function messages()
    {
        return [
            'name.required' => 'El nombre del emprendimiento es obligatorio.',
            'category.required' => 'La categoría es obligatoria.',
            'category.exists' => 'La categoría seleccionada no existe.',
            'user_id.required' => 'El propietario (user_id) es obligatorio.',
            'user_id.exists' => 'El usuario indicado no existe.',
            'image_url.url' => 'La URL de la imagen debe ser válida.',
        ];
    }

    /**
     * Preparar datos antes de la validación (opcional).
     * Por ejemplo, si envías category como string numérico, o quieres convertir campos.
     */
    protected function prepareForValidation()
    {
        // ejemplo: convertir campos vacíos a null
        $this->merge([
            'description' => $this->input('description') ?: null,
            'image_url' => $this->input('image_url') ?: null,
        ]);
    }
}
