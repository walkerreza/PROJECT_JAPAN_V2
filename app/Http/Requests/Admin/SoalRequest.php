<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Kuis;

class SoalRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $rules = [
            'quiz_id'        => 'required|exists:quizzes,id',
            'question_text'  => 'required|string',
            'correct_answer' => 'required|string',
            'explanation'    => 'nullable|string',
            'order'          => 'required|integer|min:0',
        ];

        if ($this->has('quiz_id')) {
            $quiz = Kuis::find($this->input('quiz_id'));
            if ($quiz) {
                if ($quiz->type === 'multiple_choice') {
                    $rules['options'] = 'required|array|min:2';
                    if ($this->isMethod('post')) {
                        $rules['options.*'] = 'required|string';
                    }
                }
                if ($quiz->type === 'listening') {
                    $rules['audio_url'] = 'nullable|string|url';
                }
            }
        }

        return $rules;
    }

    public function messages()
    {
        return [
            'quiz_id.required'        => 'Kuis wajib dipilih',
            'quiz_id.exists'          => 'Kuis tidak ditemukan',
            'question_text.required'  => 'Teks pertanyaan wajib diisi',
            'correct_answer.required' => 'Jawaban benar wajib diisi',
            'options.required'        => 'Pilihan jawaban wajib diisi untuk soal pilihan ganda',
            'options.min'             => 'Minimal 2 pilihan jawaban diperlukan',
        ];
    }
}
