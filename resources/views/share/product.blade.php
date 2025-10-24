<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $title ? e($title) : 'Compartir' }}</title>

    <!-- Open Graph -->
    <meta property="og:title" content="{{ e($title) }}">
    <meta property="og:description" content="{{ e($description) }}">
    @if(!empty($image))
        <meta property="og:image" content="{{ e($image) }}">
    @endif
    <meta property="og:url" content="{{ e($url) }}">
    <meta property="og:type" content="{{ e($type ?? 'website') }}">

    <!-- Twitter (opcional) -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ e($title) }}">
    <meta name="twitter:description" content="{{ e($description) }}">
    @if(!empty($image))
        <meta name="twitter:image" content="{{ e($image) }}">
    @endif

    <!-- Fallback redirect for non-JS environments -->
    <meta http-equiv="refresh" content="5;url={{ e($redirect_url) }}">
</head>
<body>
    <noscript>
        <p>Serás redirigido en breve. Si no ocurre automáticamente, <a href="{{ e($redirect_url) }}">haz clic aquí</a>.</p>
    </noscript>
    <script>
        // Redirección rápida para usuarios normales; los scrapers se quedarán con las OG
        (function(){
            var to = {{ json_encode($redirect_url) }};
            if (to) {
                window.location.replace(to);
            }
        })();
    </script>
</body>
</html>
