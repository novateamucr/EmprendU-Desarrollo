<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
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
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:1000',
            'long_description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'image_url' => 'sometimes|url|max:1000',
            'category_id' => 'sometimes|exists:categories,id',
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
            'name.string' => 'El nombre debe ser un texto',
            'name.max' => 'El nombre no puede tener más de 255 caracteres',
            'description.string' => 'La descripción debe ser un texto',
            'description.max' => 'La descripción no puede tener más de 1000 caracteres',
            'price.numeric' => 'El precio debe ser un número',
            'price.min' => 'El precio no puede ser negativo',
            'image_url.url' => 'La URL de la imagen no es válida',
            'image_url.max' => 'La URL de la imagen no puede tener más de 1000 caracteres',
            'category_id.exists' => 'La categoría seleccionada no es válida',
        ];
    }
}
