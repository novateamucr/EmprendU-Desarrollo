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
        $requiredFields = ['name', 'description', 'price', 'category_id'];
        
        // Check for required fields
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return [
                    'accepted' => false,
                    'reason' => "Falta el campo requerido: $field"
                ];
            }
        }

        // Validate price is a positive number
        if (isset($data['price']) && (!is_numeric($data['price']) || $data['price'] < 0)) {
            return [
                'accepted' => false,
                'reason' => 'El precio debe ser un número positivo'
            ];
        }

        // Prepare the validation prompt
        $prompt = "Evalúa cómo hacer este producto más atractivo para los compradores. Responde SOLO con un JSON en el formato exacto: {\"accepted\": boolean, \"reason\": string, \"suggestions\": [string]}. \n        
        DATOS DEL PRODUCTO ACTUAL:\n        - Nombre: " . ($data['name'] ?? '') . "\n";
        $prompt .= "- Descripción: " . ($data['description'] ?? '') . "\n";
        if (!empty($data['long_description'])) {
            $prompt .= "- Descripción Larga: " . $data['long_description'] . "\n";
        }
        $prompt .= "- Precio: " . ($data['price'] ?? '') . "\n";
        $prompt .= "- Categoría: " . ($data['category_id'] ?? '') . "\n";
        
        $prompt .= "\nOBJETIVO:\n";
        $prompt .= "Proporciona sugerencias CREATIVAS para hacer el nombre y la descripción más atractivos y efectivos para aumentar las ventas.\n";
        
        $prompt .= "\nGUÍA PARA MEJORAR EL NOMBRE:\n";
        $prompt .= "1. Hazlo más específico y descriptivo\n";
        $prompt .= "2. Incluye beneficios clave o características únicas\n";
        $prompt .= "3. Usa palabras poderosas que generen emociones positivas\n";
        $prompt .= "4. Mantenlo entre 30-60 caracteres para mejor legibilidad\n";
        $prompt .= "5. Usa mayúsculas estratégicamente para palabras importantes\n";
        
        $prompt .= "\nGUÍA PARA MEJORAR LA DESCRIPCIÓN:\n";
        $prompt .= "1. Comienza con un gancho que capte la atención\n";
        $prompt .= "2. Destaca los beneficios principales, no solo las características\n";
        $prompt .= "3. Usa viñetas para facilitar la lectura\n";
        $prompt .= "4. Incluye palabras clave importantes para búsquedas\n";
        $prompt .= "5. Termina con un llamado a la acción claro\n";
        
        $prompt .= "\nEJEMPLOS DE SUGERENCIAS EFECTIVAS:\n";
        $prompt .= "- 'Nombre sugerido: [ejemplo atractivo]'\n";
        $prompt .= "- 'Descripción sugerida: [ejemplo de párrafo persuasivo]'\n";
        $prompt .= "- 'Sugerencia: Agregar viñetas con beneficios clave'\n";
        $prompt .= "- 'Recomendación: Incluir palabras de poder como [ejemplos]'\n";
        $prompt .= "\nResponde SOLO con el JSON, sin texto adicional.";

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
                        'suggestions' => $result['suggestions'] ?? []
                    ];
                }
            }
            
            // Fallback response if JSON parsing fails
            return [
                'accepted' => false,
                'reason' => 'Error en el formato de validación',
                'suggestions' => []
            ];
            
        } catch (\Exception $e) {
            return [
                'accepted' => false,
                'reason' => 'Error al validar el producto: ' . $e->getMessage(),
                'suggestions' => []
            ];
        }
    }

    public function validateEntrepreneurship(array $data): array
    {
        $requiredFields = ['name', 'description', 'category'];
        
        // Check for required fields
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return [
                    'accepted' => false,
                    'reason' => "Falta el campo requerido: $field"
                ];
            }
        }

        // Prepare the validation prompt
        $prompt = "Evalúa el siguiente emprendimiento y responde SOLO con un JSON en el formato exacto: {\"accepted\": boolean, \"reason\": string}\n\n";
        $prompt .= "Nombre: " . $data['name'] . "\n";
        $prompt .= "Descripción: " . $data['description'] . "\n";
        $prompt .= "Categoría: " . $data['category'] . "\n";
        if (!empty($data['contact_info'])) {
            $prompt .= "Contacto: " . $data['contact_info'] . "\n";
        }
        $prompt .= "\nReglas de validación:\n";
        $prompt .= "1. El nombre debe ser apropiado y no ofensivo\n";
        $prompt .= "2. La descripción debe ser clara y relevante\n";
        $prompt .= "3. La categoría debe coincidir con el tipo de negocio\n";
        $prompt .= "4. No se permite contenido inapropiado o ilegal\n";
        $prompt .= "5. La información de contacto debe ser válida (si se proporciona)\n";
        $prompt .= "\nResponde SOLO con el JSON, sin texto adicional.";

        try {
            $response = $this->createChatCompletion([
                ['role' => 'system', 'content' => 'Eres un validador de emprendimientos. Responde SOLO con un JSON en el formato {\"accepted\": boolean, \"reason\": string} sin comentarios adicionales.'],
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
                        'reason' => $result['reason'] ?? ($result['accepted'] ? 'El emprendimiento cumple con los requisitos' : 'El emprendimiento no cumple con los requisitos')
                    ];
                }
            }
            
            // Fallback response if JSON parsing fails
            return [
                'accepted' => false,
                'reason' => 'Error en el formato de validación'
            ];
            
        } catch (\Exception $e) {
            return [
                'accepted' => false,
                'reason' => 'Error al validar el emprendimiento. Por favor, intente nuevamente.'
            ];
        }
    }

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
                $prompt .= "Answer the question concisely in Spanish. Format: {\"question\": string, \"answer\": string}";
                break;
                
            case 'validate_entrepreneurship':
                $prompt .= "Validate this entrepreneurship listing and provide feedback. Format: {\"valid\": boolean, \"reason\": string, \"suggestions\": string[]}";
                break;
                
            default:
                $prompt .= "Provide a helpful response in Spanish. Format: {\"response\": string}";
        }
        
        return $prompt;
    }
}
