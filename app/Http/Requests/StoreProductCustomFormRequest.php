<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductCustomFormRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'label' => ['required','string','max:255'],
            'input_type' => ['required','in:text,textarea,number,file,boolean,date'],
            'required' => ['boolean'],
            'max_length' => ['nullable','integer','min:1'],
            'help_text' => ['nullable','string'],
            'display_order' => ['integer'],
        ];
    }
}
