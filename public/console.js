document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // DOM
  const quizCodeSpan = document.getElementById('quizCode');
  const qrCodeDiv = document.getElementById('qrCode');
  const joinLink = document.getElementById('joinLink');
  const questionNumberSpan = document.getElementById('questionNumber');
  const questionBtn = document.getElementById('questionBtn');
  const endBtn = document.getElementById('endBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const studentArea = document.getElementById('studentArea');

  // We'll store typed text locally if we want CSV. localAnswers => { q1: { "Alice": "text" }, ...}
  let localAnswers = {};
  sessionStorage.removeItem('localAnswers'); // clear old

  let currentQuestion = 0;
  let quizCode = '';

  // On load => check if we have a quiz code in session => rejoin
  if (
    sessionStorage.getItem('role') === 'teacher' &&
    sessionStorage.getItem('quizCode')
  ) {
    const oldCode = sessionStorage.getItem('quizCode');
    socket.emit('teacher-rejoin', oldCode);
  } else {
    // else => create new
    socket.emit('teacher-join');
  }

  // If server says "no-active-quiz," we just do a new quiz
  socket.on('no-active-quiz', () => {
    console.log('No active quiz found, creating new...');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('quizCode');
    socket.emit('teacher-join');
  });

  // On receiving quiz code
  socket.on('quiz-code', (code) => {
    quizCode = code;
    quizCodeSpan.textContent = code;
    sessionStorage.setItem('role', 'teacher');
    sessionStorage.setItem('quizCode', code);

    const link = `${window.location.origin}?quizCode=${code}`;
    joinLink.href = link;
    joinLink.textContent = link;
    new QRCode(qrCodeDiv, { text: link, width:128, height:128 });
  });

  // If we "teacher-rejoined" => server gives current question
  socket.on('teacher-rejoined', (data) => {
    currentQuestion = data.currentQuestion || 0;
    questionNumberSpan.textContent = currentQuestion;
    if (currentQuestion >= 1) {
      questionBtn.textContent = 'Next Question';
    }
    console.log(`Teacher rejoined at question #${currentQuestion}`);
  });

  // "Start / Next" question
  questionBtn.addEventListener('click', () => {
    // If question=0 => set question=1 => "Next Question"
    if (currentQuestion >= 1) {
      // Store old question => clear text => question++
      storeOldQuestionData(currentQuestion);
      clearAllTexts();
      currentQuestion++;
      questionNumberSpan.textContent = currentQuestion;
      socket.emit('new-question', currentQuestion);
    } else {
      // from 0 => 1
      currentQuestion = 1;
      questionNumberSpan.textContent = currentQuestion;
      socket.emit('new-question', currentQuestion);
      questionBtn.textContent = 'Next Question';
    }
  });

  // End quiz => confirm
  endBtn.addEventListener('click', () => {
    const sure = confirm('Are you sure you want to end this quiz?');
    if (!sure) return;

    // store last question data
    if (currentQuestion >= 1) {
      storeOldQuestionData(currentQuestion);
    }
    socket.emit('end-quiz');
    endBtn.disabled = true;
    questionBtn.disabled = true;
  });

  // quiz-ended => show CSV
  socket.on('quiz-ended', () => {
    alert('Quiz ended. You can now download CSV.');
    downloadBtn.classList.remove('d-none');
  });

  downloadBtn.addEventListener('click', () => {
    const csv = buildCSV(localAnswers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_${quizCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Student list => create text blocks for each
  socket.on('student-list', (names) => {
    // names = [ 'Alice', 'Bob' ... ]
    names.forEach((nm) => {
      if (!document.getElementById(`text-${nm}`)) {
        addStudentBlock(nm);
      }
    });
  });

  // Student typing => update text
  socket.on('student-typing-update', ({ studentName, partialText }) => {
    const el = document.getElementById(`text-${studentName}`);
    if (el) {
      el.textContent = partialText || '';
    }
  });

  // ---------- Helpers ----------

  function addStudentBlock(name) {
    const container = document.createElement('div');
    container.classList.add('mb-3');

    const title = document.createElement('h5');
    title.textContent = name;

    const textDiv = document.createElement('div');
    textDiv.id = `text-${name}`;
    textDiv.classList.add('live-text');

    container.appendChild(title);
    container.appendChild(textDiv);

    studentArea.appendChild(container);
  }

  function clearAllTexts() {
    // set all .live-text => ''
    document.querySelectorAll('.live-text').forEach(el => el.textContent = '');
  }

  function storeOldQuestionData(qNo) {
    // localAnswers.q1 = { 'Alice': 'some text' }
    if (!localAnswers[`q${qNo}`]) {
      localAnswers[`q${qNo}`] = {};
    }
    document.querySelectorAll('.live-text').forEach(el => {
      const nm = el.id.replace('text-', '');
      const txt = el.textContent.trim();
      localAnswers[`q${qNo}`][nm] = txt || 'NA';
    });
    sessionStorage.setItem('localAnswers', JSON.stringify(localAnswers));
  }

  function buildCSV(obj) {
    const lines = [];
    lines.push('QuestionNumber,StudentName,Text');
    for (const qKey of Object.keys(obj)) {
      const qNum = qKey.replace('q','');
      for (const studentName of Object.keys(obj[qKey])) {
        let text = obj[qKey][studentName];
        text = text.replace(/"/g, '""');
        lines.push(`${qNum},${studentName},"${text}"`);
      }
    }
    return lines.join('\n');
  }
});
