<?php

namespace App\Services;

use ZipArchive;

class ImportSpreadsheetService
{
    public function rows(string $path, string $extension): array
    {
        return strtolower($extension) === 'xlsx'
            ? $this->parseXlsxRows($path)
            : $this->parseCsvRows($path);
    }

    public function parseCsvRows(string $path): array
    {
        $handle = fopen($path, 'r');

        if (! $handle) {
            return [];
        }

        $header = fgetcsv($handle);

        if (! $header) {
            fclose($handle);
            return [];
        }

        $headers = $this->normalizeHeaders($header);
        $rows = [];

        while (($row = fgetcsv($handle)) !== false) {
            if (count(array_filter($row, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $rows[] = array_combine($headers, array_slice(array_pad($row, count($headers), null), 0, count($headers)));
        }

        fclose($handle);

        return $rows;
    }

    public function parseXlsxRows(string $path): array
    {
        if (! class_exists(ZipArchive::class)) {
            return [];
        }

        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            return [];
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if (! $sheetXml) {
            return [];
        }

        $sheet = simplexml_load_string($sheetXml);

        if ($sheet === false || ! isset($sheet->sheetData->row)) {
            return [];
        }

        $rawRows = [];

        foreach ($sheet->sheetData->row as $row) {
            $values = [];

            foreach ($row->c as $cell) {
                $cellRef = (string) $cell['r'];
                $column = preg_replace('/\d+/', '', $cellRef);
                $index = $this->columnIndex($column);
                $type = (string) $cell['t'];
                $value = (string) ($cell->v ?? '');

                if ($type === 's') {
                    $value = $sharedStrings[(int) $value] ?? '';
                } elseif ($type === 'inlineStr') {
                    $value = (string) ($cell->is->t ?? '');
                }

                $values[$index] = $value;
            }

            ksort($values);
            $maxIndex = empty($values) ? -1 : max(array_keys($values));
            $rawRows[] = $maxIndex >= 0
                ? array_map(fn ($index) => $values[$index] ?? '', range(0, $maxIndex))
                : [];
        }

        $header = array_shift($rawRows);

        if (! $header) {
            return [];
        }

        $headers = $this->normalizeHeaders($header);
        $rows = [];

        foreach ($rawRows as $row) {
            if (count(array_filter($row, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $rows[] = array_combine($headers, array_slice(array_pad($row, count($headers), null), 0, count($headers)));
        }

        return $rows;
    }

    public function normalizeHeaders(array $header): array
    {
        return array_map(function ($value) {
            $normalized = str($value)->lower()->replace(' ', '_')->toString();

            return ltrim($normalized, "\xEF\xBB\xBF");
        }, $header);
    }

    private function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');

        if (! $xml) {
            return [];
        }

        $shared = simplexml_load_string($xml);

        if ($shared === false || ! isset($shared->si)) {
            return [];
        }

        $strings = [];

        foreach ($shared->si as $item) {
            if (isset($item->t)) {
                $strings[] = (string) $item->t;
                continue;
            }

            $parts = [];
            foreach ($item->r as $run) {
                $parts[] = (string) $run->t;
            }
            $strings[] = implode('', $parts);
        }

        return $strings;
    }

    private function columnIndex(string $column): int
    {
        $index = 0;
        foreach (str_split($column) as $char) {
            $index = ($index * 26) + (ord(strtoupper($char)) - 64);
        }

        return max(0, $index - 1);
    }
}
