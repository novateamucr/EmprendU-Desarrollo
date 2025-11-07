<?php

namespace App\Exceptions;

use Exception;

class SensitiveContentException extends Exception
{
    protected $message = 'The uploaded image contains sensitive content that is not allowed.';
    protected $code = 422; // Unprocessable Entity
}
