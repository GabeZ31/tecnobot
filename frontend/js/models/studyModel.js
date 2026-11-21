const StudyModel = {
  exam: null,
  questionIndex: 0,
  score: 0,
  selectedOption: null,
  flashcards: null,
  flashcardIndex: 0,
  flashcardFlipped: false,

  load(documentId) {
    this.exam = null;
    this.questionIndex = 0;
    this.score = 0;
    this.selectedOption = null;
    this.flashcards = null;
    this.flashcardIndex = 0;
    this.flashcardFlipped = false;

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
    localStorage.removeItem(`tecnobot_flashcards_${documentId}`);
  },

  loadFlashcards(documentId) {
    this.flashcardIndex = 0;
    this.flashcardFlipped = false;
    const savedCards = localStorage.getItem(`tecnobot_flashcards_${documentId}`);
    if (!savedCards) return null;
    try {
      const parsedCards = JSON.parse(savedCards);
      this.flashcards = parsedCards.tarjetas || [];
      return this.flashcards;
    } catch (error) {
      localStorage.removeItem(`tecnobot_flashcards_${documentId}`);
      return null;
    }
  },

  saveFlashcards(documentId, cards) {
    this.flashcards = cards.tarjetas || [];
    this.flashcardIndex = 0;
    this.flashcardFlipped = false;
    localStorage.setItem(`tecnobot_flashcards_${documentId}`, JSON.stringify(cards));
  },

  nextFlashcard() {
    if (!this.flashcards?.length) return;
    this.flashcardIndex = (this.flashcardIndex + 1) % this.flashcards.length;
    this.flashcardFlipped = false;
  },

  previousFlashcard() {
    if (!this.flashcards?.length) return;
    this.flashcardIndex = (this.flashcardIndex - 1 + this.flashcards.length) % this.flashcards.length;
    this.flashcardFlipped = false;
  },

  flipFlashcard() {
    this.flashcardFlipped = !this.flashcardFlipped;
  }
};
