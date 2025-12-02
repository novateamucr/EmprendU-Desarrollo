<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChannelRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $platform = $this->input('platform_code');
        $urlRule = 'nullable|url|max:500';
        if ($platform === 'phone') {
            $urlRule = 'nullable|string|max:500';
        }

        return [
            'platform_code' => 'sometimes|required|string|exists:social_platforms,code',
            'url' => $urlRule,
            'handle' => 'nullable|string|max:255',
            'is_primary' => 'sometimes|boolean',
            'is_public' => 'sometimes|boolean',
            'display_order' => 'sometimes|integer',
        ];
    }
}
