<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $title ? e($title) : 'Compartir' }}</title>
    <link rel="canonical" href="{{ $url }}" />

    <!-- Open Graph -->
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:type" content="{{ $type ?? 'website' }}">
    <meta property="og:url" content="{{ $url }}">
    @if(!empty($image))
        <meta property="og:image" content="{{ $image }}">
        <meta property="og:image:secure_url" content="{{ $image }}">
        <meta property="og:image:type" content="image/jpeg">
    @endif
    <meta property="og:site_name" content="{{ $site_name ?? 'EmprendU' }}">
    @if(!empty($fb_app_id))
        <meta property="fb:app_id" content="{{ $fb_app_id }}">
    @endif

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $title }}">
    <meta name="twitter:description" content="{{ $description }}">
    @if(!empty($image))
        <meta name="twitter:image" content="{{ $image }}">
    @endif

    <!-- No meta refresh to ensure scrapers do not follow redirects before reading OG -->
</head>
<body>
    <noscript>
        <p>Serás redirigido en breve. Si no ocurre automáticamente, <a href="{{ e($redirect_url) }}">haz clic aquí</a>.</p>
    </noscript>
    @unless(!empty($is_bot) && $is_bot)
        <script>
            // Redirección rápida para usuarios normales; los scrapers no serán redirigidos
            (function(){
                var to = {{ json_encode($redirect_url) }};
                if (to) {
                    window.location.replace(to);
                }
            })();
        </script>
    @endunless
</body>
</html>
