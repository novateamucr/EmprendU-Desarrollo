<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $data['subject'] ?? 'Bienvenido a EmpowerUp' }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            background-color: #f4f6f8;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        .header {
            background-color: #76B0CD;
            color: white;
            text-align: center;
            padding: 25px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            letter-spacing: 1px;
        }
        .content {
            padding: 25px;
            color: #333;
            align-items: center;
            text-align: center;
        }
        .content h2 {
            color: #76B0CD;
        }
        .action-button {
            display: inline-block;
            background: #76B0CD;
            color: white !important;
            padding: 12px 25px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
        }
        .action-button:hover {
            background: #0feb1aff;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 15px;
            text-align: center;
            font-size: 0.9em;
            color: #777;
            border-top: 1px solid #e0e0e0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EmpowerUp</h1>
        </div>
        
        <div class="content">
            @if(isset($data['greeting']))
                <h2>{{ $data['greeting'] }}</h2>
            @endif

            @if(isset($data['content']))
                <p>{!! nl2br(e($data['content'])) !!}</p>
            @endif

            @if(isset($data['action_url']) && isset($data['action_text']))
                <a href="{{ $data['action_url'] }}" class="action-button">
                    {{ $data['action_text'] }}
                </a>
            @endif
        </div>

        <div class="footer">
            <p>Si no solicitaste esta acción, puedes ignorar este mensaje.</p>
            <p>&copy; {{ date('Y') }} EmpowerUp. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
