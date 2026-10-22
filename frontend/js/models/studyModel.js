const StudyModel = {
  exam: null,
  questionIndex: 0,
  score: 0,
  selectedOption: null,

  load(documentId) {
    this.exam = null;
    this.questionIndex = 0;
    this.score = 0;
    this.selectedOption = null;

    const savedExam = localStorage.getItem(`tecnobot_exam_${documentId}`);
    if (!savedExam) return null;

    try {
      this.exam = JSON.parse(savedExam);
      return this.exam;
    } catch (error) {
      localStorage.removeItem(`tecnobot_exam_${documentId}`);
      return null;
    }
  },

  save(documentId, exam) {
    this.exam = exam;
    localStorage.setItem(`tecnobot_exam_${documentId}`, JSON.stringify(exam));
  },

  resetQuestion() {
    this.selectedOption = null;
  },

  answer(optionIndex, correctIndex) {
    if (this.selectedOption !== null) return false;
    this.selectedOption = optionIndex;
    if (optionIndex === correctIndex) this.score++;
    return optionIndex === correctIndex;
  },

  nextQuestion() {
    this.questionIndex++;
    this.resetQuestion();
  },

  restart() {
    this.questionIndex = 0;
    this.score = 0;
    this.resetQuestion();
  },

  clear(documentId) {
    this.exam = null;
    localStorage.removeItem(`tecnobot_exam_${documentId}`);
  }
};
