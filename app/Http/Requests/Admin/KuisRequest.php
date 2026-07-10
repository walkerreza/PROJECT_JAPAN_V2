<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class KuisRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; 
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'module_id'  => 'required|exists:modules,id',
            'type'       => 'required|in:multiple_choice,typing,listening',
            'time_limit' => 'nullable|integer|min:0',
            'passing_score' => 'nullable|integer|min:1|max:100',
            'status'     => 'nullable|in:draft,published',
        ];
    }

    /**
     * Pesan error custom Bahasa Indonesia.
     */
    public function messages(): array
    {
        return [
            'module_id.required' => 'Modul mingguan wajib dipilih.',
            'module_id.exists'   => 'Modul mingguan yang dipilih tidak valid di sistem.',
            'type.required'      => 'Tipe kuis wajib ditentukan.',
            'type.in'            => 'Tipe kuis hanya boleh: Pilihan Ganda, Mengetik, atau Mendengarkan.',
            'time_limit.integer' => 'Batas waktu harus berupa angka bulat (dalam satuan detik).',
            'time_limit.min'     => 'Batas waktu minimal adalah 0 (tanpa batas).',
            'passing_score.integer' => 'Nilai lulus harus berupa angka.',
            'passing_score.min' => 'Nilai lulus minimal 1.',
            'passing_score.max' => 'Nilai lulus maksimal 100.',
        ];
    }
}
