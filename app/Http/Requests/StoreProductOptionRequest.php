<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductOptionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => ['required','string','max:255'],
            'type' => ['required','in:select,multiselect,text,number,boolean,file'],
            'required' => ['boolean'],
            'display_order' => ['integer'],
            'min_select' => ['nullable','integer','min:0'],
            'max_select' => ['nullable','integer','min:0'],
        ];
    }
}
