<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $title ? e($title) : 'Compartir' }}</title>

    <!-- Open Graph -->
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:type" content="{{ $type ?? 'website' }}">
    <meta property="og:url" content="{{ $url }}">
    @if(!empty($image))
        <meta property="og:image" content="{{ $image }}">
        <meta property="og:image:secure_url" content="{{ $image }}">
        <meta property="og:image:type" content="image/jpeg">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
    @endif
    <meta property="og:site_name" content="{{ $site_name ?? 'EmprendU' }}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $title }}">
    <meta name="twitter:description" content="{{ $description }}">
    @if(!empty($image))
        <meta name="twitter:image" content="{{ $image }}">
    @endif

    <!-- Fallback redirect for non-JS environments -->
    <meta http-equiv="refresh" content="2;url={{ $redirect_url }}">
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
