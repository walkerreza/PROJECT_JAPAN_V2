<?php

test('literal Inertia render targets have matching frontend pages', function () {
    $projectRoot = dirname(__DIR__, 2);
    $missingPages = [];
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($projectRoot.'/app', FilesystemIterator::SKIP_DOTS)
    );

    foreach ($files as $file) {
        if (! $file->isFile() || $file->getExtension() !== 'php') {
            continue;
        }

        $source = file_get_contents($file->getPathname());
        preg_match_all('/Inertia::render\(\s*[\'\"]([^\'\"]+)[\'\"]/', $source, $matches);

        foreach ($matches[1] as $page) {
            $jsxPage = $projectRoot."/resources/js/Pages/{$page}.jsx";
            $jsPage = $projectRoot."/resources/js/Pages/{$page}.js";

            if (! file_exists($jsxPage) && ! file_exists($jsPage)) {
                $relativeController = str_replace('\\', '/', substr($file->getPathname(), strlen($projectRoot) + 1));
                $missingPages[] = "{$relativeController} -> {$page}";
            }
        }
    }

    expect($missingPages)->toBeEmpty(
        'Target Inertia berikut tidak memiliki file page: '.implode(', ', $missingPages)
    );
});
