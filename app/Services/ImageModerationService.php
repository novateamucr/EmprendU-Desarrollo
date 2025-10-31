<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class ImageModerationService
{
    protected $apiKey;
    protected $endpoint = 'https://api.openai.com/v1/chat/completions';
    protected $model = 'gpt-4o'; // Updated to use the latest model

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
        
        if (empty($this->apiKey)) {
            Log::error('OpenAI API key is not configured. Please verify your .env and config/services.php');
            throw new \RuntimeException('OpenAI API key is not properly configured. Please verify your configuration.');
        }
        
        Log::info('OpenAI API key loaded successfully');
    }

    /**
     * Check if an image contains sensitive content
     * 
     * @param UploadedFile $image
     * @return array ['safe' => bool, 'categories' => array, 'scores' => array]
     */
    public function checkImage(UploadedFile $image): array
    {
        try {
            Log::info('Starting image moderation', [
                'filename' => $image->getClientOriginalName(),
                'size' => $image->getSize(),
                'mime' => $image->getMimeType()
            ]);

            // Check if API key is set
            if (empty($this->apiKey)) {
                Log::error('OpenAI API key is not configured');
                return [
                    'safe' => true, // Default to safe if API is not configured
                    'categories' => [],
                    'reason' => 'Moderation service not configured',
                    'raw_response' => 'API key not set'
                ];
            }

            // Convert image to base64
            $imageContent = file_get_contents($image->getRealPath());
            if ($imageContent === false) {
                throw new \Exception('Failed to read image file');
            }
            
            $base64Image = base64_encode($imageContent);
            $imageSizeKB = strlen($imageContent) / 1024;
            
            Log::debug('Image prepared for moderation', [
                'size_kb' => round($imageSizeKB, 2),
                'base64_length' => strlen($base64Image)
            ]);

            // Prepare the request to OpenAI Vision API
            $requestData = [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a strict content moderation system. Analyze the image and respond with a JSON object. Be extremely strict with NSFW content, especially nudity, sexual content, and explicit material. If you detect any inappropriate content, mark it as unsafe.',
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => 'Analyze this image STRICTLY for inappropriate content and respond with a JSON object. Check for and flag ANY of the following:
1. Nudity or sexual content (partial or full, artistic or not)
2. Explicit or suggestive content
3. Pornographic material
4. Adult content
5. Explicit body parts
6. Sexual acts or simulations
7. Any NSFW material

IMPORTANT: Be extremely strict. If you have ANY doubt about the content, mark it as unsafe.

Return a JSON object with this exact structure:
{
    "safe": false,
    "categories": ["nudity", "explicit"],
    "reason": "Detailed explanation of why the content is not safe"
}

If the image is completely safe, return:
{
    "safe": true,
    "categories": [],
    "reason": "No inappropriate content detected"
}'
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => 'data:image/' . $image->getClientOriginalExtension() . ';base64,' . $base64Image,
                                    'detail' => 'high'
                                ]
                            ]
                        ]
                    ]
                ],
                'max_tokens' => 500,
                'temperature' => 0.1
            ];

            Log::debug('Sending request to OpenAI API');
            
            $startTime = microtime(true);
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(30) // 30 seconds timeout
            ->post('https://api.openai.com/v1/chat/completions', $requestData);
            
            $responseTime = round((microtime(true) - $startTime) * 1000); // in ms
            
            Log::debug('OpenAI API response', [
                'status' => $response->status(),
                'response_time_ms' => $responseTime,
                'response_headers' => $response->headers()
            ]);

            if (!$response->successful()) {
                $errorResponse = $response->json();
                Log::error('OpenAI API error', [
                    'status' => $response->status(),
                    'error' => $errorResponse['error'] ?? 'Unknown error',
                    'response' => $response->body()
                ]);
                
                // Return safe if API fails to avoid blocking uploads
                return [
                    'safe' => true,
                    'categories' => [],
                    'reason' => 'Failed to analyze image: ' . ($errorResponse['error']['message'] ?? 'API error'),
                    'raw_response' => $response->body()
                ];
            }

            $result = $response->json();
            
            Log::debug('OpenAI API response data', [
                'response_structure' => array_keys($result),
                'has_choices' => isset($result['choices']),
                'choices_count' => isset($result['choices']) ? count($result['choices']) : 0
            ]);
            
            if (!isset($result['choices'][0]['message']['content'])) {
                Log::error('Invalid response format from OpenAI API', [
                    'response' => $result,
                    'content_key_exists' => isset($result['choices'][0]['message']['content'])
                ]);
                
                // Return safe if we can't parse the response
                return [
                    'safe' => true,
                    'categories' => [],
                    'reason' => 'Invalid response format from moderation service',
                    'raw_response' => json_encode($result)
                ];
            }
            
            $content = $result['choices'][0]['message']['content'];
            
            Log::debug('Raw moderation response', ['content' => $content]);
            
            // Clean up the response (sometimes includes code blocks or markdown)
            $content = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/i', '$1', $content);
            $content = trim($content);
            
            // Handle cases where the response might be wrapped in markdown code blocks
            if (str_starts_with($content, '```json')) {
                $content = substr($content, 6);
                $content = substr($content, 0, -3);
                $content = trim($content);
            }
            
            $moderationResult = json_decode($content, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                // If JSON parsing fails, log the raw response and assume the image is safe
                Log::warning('Failed to parse moderation response', [
                    'content' => $content,
                    'error' => json_last_error_msg(),
                    'json_error' => json_last_error()
                ]);
                
                // Default to safe if we can't parse the response
                return [
                    'safe' => true,
                    'categories' => [],
                    'reason' => 'Could not parse moderation response',
                    'raw_response' => $content
                ];
                return [
                    'safe' => false,
                    'categories' => ['unparsable_response'],
                    'reason' => 'Could not verify image content',
                    'raw_response' => $content
                ];
            }
            
            // Log the moderation result
            Log::info('Image moderation result', [
                'safe' => $moderationResult['safe'] ?? 'not_set',
                'categories' => $moderationResult['categories'] ?? [],
                'reason' => $moderationResult['reason'] ?? 'No reason provided',
                'raw_response' => $content
            ]);
            
            // Default to unsafe if there are any categories or if safe is not explicitly true
            $isSafe = ($moderationResult['safe'] === true) && 
                     (empty($moderationResult['categories']) || !is_array($moderationResult['categories']));
            
            $result = [
                'safe' => $isSafe,
                'categories' => $moderationResult['categories'] ?? [],
                'reason' => $moderationResult['reason'] ?? 'Content was analyzed',
                'raw_response' => $content // For debugging
            ];
            
            // If not safe, log a warning
            if (!$isSafe) {
                Log::warning('Inappropriate content detected', [
                    'categories' => $result['categories'],
                    'reason' => $result['reason']
                ]);
            }
            
            Log::debug('Final moderation result', $result);
            return $result;
            
        } catch (\Exception $e) {
            Log::error('Image moderation error', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Default to safe if there's an error to avoid blocking uploads
            return [
                'safe' => true,
                'categories' => [],
                'reason' => 'Error processing image: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString()
            ];
        }
    }
}
