export const QUESTION_TYPES = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'fill_blank', label: 'Fill in Blank' },
    { value: 'listening', label: 'Listening' },
];

export const TYPE_LABELS = { multiple_choice: 'MC', fill_blank: 'FILL', listening: 'LISTEN' };

export const TYPE_COLORS = {
    multiple_choice: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    fill_blank: 'text-purple-600 bg-purple-50',
    listening: 'text-green-600 bg-green-50 dark:bg-green-900/20',
};

export const normalizeQuestionType = (type) => {
    if (type === 'fill_blank' || type === 'typing') return 'fill_blank';
    if (type === 'listening') return 'listening';
    return 'multiple_choice';
};

export const emptyQuestion = (type = 'multiple_choice') => {
    const normalizedType = normalizeQuestionType(type);

    return {
        id: null,
        type: normalizedType,
        question_text: '',
        correct_answer: '',
        options: normalizedType === 'multiple_choice' ? ['', '', '', ''] : [],
        explanation: '',
        audio_url: '',
        order: 0,
    };
};

export const normalizeQuestions = (questions, quizType = 'multiple_choice') => (
    questions.length > 0
        ? questions.map((question) => ({
            ...question,
            type: normalizeQuestionType(question.type || quizType),
            options: Array.isArray(question.options) ? question.options : [],
        }))
        : [emptyQuestion(normalizeQuestionType(quizType))]
);

export const normalizeText = (value) => String(value || '').trim();

export const getQuestionError = (question, index) => {
    const number = index + 1;
    const type = question.type || 'multiple_choice';
    const questionText = normalizeText(question.question_text);
    const correctAnswer = normalizeText(question.correct_answer);
    const options = Array.isArray(question.options) ? question.options.map(normalizeText).filter(Boolean) : [];

    if (!questionText) return `Q${number}: pertanyaan wajib diisi.`;
    if (!correctAnswer) return `Q${number}: jawaban benar wajib diisi.`;
    if (type === 'multiple_choice' && options.length < 2) return `Q${number}: multiple choice minimal 2 opsi.`;
    if (type === 'multiple_choice' && !options.includes(correctAnswer)) return `Q${number}: jawaban benar harus sama dengan salah satu opsi.`;
    if (type === 'listening' && !normalizeText(question.audio_url)) return `Q${number}: listening wajib memiliki Audio URL.`;

    return null;
};
