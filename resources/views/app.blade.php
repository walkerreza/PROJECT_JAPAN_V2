<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Yuji+Syuku&display=swap" rel="stylesheet">

        <!-- Kustom Favicon Nano Banana -->
        <link rel="icon" type="image/png" href="{{ asset('logo.png') }}?v=1" />
        <link rel="shortcut icon" href="{{ asset('logo.png') }}?v=1" />

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @routes
        @php
            $japanlingoTheme = ['activeTheme' => 'spring', 'customTheme' => []];

            try {
                if (\Illuminate\Support\Facades\Schema::hasTable('app_settings')) {
                    $themeSetting = \Illuminate\Support\Facades\DB::table('app_settings')
                        ->where('key', 'frontend_theme')
                        ->value('value');

                    if ($themeSetting) {
                        $decodedTheme = json_decode($themeSetting, true);

                        if (is_array($decodedTheme)) {
                            $japanlingoTheme = array_merge($japanlingoTheme, $decodedTheme);
                        }
                    }
                }
            } catch (\Throwable $e) {
                $japanlingoTheme = ['activeTheme' => 'spring', 'customTheme' => []];
            }
        @endphp
        <script>
            window.__JAPANLINGO_THEME__ = @json($japanlingoTheme);
        </script>
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
