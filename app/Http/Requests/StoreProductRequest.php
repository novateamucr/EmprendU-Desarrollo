<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Change this based on your authorization logic
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'entrepreneurship_id' => 'required|exists:entrepreneurships,id',
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'long_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image_url' => 'required|url|max:1000',
            'category_id' => 'required|exists:categories,id',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'entrepreneurship_id.required' => 'El emprendimiento es obligatorio',
            'entrepreneurship_id.exists' => 'El emprendimiento seleccionado no es válido',
            'name.required' => 'El nombre del producto es obligatorio',
            'name.max' => 'El nombre no puede tener más de 255 caracteres',
            'description.required' => 'La descripción es obligatoria',
            'description.max' => 'La descripción no puede tener más de 1000 caracteres',
            'price.required' => 'El precio es obligatorio',
            'price.numeric' => 'El precio debe ser un número',
            'price.min' => 'El precio no puede ser negativo',
            'image_url.required' => 'La URL de la imagen es obligatoria',
            'image_url.url' => 'La URL de la imagen no es válida',
            'category_id.required' => 'La categoría es obligatoria',
            'category_id.exists' => 'La categoría seleccionada no es válida',
        ];
    }
}
