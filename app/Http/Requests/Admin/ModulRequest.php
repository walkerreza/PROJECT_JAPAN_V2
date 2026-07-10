<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ModulRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Biasanya authorisasi role dihandle oleh middleware role:admin di Route.
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'program_pembelajaran_id' => 'required|exists:program_pembelajaran,id',
            'level_id'    => 'required|exists:levels,id',
            'title'       => 'required|string|max:255',
            'week_number' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:draft,published',
        ];
    }

    /**
     * Dapatkan pesan validasi kustom (Bahasa Indonesia).
     */
    public function messages(): array
    {
        return [
            'program_pembelajaran_id.required' => 'Program pembelajaran wajib dipilih.',
            'program_pembelajaran_id.exists' => 'Program pembelajaran tidak valid atau tidak ditemukan.',
            'level_id.required'    => 'LevelPembelajaran wajib dipilih.',
            'level_id.exists'      => 'LevelPembelajaran tidak valid atau tidak ditemukan di sistem.',
            'title.required'       => 'Judul modul tidak boleh kosong.',
            'title.max'            => 'Judul modul maksimal 255 karakter.',
            'week_number.required' => 'Nomor urut minggu wajib diisi.',
            'week_number.integer'  => 'Nomor urut minggu harus berupa angka bulat.',
            'week_number.min'      => 'Nomor urut minggu minimal harus 1.',
        ];
    }
}
