<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AIAssistantController extends Controller
{
    protected $openAIService;

    public function __construct(OpenAIService $openAIService)
    {
        $this->middleware('auth:sanctum');
        $this->openAIService = $openAIService;
    }

    public function chat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string',
            'model' => 'sometimes|string|in:gpt-3.5-turbo,gpt-4',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $response = $this->openAIService->generateResponse(
                $request->message,
                $request->input('model', 'gpt-3.5-turbo')
            );

            return response()->json([
                'success' => true,
                'response' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process your request.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle virtual assistant requests with structured data
     */
    public function virtualAssistant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'data' => 'required|array',
            'context' => 'sometimes|string|in:greeting,product_info,faq,general',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $response = $this->openAIService->getVirtualAssistantResponse(
            $request->data,
            $request->input('context', 'general')
        );

        return response()->json([
            'success' => true,
            'data' => $response
        ]);
    }

    /**
     * Validate an entrepreneurship listing
     */
    public function validateEntrepreneurship(Request $request)
    {
        // Handle both direct fields and data-wrapped input
        $input = $request->has('data') ? $request->data : $request->all();
        
        $validator = Validator::make($input, [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'contact_info' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'accepted' => false,
                'reason' => 'Datos de entrada inválidos: ' . $validator->errors()->first()
            ], 400);
        }

        $validationResult = $this->openAIService->validateEntrepreneurship([
            'name' => $input['name'],
            'description' => $input['description'],
            'category' => $input['category'],
            'contact_info' => $input['contact_info'] ?? null
        ]);

        // Ensure we have a valid response structure
        $accepted = $validationResult['accepted'] ?? false;
        $reason = $validationResult['reason'] ?? 'No se pudo determinar el estado de validación';

        return response()->json([
            'accepted' => $accepted,
            'reason' => $reason
        ], $accepted ? 200 : 422);
    }

    /**
     * Validate a product listing
     */
    public function validateProduct(Request $request)
    {
        // Handle both direct fields and data-wrapped input
        $input = $request->has('data') ? $request->data : $request->all();
        
        $validator = Validator::make($input, [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'long_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|integer',
            'image_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'accepted' => false,
                'reason' => 'Datos de entrada inválidos: ' . $validator->errors()->first(),
                'suggestions' => []
            ], 400);
        }

        $validationResult = $this->openAIService->validateProduct([
            'name' => $input['name'],
            'description' => $input['description'],
            'long_description' => $input['long_description'] ?? null,
            'price' => $input['price'],
            'category_id' => $input['category_id'],
            'image_url' => $input['image_url'] ?? null
        ]);

        // Ensure we have a valid response structure
        $accepted = $validationResult['accepted'] ?? false;
        $reason = $validationResult['reason'] ?? 'No se pudo determinar el estado de validación';
        $suggestions = $validationResult['suggestions'] ?? [];

        return response()->json([
            'accepted' => $accepted,
            'reason' => $reason,
            'suggestions' => $suggestions
        ], $accepted ? 200 : 422);
    }
}
