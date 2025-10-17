<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OpenAIService
{
    protected $apiKey;
    protected $baseUrl = 'https://api.openai.com/v1';
    protected $httpClient;

    public function __construct()
    {
        $this->apiKey = env('OPENAI_API_KEY');
        $this->httpClient = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ]);
    }

    public function createChatCompletion(array $messages, string $model = 'gpt-3.5-turbo'): array
    {
        $response = $this->httpClient->post("$this->baseUrl/chat/completions", [
            'model' => $model,
            'messages' => $messages,
            'temperature' => 0.7,
        ]);

        if ($response->failed()) {
            throw new \Exception('OpenAI API request failed: ' . $response->body());
        }

        return $response->json();
    }

    public function generateResponse(string $prompt, string $model = 'gpt-3.5-turbo'): string
    {
        $messages = [
            ['role' => 'user', 'content' => $prompt]
        ];

        $response = $this->createChatCompletion($messages, $model);

        return $response['choices'][0]['message']['content'] ?? 'No response from AI';
    }

    /**
     * Get a structured response from the virtual assistant
     * 
     * @param array $data The input data for the assistant
     * @param string $context The context of the conversation
     * @return array Structured response
     */
    public function getVirtualAssistantResponse(array $data, string $context = 'general'): array
    {
        $prompt = $this->buildAssistantPrompt($data, $context);
        
        $messages = [
            [
                'role' => 'system',
                'content' => 'You are a helpful virtual assistant. Provide responses in a structured JSON format.'
            ],
            ['role' => 'user', 'content' => $prompt]
        ];

        try {
            $response = $this->createChatCompletion($messages, 'gpt-3.5-turbo');
            $content = $response['choices'][0]['message']['content'] ?? '';
            
            // Try to decode the JSON response
            $decoded = json_decode($content, true);
            
            // If JSON is valid, return it, otherwise return as text
            return json_last_error() === JSON_ERROR_NONE 
                ? $decoded 
                : ['response' => $content];
                
        } catch (\Exception $e) {
            return [
                'error' => true,
                'message' => 'Failed to get response from AI',
                'details' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Build a prompt for the virtual assistant based on context
     */
    protected function getSystemPrompt(string $context = 'general'): string
    {
        $basePrompt = <<<PROMPT
        You are EmprendeU Assistant, a helpful AI assistant for the EmprendeU platform. Your role is to assist users with information about entrepreneurship, businesses, and related topics.

        Your responsibilities include:
        - Validating entrepreneurship listings for compliance
        - Providing information about local businesses and entrepreneurs
        - Assisting with business-related queries
        - Offering guidance on entrepreneurship
        - Answering questions about products and services

        Your limitations:
        - You cannot process payments or handle financial transactions
        - You cannot access user accounts or personal information
        - You cannot provide legal, financial, or medical advice
        - You cannot make decisions for users
        - You cannot perform actions outside the platform
        - You cannot access information after October 2023
        PROMPT;

        // Add context-specific instructions
        switch ($context) {
            case 'validate_entrepreneurship':
                $basePrompt .= <<<VALIDATION_RULES
                
                When validating an entrepreneurship, check for the following:
                - The name is appropriate and not offensive
                - The description is clear and relevant to the business
                - The category matches the business type
                - No prohibited content (hate speech, illegal activities, etc.)
                - Contact information is appropriate
                
                Return a JSON response with:
                {
                    "valid": boolean,
                    "reason": "Brief explanation of validation result",
                    "suggestions": ["Optional suggestions for improvement"]
                }
                VALIDATION_RULES;
                break;
                
            default:
                $basePrompt .= "\n\nAlways respond in a professional, friendly, and helpful manner. If you don't know the answer to a question, say so rather than making up information.";
        }
        
        return $basePrompt;
    }

    /**
     * Validate if an entrepreneurship meets platform rules
     */
    public function validateProduct(array $data): array
    {
        try {
            // 1. Validación de campos requeridos solo si se está creando un producto nuevo
            if (!isset($data['id'])) {
                $requiredFields = ['name', 'description', 'price', 'category_id'];
                foreach ($requiredFields as $field) {
                    if (empty($data[$field])) {
                        return [
                            'accepted' => false,
                            'reason' => "Falta el campo requerido: $field",
                            'inappropriate' => false
                        ];
                    }
                }
            }

            // 2. Validación básica de precio si está presente
            if (isset($data['price']) && (!is_numeric($data['price']) || $data['price'] < 0)) {
                return [
                    'accepted' => false,
                    'reason' => 'El precio debe ser un número positivo',
                    'inappropriate' => false
                ];
            }

            // 3. Si solo se está validando el nombre, hacer una validación más simple
            if (count($data) === 1 && isset($data['name'])) {
                return $this->validateNameOnly($data['name']);
            }

            // 4. Validación completa del producto
            return $this->validateFullProduct($data);

        } catch (\Exception $e) {
            \Log::error('Error en validación de producto: ' . $e->getMessage());
            return [
                'accepted' => false,
                'reason' => 'Error al procesar la validación',
                'suggestions' => ['Por favor, inténtalo de nuevo más tarde'],
                'inappropriate' => false
            ];
        }
    }

    /**
     * Valida solo el nombre del producto con ChatGPT
     */
    protected function validateNameOnly(string $name): array
    {
        $prompt = "Eres un validador experto de productos para una plataforma de emprendedores.\n\n" .
                 "TAREA: Validar si el siguiente nombre de producto es apropiado y relevante.\n\n" .
                 "REGLAS ESTRICTAS:\n" .
                 "1. Rechaza cualquier contenido inapropiado o ofensivo\n" .
                 "2. El nombre debe ser profesional y apto para todo público\n" .
                 "3. Debe describir claramente un producto o servicio\n" .
                 "4. No debe contener lenguaje ofensivo, grosero o inapropiado\n\n" .
                 "NOMBRE A VALIDAR: \"" . addslashes($name) . "\"\n\n" .
                 "Responde SOLO con un JSON en este formato exacto:\n" .
                 '{"accepted": true, ' .
                 '"reason": "El nombre es apropiado y cumple con las reglas", ' .
                 '"suggestions": ["Sugerencia de mejora opcional"], ' .
                 '"inappropriate": false}';

        return $this->makeValidationRequest($prompt);
    }

    /**
     * Valida el producto completo con ChatGPT
     */
    protected function validateFullProduct(array $data): array
    {
        // Obtener información de la categoría si está disponible
        $categoryInfo = '';
        if (!empty($data['category_id'])) {
            $category = \App\Models\EntrepreneurshipCategory::find($data['category_id']);
            if ($category) {
                $categoryInfo = "CATEGORÍA: " . $category->name . "\n";
            }
        }

        $prompt = "Eres un experto en validación de productos para una plataforma de emprendedores.\n\n" .
                 "TAREA: Analiza el siguiente producto y determina si es apropiado y cumple con las reglas.\n\n" .
                 "REGLAS DE VALIDACIÓN:\n" .
                 "1. NOMBRE:\n" .
                 "   - Debe ser claro, descriptivo y profesional\n" .
                 "   - Mínimo 5 caracteres, máximo 100\n" .
                 "   - Sin lenguaje ofensivo o inapropiado\n\n" .
                 "2. DESCRIPCIÓN:\n" .
                 "   - Debe describir claramente el producto\n" .
                 "   - Mínimo 20 caracteres\n" .
                 "   - Sin enlaces o información de contacto\n\n" .
                 "3. CONTENIDO INAPROPIADO:\n" .
                 "   - Rechaza cualquier contenido sexual, violento o ofensivo\n" .
                 "   - Rechaza lenguaje inapropiado o grosero\n" .
                 "   - Rechaza contenido ilegal o que promueva actividades peligrosas\n\n" .
                 "DATOS DEL PRODUCTO:\n" .
                 "NOMBRE: " . ($data['name'] ?? 'No proporcionado') . "\n" .
                 "DESCRIPCIÓN: " . ($data['description'] ?? 'No proporcionada') . "\n" .
                 $categoryInfo .
                 "PRECIO: " . ($data['price'] ?? 'No especificado') . "\n\n" .
                 "Responde SOLO con un JSON en este formato exacto:\n" .
                 '{"accepted": true, ' .
                 '"reason": "El producto cumple con todas las reglas", ' .
                 '"suggestions": ["Sugerencia de mejora opcional"], ' .
                 '"inappropriate": false, ' .
                 '"fields_with_issues": ["name", "description"]}';

        return $this->makeValidationRequest($prompt);
    }

    /**
     * Valida un producto existente contra los nuevos datos
     */
    public function validateProductUpdate($existingProduct, array $newData): array
    {
        $prompt = "Eres un validador experto de productos. Analiza los cambios propuestos para un producto existente.\n\n" .
                 "PRODUCTO ACTUAL:\n" .
                 "Nombre: " . $existingProduct->name . "\n" .
                 "Descripción: " . $existingProduct->description . "\n" .
                 "Categoría: " . ($existingProduct->category ? $existingProduct->category->name : 'Sin categoría') . "\n\n" .
                 "CAMBIOS PROPUESTOS:\n";

        foreach ($newData as $field => $value) {
            $prompt .= "- $field: " . (is_string($value) ? "\"$value\"" : json_encode($value)) . "\n";
        }

        $prompt .= "\nINSTRUCCIONES:\n" .
                 "1. Verifica que los cambios mantengan la coherencia con el producto existente\n" .
                 "2. Asegúrate de que el contenido sea apropiado para todo público\n" .
                 "3. Revisa que la información sea clara y profesional\n" . 
                 "4. Marca como 'inappropriate' cualquier contenido ofensivo o inadecuado\n\n" .
                 "Responde SOLO con un JSON en este formato exacto:\n" .
                 '{"accepted": true, ' .
                 '"reason": "Los cambios son apropiados y mantienen la coherencia del producto", ' . 
                 '"suggestions": ["Sugerencia de mejora opcional"], ' .
                 '"inappropriate": false, ' .
                 '"fields_with_issues": ["field1", "field2"]}';

        return $this->makeValidationRequest($prompt);
    }

    /**
     * Valida un emprendimiento con ChatGPT
     */
    public function validateEntrepreneurship(array $data): array
    {
        // Obtener información de la categoría si está disponible
        $categoryInfo = '';
        if (!empty($data['category'])) {
            $category = \App\Models\EntrepreneurshipCategory::find($data['category']);
            if ($category) {
                $categoryInfo = "CATEGORÍA: " . $category->name . "\n";
            }
        }

        $prompt = "Eres un experto en validación de emprendimientos para una plataforma de emprendedores.\n\n" .
                 "TAREA: Analiza el siguiente emprendimiento y determina si es apropiado y cumple con las reglas.\n\n" .
                 "REGLAS DE VALIDACIÓN:\n" .
                 "1. NOMBRE:\n" .
                 "   - Debe ser claro, descriptivo y profesional\n" .
                 "   - Mínimo 5 caracteres, máximo 100\n" .
                 "   - Sin lenguaje ofensivo o inapropiado\n\n" .
                 "2. DESCRIPCIÓN:\n" .
                 "   - Debe describir claramente el emprendimiento\n" .
                 "   - Mínimo 50 caracteres\n" . 
                 "   - Sin enlaces o información de contacto directa\n\n" .
                 "3. CONTENIDO INAPROPIADO:\n" .
                 "   - Rechaza cualquier contenido sexual, violento o ofensivo\n" .
                 "   - Rechaza lenguaje inapropiado o grosero\n" .
                 "   - Rechaza contenido ilegal o que promueva actividades peligrosas\n\n" .
                 "DATOS DEL EMPRENDIMIENTO:\n" .
                 "NOMBRE: " . ($data['name'] ?? 'No proporcionado') . "\n" .
                 "DESCRIPCIÓN: " . ($data['description'] ?? 'No proporcionada') . "\n" .
                 $categoryInfo . "\n" .
                 "Responde SOLO con un JSON en este formato exacto:\n" .
                 '{"accepted": true, ' .
                 '"reason": "El emprendimiento cumple con todas las reglas", ' .
                 '"suggestions": ["Sugerencia de mejora opcional"], ' .
                 '"inappropriate": false, ' .
                 '"fields_with_issues": ["name", "description"]}';

        return $this->makeValidationRequest($prompt);
    }

    /**
     * Valida una actualización de emprendimiento
     */
    public function validateEntrepreneurshipUpdate($existingEntrepreneurship, array $newData): array
    {
        $prompt = "Eres un validador experto de emprendimientos. Analiza los cambios propuestos para un emprendimiento existente.\n\n" .
                 "EMPRENDIMIENTO ACTUAL:\n" .
                 "Nombre: " . $existingEntrepreneurship->name . "\n" .
                 "Descripción: " . $existingEntrepreneurship->description . "\n" .
                 "Categoría: " . ($existingEntrepreneurship->categoryRelation ? $existingEntrepreneurship->categoryRelation->name : 'Sin categoría') . "\n\n" .
                 "CAMBIOS PROPUESTOS:\n";

        foreach ($newData as $field => $value) {
            $prompt .= "- $field: " . (is_string($value) ? "\"$value\"" : json_encode($value)) . "\n";
        }

        $prompt .= "\nINSTRUCCIONES:\n" .
                 "1. Verifica que los cambios mantengan la coherencia con el emprendimiento existente\n" .
                 "2. Asegúrate de que el contenido sea apropiado para todo público\n" .
                 "3. Revisa que la información sea clara y profesional\n" .
                 "4. Marca como 'inappropriate' cualquier contenido ofensivo o inadecuado\n\n" .
                 "Responde SOLO con un JSON en este formato exacto:\n" .
                 '{"accepted": true, ' .
                 '"reason": "Los cambios son apropiados y mantienen la coherencia del emprendimiento", ' .
                 '"suggestions": ["Sugerencia de mejora opcional"], ' .
                 '"inappropriate": false, ' .
                 '"fields_with_issues": ["field1", "field2"]}';

        return $this->makeValidationRequest($prompt);
    }

    /**
     * Realiza la petición a la API de OpenAI
     */
    /**
     * Realiza la petición a la API de OpenAI para validación
     */
    protected function makeValidationRequest(string $prompt): array
    {
        try {
            // Add debug logging
            \Log::debug('Sending validation request to OpenAI', [
                'prompt' => $prompt
            ]);

            $response = $this->createChatCompletion([
                [
                    'role' => 'system', 
                    'content' => 'Eres un validador experto para una plataforma de emprendedores. Solo puedes responder con un JSON válido que siga exactamente el formato solicitado.'
                ],
                ['role' => 'user', 'content' => $prompt]
            ]);

            $responseContent = $response['choices'][0]['message']['content'] ?? '{}';
            
            // Log the raw response for debugging
            \Log::debug('Raw OpenAI response', [
                'response' => $responseContent
            ]);

            // Try to find JSON in the response
            $jsonStart = strpos($responseContent, '{');
            $jsonEnd = strrpos($responseContent, '}');
            
            if ($jsonStart === false || $jsonEnd === false) {
                throw new \Exception('No se encontró un JSON válido en la respuesta');
            }
            
            $jsonString = substr($responseContent, $jsonStart, $jsonEnd - $jsonStart + 1);
            $result = json_decode($jsonString, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Formato de respuesta inválido de OpenAI: ' . json_last_error_msg());
            }

            // Ensure required fields exist in the response
            $defaultResponse = [
                'accepted' => false,
                'reason' => 'Error en la validación',
                'suggestions' => [],
                'inappropriate' => false,
                'fields_with_issues' => []
            ];

            $validatedResponse = array_merge($defaultResponse, $result);
            
            // Ensure boolean fields are actually booleans
            $validatedResponse['accepted'] = (bool)($validatedResponse['accepted'] ?? false);
            $validatedResponse['inappropriate'] = (bool)($validatedResponse['inappropriate'] ?? false);
            
            // Ensure arrays are actually arrays
            if (!is_array($validatedResponse['suggestions'] ?? null)) {
                $validatedResponse['suggestions'] = [];
            }
            if (!is_array($validatedResponse['fields_with_issues'] ?? null)) {
                $validatedResponse['fields_with_issues'] = [];
            }

            return [
                'accepted' => $validatedResponse['accepted'],
                'reason' => $validatedResponse['reason'],
                'suggestions' => $validatedResponse['suggestions'],
                'inappropriate' => $validatedResponse['inappropriate'],
                'fields_with_issues' => $validatedResponse['fields_with_issues']
            ];
            // Ensure the response has the correct structure
            return [
                'accepted' => (bool)($validatedResponse['accepted'] ?? false),
                'reason' => $validatedResponse['reason'] ?? 'Error en la validación',
                'suggestions' => $validatedResponse['suggestions'] ?? [],
                'inappropriate' => (bool)($validatedResponse['inappropriate'] ?? false)
            ];
            // Ensure boolean fields are actually booleans
            $validatedResponse['accepted'] = (bool)($validatedResponse['accepted'] ?? false);
            $validatedResponse['inappropriate'] = (bool)($validatedResponse['inappropriate'] ?? false);
            
            // Ensure suggestions is an array
            if (!is_array($validatedResponse['suggestions'] ?? null)) {
                $validatedResponse['suggestions'] = [];
            }

            return $validatedResponse;

        } catch (\Exception $e) {
            $errorMessage = 'Error en la petición de validación: ' . $e->getMessage();
            \Log::error($errorMessage, [
                'exception' => $e->getTraceAsString()
            ]);
            
            // In case of error, be more specific about what went wrong
            return [
                'accepted' => true, // Default to accepting on error to not block users
                'reason' => 'Error temporal en la validación. Por favor, verifica que los datos sean correctos.',
                'suggestions' => ['Si el problema persiste, contacta al soporte técnico'],
                'inappropriate' => false,
                'error' => $e->getMessage()
            ];
        }

        try {
            $response = $this->createChatCompletion([
                [
                    'role' => 'system', 
                    'content' => 'Eres un experto en marketing de productos y copywriting para comercio electrónico. Tu objetivo es ayudar a que los productos sean más atractivos para los clientes potenciales.

PROCESO DE VALIDACIÓN:
1. Primero verifica si el producto viola alguna política (drogas, armas, contenido para adultos, etc.)
2. Si hay una violación, rechaza el producto inmediatamente
3. Si el producto es apropiado, analiza el nombre y descripción actuales
4. Proporciona sugerencias CREATIVAS para hacer el nombre y la descripción más atractivos y efectivos

DIRECTRICES PARA MEJORAR EL NOMBRE Y DESCRIPCIÓN:
- Usa palabras poderosas que despierten emociones positivas
- Destaca los beneficios principales del producto
- Incluye adjetivos descriptivos que generen interés
- Mantén el nombre claro pero atractivo (máx. 60 caracteres idealmente)
- La descripción debe ser persuasiva y resaltar características únicas
- Incluye llamados a la acción cuando sea apropiado

Responde SOLO con un JSON en el formato {"accepted": boolean, "reason": string, "suggestions": [string]} sin comentarios adicionales.'
                ],
                ['role' => 'user', 'content' => $prompt]
            ]);

            $content = $response['choices'][0]['message']['content'] ?? '{}';
            
            // Clean up the response to ensure it's valid JSON
            $jsonStart = strpos($content, '{');
            $jsonEnd = strrpos($content, '}');
            
            if ($jsonStart !== false && $jsonEnd !== false) {
                $jsonString = substr($content, $jsonStart, $jsonEnd - $jsonStart + 1);
                $result = json_decode($jsonString, true);
                
                if (json_last_error() === JSON_ERROR_NONE && isset($result['accepted'])) {
                    return [
                        'accepted' => (bool)$result['accepted'],
                        'reason' => $result['reason'] ?? ($result['accepted'] ? 'El producto cumple con los requisitos' : 'El producto no cumple con los requisitos'),
                        'suggestions' => $result['suggestions'] ?? [],
                        'inappropriate' => $result['inappropriate'] ?? false
                    ];
                }
            }
            
            throw new \Exception('No se pudo procesar la respuesta de validación');
        } catch (\Exception $e) {
            \Log::error('Error en processValidationResponse: ' . $e->getMessage());
            return [
                'accepted' => false,
                'reason' => 'Error al procesar la validación',
                'suggestions' => [],
                'inappropriate' => false
            ];
        }
    }

    /**
     * Build a prompt for the assistant based on context
     */
    protected function buildAssistantPrompt(array $data, string $context): string
    {
        $prompt = $this->getSystemPrompt($context) . "\n\n";
        $prompt .= "Context: $context\n\n";
        $prompt .= "Input data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n\n";
        
        switch ($context) {
            case 'greeting':
                $prompt .= "Respond with a friendly greeting in Spanish and ask how you can assist. Format: {\"greeting\": string, \"question\": string}";
                break;
                
            case 'product_info':
                $prompt .= "Provide information about the product in Spanish. Format: {\"name\": string, \"description\": string, \"features\": string[], \"price\": string}";
                break;
                
            case 'faq':
                $prompt .= "Answer the following question in Spanish. Format: {\"answer\": string, \"related_questions\": string[]}";
                break;
                
            case 'validation':
                $prompt .= "Validate the following data and respond with a JSON in the exact format: {\"accepted\": boolean, \"reason\": string, \"suggestions\": string[]}";
                break;
                
            default:
                $prompt .= "Process the following request and respond with a JSON object.";
        }
        
        return $prompt;
    }

    /**
     * Process the OpenAI API response and extract the validation result
     */
    protected function processValidationResponse(array $response): array
    {
        $content = $response['choices'][0]['message']['content'] ?? '{}';
        
        // Try to parse the JSON response
        $result = json_decode($content, true);
        
        if (json_last_error() === JSON_ERROR_NONE && isset($result['accepted'])) {
            return [
                'accepted' => (bool)$result['accepted'],
                'reason' => $result['reason'] ?? ($result['accepted'] ? 'El emprendimiento cumple con los requisitos' : 'El emprendimiento no cumple con los requisitos'),
                'suggestions' => $result['suggestions'] ?? [],
                'inappropriate' => $result['inappropriate'] ?? false
            ];
        }
        
        // Fallback response if JSON parsing fails or response is invalid
        return [
            'accepted' => false,
            'reason' => 'Error en el formato de validación',
            'suggestions' => [],
            'inappropriate' => false
        ];
    }
}
