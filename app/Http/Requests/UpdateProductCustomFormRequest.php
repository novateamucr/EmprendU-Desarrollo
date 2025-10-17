<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductCustomFormRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'label' => ['sometimes','string','max:255'],
            'input_type' => ['sometimes','in:text,textarea,number,file,boolean,date'],
            'required' => ['sometimes','boolean'],
            'max_length' => ['nullable','integer','min:1'],
            'help_text' => ['nullable','string'],
            'display_order' => ['sometimes','integer'],
        ];
    }
}
