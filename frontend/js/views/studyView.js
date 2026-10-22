const StudyView = {
  container: document.getElementById('study-messages'),

  show() {
    this.container.classList.remove('hidden');
  },

  hide() {
    this.container.classList.add('hidden');
  },

  showIntro(fileName, onStart) {
    this.container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-intro-card">
          <div class="score-circle">🎓</div>
          <h2 class="quiz-title">Apartado de Estudio</h2>
          <p class="quiz-subtitle">Genera un cuestionario de opción múltiple interactivo de 10 preguntas basado en <strong>${fileName}</strong> para evaluar tus conocimientos de forma activa.</p>
          <button id="start-quiz-generation" class="btn-start-quiz">Generar Examen con IA</button>
        </div>
      </div>`;
    document.getElementById('start-quiz-generation').addEventListener('click', onStart);
  },

  showLoading() {
    this.container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-intro-card">
          <div class="typing-dots" style="justify-content:center;margin-bottom:20px"><span></span><span></span><span></span></div>
          <h2 class="quiz-title">Analizando el PDF</h2>
          <p class="quiz-subtitle">Bedrock está formulando preguntas con respuestas y explicaciones estructuradas. Esto tardará unos segundos...</p>
        </div>
      </div>`;
  },

  showGenerationError(onRetry) {
    this.container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-intro-card">
          <div class="score-circle" style="background-color:#fee2e2;color:var(--error)">⚠️</div>
          <h2 class="quiz-title">Error al generar examen</h2>
          <p class="quiz-subtitle">No pudimos procesar las preguntas. Asegúrate de que el documento tenga suficiente texto y vuelve a intentarlo.</p>
          <button id="retry-quiz-generation" class="btn-start-quiz" style="background-color:var(--error)">Reintentar generación</button>
        </div>
      </div>`;
    document.getElementById('retry-quiz-generation').addEventListener('click', onRetry);
  },

  showQuestion(question, index, total, onAnswer, onNext) {
    this.container.innerHTML = `
      <div class="quiz-container"><div class="quiz-card">
        <div class="quiz-header"><span class="quiz-topic">${question.tema || 'Evaluación'}</span><span class="quiz-progress">Pregunta ${index + 1} de ${total}</span></div>
        <h3 class="quiz-question">${question.pregunta}</h3>
        <div class="quiz-options">${question.opciones.map((option, optionIndex) => `
          <button class="option-btn" data-index="${optionIndex}">
            <span class="option-badge">${String.fromCharCode(65 + optionIndex)}</span>
            <span class="option-text">${option}</span>
          </button>`).join('')}</div>
        <div id="explanation-container"></div>
        <div class="quiz-footer"><button id="next-question-btn" class="btn-next-question hidden">${index + 1 === total ? 'Ver Resultados' : 'Siguiente'}</button></div>
      </div></div>`;

    this.container.querySelectorAll('.option-btn').forEach(button => {
      button.addEventListener('click', () => onAnswer(Number(button.dataset.index), question));
    });
    document.getElementById('next-question-btn').addEventListener('click', onNext);
  },

  showAnswer(correctIndex, selectedIndex, explanation, isCorrect) {
    this.container.querySelectorAll('.option-btn').forEach((button, index) => {
      button.disabled = true;
      if (index === correctIndex) button.classList.add('correct');
      else if (index === selectedIndex) button.classList.add('incorrect');
    });
    document.getElementById('explanation-container').innerHTML = `
      <div class="explanation-box ${isCorrect ? 'success' : 'error'}">
        <div class="explanation-title">${isCorrect ? '¡Correcto!' : 'Incorrecto'}</div>
        <div class="explanation-text">${explanation}</div>
      </div>`;
    document.getElementById('next-question-btn').classList.remove('hidden');
  },

  showScore(score, total, onRestart, onNewExam) {
    const percent = Math.round((score / total) * 100);
    const result = percent >= 90
      ? ['¡Excelente!', '¡Espectacular! Tienes un dominio sobresaliente de los conceptos de este documento.', '🏆']
      : percent >= 70
        ? ['¡Buen trabajo!', 'Tienes bases sólidas pero puedes volver a repasar los puntos en los que te equivocaste.', '🌟']
        : ['Sigue practicando', 'Te sugerimos repasar el documento y volver a realizar la prueba para reforzar conceptos.', '📚'];

    this.container.innerHTML = `
      <div class="quiz-container"><div class="quiz-score-screen">
        <div class="score-circle">${result[2]}</div>
        <h2 class="quiz-title">Resultado de la Prueba</h2>
        <p class="quiz-subtitle" style="font-size:16px;font-weight:600;color:var(--accent);margin-bottom:8px">Aciertos: ${score} de ${total} (${percent}%)</p>
        <p class="quiz-subtitle" style="font-weight:600;margin-bottom:4px">${result[0]}</p>
        <p class="quiz-subtitle">${result[1]}</p>
        <div style="margin-top:24px;display:flex;gap:12px;justify-content:center">
          <button id="restart-quiz-btn" class="btn-restart-quiz">Reintentar Examen</button>
          <button id="new-exam-btn" class="btn-outline-sm" style="padding:12px 24px;border-radius:10px;font-weight:600">Generar otro examen</button>
        </div>
      </div></div>`;
    document.getElementById('restart-quiz-btn').addEventListener('click', onRestart);
    document.getElementById('new-exam-btn').addEventListener('click', onNewExam);
  }
};
