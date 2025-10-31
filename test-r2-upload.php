<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

// Test R2 connection and file upload
function testR2Upload() {
    try {
        $disk = Storage::disk('r2');
        
        // Test file content
        $testContent = 'This is a test file content';
        $testPath = 'test/test-file-' . time() . '.txt';
        
        // Try to upload a test file
        $uploaded = $disk->put($testPath, $testContent, [
            'visibility' => 'public',
            'ContentType' => 'text/plain'
        ]);
        
        if ($uploaded) {
            echo "File uploaded successfully!\n";
            echo "File URL: " . $disk->url($testPath) . "\n";
            
            // Try to read the file back
            $content = $disk->get($testPath);
            echo "File content: " . $content . "\n";
            
            // Clean up
            $disk->delete($testPath);
            echo "Test file deleted.\n";
        } else {
            echo "Failed to upload test file.\n";
        }
        
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        echo "File: " . $e->getFile() . "\n";
        echo "Line: " . $e->getLine() . "\n";
    }
}

testR2Upload();
