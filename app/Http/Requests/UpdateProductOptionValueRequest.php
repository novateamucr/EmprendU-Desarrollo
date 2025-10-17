<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductOptionValueRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'value' => ['sometimes','string','max:255'],
            'price_modifier' => ['sometimes','numeric'],
            'image_url' => ['nullable','string','max:2048'],
            'sku_suffix' => ['nullable','string','max:50'],
            'display_order' => ['sometimes','integer'],
        ];
    }
}
