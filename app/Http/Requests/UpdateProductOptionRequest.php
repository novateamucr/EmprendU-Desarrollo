<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductOptionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => ['sometimes','string','max:255'],
            'type' => ['sometimes','in:select,multiselect,text,number,boolean,file'],
            'required' => ['sometimes','boolean'],
            'display_order' => ['sometimes','integer'],
            'min_select' => ['nullable','integer','min:0'],
            'max_select' => ['nullable','integer','min:0'],
        ];
    }
}
