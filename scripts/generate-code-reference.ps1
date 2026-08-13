param(
    [string] $ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Get-RelativePath([string] $Path) {
    $root = (Resolve-Path $ProjectRoot).Path.TrimEnd('\')
    $resolved = (Resolve-Path $Path).Path
    return $resolved.Substring($root.Length).TrimStart('\').Replace('\', '/')
}

function Convert-PascalToWords([string] $Value) {
    $withoutExtension = [System.IO.Path]::GetFileNameWithoutExtension($Value)
    return (($withoutExtension -creplace '([a-z0-9])([A-Z])', '$1 $2') -replace '[_-]+', ' ').Trim()
}

function Escape-Markdown([string] $Value) {
    return $Value.Replace('|', '\|').Replace('`', '\`')
}

function Get-PhpSymbol([string] $Path) {
    $content = Get-Content $Path -Raw
    $match = [regex]::Match($content, '(?m)^\s*(?:abstract\s+|final\s+)?class\s+([A-Za-z0-9_]+)')
    if ($match.Success) { return $match.Groups[1].Value }

    $interface = [regex]::Match($content, '(?m)^\s*interface\s+([A-Za-z0-9_]+)')
    if ($interface.Success) { return $interface.Groups[1].Value }

    return '-'
}

function Get-JsSymbol([string] $Path) {
    $content = Get-Content $Path -Raw
    $patterns = @(
        'export\s+default\s+function\s+([A-Za-z0-9_]+)',
        'export\s+default\s+class\s+([A-Za-z0-9_]+)',
        'function\s+([A-Za-z0-9_]+)\s*\(',
        'const\s+([A-Za-z0-9_]+)\s*='
    )

    foreach ($pattern in $patterns) {
        $match = [regex]::Match($content, $pattern)
        if ($match.Success) { return $match.Groups[1].Value }
    }

    return '-'
}

function Get-BackendArea([string] $RelativePath) {
    switch -Regex ($RelativePath) {
        '^app/Http/Controllers/Admin/' { return 'Admin controller' }
        '^app/Http/Controllers/Auth/' { return 'Auth controller' }
        '^app/Http/Controllers/SuperAdmin/' { return 'Superadmin controller' }
        '^app/Http/Controllers/User/' { return 'User controller' }
        '^app/Http/Controllers/' { return 'Shared controller' }
        '^app/Models/' { return 'Eloquent model' }
        '^app/Services/' { return 'Domain service' }
        '^app/Console/Commands/' { return 'Artisan command' }
        '^app/Events/' { return 'Domain/broadcast event' }
        '^app/Listeners/' { return 'Event listener' }
        '^app/Notifications/Channels/' { return 'Notification channel' }
        '^app/Notifications/' { return 'Notification' }
        '^app/Http/Middleware/' { return 'HTTP middleware' }
        '^app/Http/Requests/' { return 'Form request' }
        '^app/Providers/' { return 'Service provider' }
        default { return 'Application class' }
    }
}

function Get-BackendPurpose([string] $RelativePath, [string] $Area) {
    $name = Convert-PascalToWords $RelativePath
    switch ($Area) {
        'Eloquent model' { return "Representasi dan relasi data $name." }
        'Domain service' { return "Aturan domain dan proses reusable untuk $name." }
        'Artisan command' { return "Operasi CLI/maintenance untuk $name." }
        'Domain/broadcast event' { return "Event aplikasi untuk $name." }
        'Event listener' { return "Menangani event terkait $name." }
        'Notification' { return "Membangun notifikasi $name." }
        'Notification channel' { return "Mengirim notifikasi melalui channel $name." }
        'HTTP middleware' { return "Menyaring request berdasarkan aturan $name." }
        'Form request' { return "Validasi request untuk $name." }
        'Service provider' { return "Registrasi/bootstrap layanan $name." }
        default { return "Endpoint dan orkestrasi HTTP untuk $name." }
    }
}

function Get-FrontendArea([string] $RelativePath) {
    switch -Regex ($RelativePath) {
        '^resources/js/Pages/Admin/' { return 'Admin page' }
        '^resources/js/Pages/Auth/' { return 'Auth page' }
        '^resources/js/Pages/SuperAdmin/' { return 'Superadmin page' }
        '^resources/js/Pages/User/' { return 'User page' }
        '^resources/js/Pages/' { return 'Public/shared page' }
        '^resources/js/Layouts/' { return 'Layout' }
        '^resources/js/Components/Features/' { return 'Feature component' }
        '^resources/js/Components/UI/' { return 'UI primitive' }
        '^resources/js/Components/Breeze/' { return 'Breeze primitive' }
        '^resources/js/Components/Navigation/' { return 'Navigation component' }
        '^resources/js/Components/Layout/' { return 'Layout component' }
        '^resources/js/Components/' { return 'Shared component' }
        '^resources/js/lib/' { return 'Frontend integration' }
        '^resources/js/app\.jsx$' { return 'Inertia entrypoint' }
        '^resources/js/bootstrap\.js$' { return 'HTTP bootstrap' }
        '^resources/css/' { return 'Stylesheet' }
        '^resources/views/' { return 'Blade shell' }
        '^resources/Images/' { return 'Source image' }
        default { return 'Resource' }
    }
}

function Get-FrontendPurpose([string] $RelativePath, [string] $Area) {
    $name = Convert-PascalToWords $RelativePath
    switch ($Area) {
        'Admin page' { return "Halaman admin untuk $name." }
        'Superadmin page' { return "Halaman superadmin untuk $name." }
        'User page' { return "Halaman pengguna untuk $name." }
        'Auth page' { return "Halaman autentikasi untuk $name." }
        'Feature component' { return "Komponen fitur reusable untuk $name." }
        'UI primitive' { return "Primitive UI bersama untuk $name." }
        'Breeze primitive' { return "Primitive bawaan/warisan Breeze untuk $name; audit pemakaian sebelum dihapus." }
        'Layout' { return "Kerangka halaman untuk $name." }
        'Frontend integration' { return "Integrasi frontend untuk $name." }
        'Inertia entrypoint' { return 'Bootstrap React/Inertia, resolver halaman, dan provider aplikasi.' }
        'HTTP bootstrap' { return 'Konfigurasi Axios dan header request aplikasi.' }
        'Stylesheet' { return 'Style global Tailwind dan aturan visual aplikasi.' }
        'Blade shell' { return 'Shell HTML Laravel untuk mount Inertia dan asset Vite.' }
        'Source image' { return "Asset gambar sumber untuk $name." }
        default { return "Komponen/resource untuk $name." }
    }
}

$outputDirectory = Join-Path $ProjectRoot 'docs/12-code-reference'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$backendFiles = Get-ChildItem (Join-Path $ProjectRoot 'app') -Recurse -File -Filter '*.php' | Sort-Object FullName
$backendLines = [System.Collections.Generic.List[string]]::new()
$backendLines.Add('# Katalog File Backend')
$backendLines.Add('')
$backendLines.Add('> Dibangkitkan oleh `scripts/generate-code-reference.ps1`. Jangan mengedit tabel secara manual; perbarui catatan arsitektur terpisah bila tanggung jawab domain berubah.')
$backendLines.Add('')
$backendLines.Add(('Total file PHP dalam `app/`: {0}.' -f $backendFiles.Count))
$backendLines.Add('')

foreach ($group in ($backendFiles | Group-Object { Get-BackendArea (Get-RelativePath $_.FullName) })) {
    $backendLines.Add("## $($group.Name)")
    $backendLines.Add('')
    $backendLines.Add('| File | Symbol utama | Tanggung jawab |')
    $backendLines.Add('|---|---|---|')

    foreach ($file in $group.Group) {
        $relative = Get-RelativePath $file.FullName
        $symbol = Get-PhpSymbol $file.FullName
        $purpose = Get-BackendPurpose $relative $group.Name
        $backendLines.Add("| ``$relative`` | ``$(Escape-Markdown $symbol)`` | $(Escape-Markdown $purpose) |")
    }

    $backendLines.Add('')
}

$backendLines.Add('## Catatan Pemeliharaan')
$backendLines.Add('')
$backendLines.Add('- Controller harus tipis; aturan lintas endpoint ditempatkan di service.')
$backendLines.Add('- Model menyimpan relasi/cast dan helper data, bukan orkestrasi HTTP.')
$backendLines.Add('- Route-model binding tetap memerlukan authorization eksplisit.')
$backendLines.Add('- File baru wajib masuk katalog dengan menjalankan generator ini.')
[System.IO.File]::WriteAllLines((Join-Path $outputDirectory 'backend-file-catalog.md'), $backendLines, [System.Text.UTF8Encoding]::new($false))

$resourceFiles = Get-ChildItem (Join-Path $ProjectRoot 'resources') -Recurse -File | Sort-Object FullName
$frontendLines = [System.Collections.Generic.List[string]]::new()
$frontendLines.Add('# Katalog File Frontend dan Resources')
$frontendLines.Add('')
$frontendLines.Add('> Dibangkitkan oleh `scripts/generate-code-reference.ps1`. Semua JS, JSX, CSS, Blade, dan source image di `resources/` tercantum di bawah.')
$frontendLines.Add('')
$frontendLines.Add(('Total file dalam `resources/`: {0}.' -f $resourceFiles.Count))
$frontendLines.Add('')

foreach ($group in ($resourceFiles | Group-Object { Get-FrontendArea (Get-RelativePath $_.FullName) })) {
    $frontendLines.Add("## $($group.Name)")
    $frontendLines.Add('')
    $frontendLines.Add('| File | Export/symbol utama | Tanggung jawab |')
    $frontendLines.Add('|---|---|---|')

    foreach ($file in $group.Group) {
        $relative = Get-RelativePath $file.FullName
        $symbol = if ($file.Extension -in @('.js', '.jsx')) { Get-JsSymbol $file.FullName } else { '-' }
        $purpose = Get-FrontendPurpose $relative $group.Name
        $frontendLines.Add("| ``$relative`` | ``$(Escape-Markdown $symbol)`` | $(Escape-Markdown $purpose) |")
    }

    $frontendLines.Add('')
}

$frontendLines.Add('## Kandidat Legacy atau Duplikasi')
$frontendLines.Add('')
$frontendLines.Add('Nama yang mirip bukan bukti aman untuk dihapus. Komponen Breeze, root navigation, `Components/Navigation`, `FallEffect.js/.jsx`, dan primitive UI harus ditelusuri import-nya sebelum cleanup.')
$frontendLines.Add('')
$frontendLines.Add('## Catatan Pemeliharaan')
$frontendLines.Add('')
$frontendLines.Add('- Page Inertia mengikuti nama yang dirender controller.')
$frontendLines.Add('- Komponen shared tidak boleh menggandakan aturan domain backend.')
$frontendLines.Add('- File baru wajib masuk katalog dengan menjalankan generator ini.')
[System.IO.File]::WriteAllLines((Join-Path $outputDirectory 'frontend-resource-catalog.md'), $frontendLines, [System.Text.UTF8Encoding]::new($false))

$dataFiles = @(
    Get-ChildItem (Join-Path $ProjectRoot 'database') -Recurse -File
    Get-ChildItem (Join-Path $ProjectRoot 'tests') -Recurse -File
) | Sort-Object FullName
$dataLines = [System.Collections.Generic.List[string]]::new()
$dataLines.Add('# Katalog Database dan Test')
$dataLines.Add('')
$dataLines.Add('> Dibangkitkan oleh `scripts/generate-code-reference.ps1`. Migration, factory, seeder, dan seluruh test tercantum di bawah.')
$dataLines.Add('')
$dataLines.Add(('Total file database dan test: {0}.' -f $dataFiles.Count))
$dataLines.Add('')

foreach ($group in ($dataFiles | Group-Object {
    $relative = Get-RelativePath $_.FullName
    switch -Regex ($relative) {
        '^database/migrations/' { return 'Migration' }
        '^database/seeders/' { return 'Seeder' }
        '^database/factories/' { return 'Factory' }
        '^tests/Feature/' { return 'Feature test' }
        '^tests/Unit/' { return 'Unit test' }
        default { return 'Test bootstrap/config' }
    }
})) {
    $dataLines.Add("## $($group.Name)")
    $dataLines.Add('')
    $dataLines.Add('| File | Symbol utama | Tujuan |')
    $dataLines.Add('|---|---|---|')

    foreach ($file in $group.Group) {
        $relative = Get-RelativePath $file.FullName
        $symbol = if ($file.Extension -eq '.php') { Get-PhpSymbol $file.FullName } else { '-' }
        $name = Convert-PascalToWords $file.Name
        $purpose = switch ($group.Name) {
            'Migration' { "Perubahan skema/data: $name." }
            'Seeder' { "Mengisi data referensi/demo: $name." }
            'Factory' { "Factory data test: $name." }
            'Feature test' { "Regresi HTTP/domain: $name." }
            'Unit test' { "Unit test: $name." }
            default { "Bootstrap atau konfigurasi test: $name." }
        }
        $dataLines.Add("| ``$relative`` | ``$(Escape-Markdown $symbol)`` | $(Escape-Markdown $purpose) |")
    }

    $dataLines.Add('')
}

$dataLines.Add('## Aturan')
$dataLines.Add('')
$dataLines.Add('- Jangan mengubah migration yang sudah dijalankan production tanpa rencana kompatibilitas.')
$dataLines.Add('- Seeder demo tidak otomatis aman untuk production; baca implementasinya sebelum menjalankan.')
$dataLines.Add('- Test yang timed out atau dilewati tidak boleh dilaporkan sebagai lulus.')
[System.IO.File]::WriteAllLines((Join-Path $outputDirectory 'database-and-test-catalog.md'), $dataLines, [System.Text.UTF8Encoding]::new($false))

Write-Output "Generated $($backendFiles.Count) backend entries, $($resourceFiles.Count) resource entries, and $($dataFiles.Count) database/test entries."
