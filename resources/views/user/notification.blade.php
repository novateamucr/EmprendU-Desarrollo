<!DOCTYPE html>
<html>
<head>
    <title>{{ $data['subject'] ?? 'Notificación' }}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ config('app.name') }}</h1>
        </div>
        
        <div class="content">
            @if(isset($data['greeting']))
                <h2>{{ $data['greeting'] }}</h2>
            @endif

            @if(isset($data['content']))
                <p>{!! nl2br(e($data['content'])) !!}</p>
            @endif

            @if(isset($data['action_url']) && isset($data['action_text']))
                <p style="margin: 25px 0;">
                    <a href="{{ $data['action_url'] }}" 
                       style="background: #4e73df; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        {{ $data['action_text'] }}
                    </a>
                </p>
            @endif
        </div>

        <div class="footer">
            <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>