document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  const joinSection = document.getElementById('join-section');
  const nameInput = document.getElementById('nameInput');
  const codeInput = document.getElementById('codeInput');
  const joinBtn = document.getElementById('joinBtn');

  const quizArea = document.getElementById('quiz-area');
  const questionNumberSpan = document.getElementById('questionNumber');
  const textArea = document.getElementById('textArea');
  const statusMessage = document.getElementById('statusMessage');

  let currentQuestion = 0;

  // On load => if we have role=student in session => rejoin
  if (
    sessionStorage.getItem('role') === 'student' &&
    sessionStorage.getItem('quizCode') &&
    sessionStorage.getItem('studentName')
  ) {
    socket.emit('student-rejoin', {
      quizCode: sessionStorage.getItem('quizCode'),
      studentName: sessionStorage.getItem('studentName')
    });
  }

  // If user scanned QR => fill code
  const params = new URLSearchParams(window.location.search);
  if (params.has('quizCode')) {
    codeInput.value = params.get('quizCode');
  }

  joinBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const code = codeInput.value.trim().toUpperCase();
    if (!name || !code) {
      alert('Please enter name + quiz code.');
      return;
    }
    socket.emit('student-join', { quizCode: code, studentName: name });
  });

  // If joined => store in sessionStorage
  socket.on('joined-quiz', () => {
    const name = nameInput.value.trim() || sessionStorage.getItem('studentName');
    const code = codeInput.value.trim().toUpperCase() || sessionStorage.getItem('quizCode');

    sessionStorage.setItem('role', 'student');
    sessionStorage.setItem('studentName', name);
    sessionStorage.setItem('quizCode', code);

    joinSection.classList.add('d-none');
    quizArea.classList.remove('d-none');
  });

  // If join-failed
  socket.on('join-failed', (msg) => {
    alert(msg);
  });

  // If question => set currentQuestion => clear text
  socket.on('question', (qNum) => {
    currentQuestion = qNum;
    questionNumberSpan.textContent = qNum;
    textArea.value = '';
    if (currentQuestion >= 1) {
      textArea.disabled = false;
      statusMessage.textContent = '';
    } else {
      textArea.disabled = true;
      statusMessage.textContent = 'Quiz not started yet.';
    }
  });

  // On typing => send partial text
  textArea.addEventListener('input', () => {
    if (currentQuestion >= 1) {
      socket.emit('student-typing', textArea.value);
    }
  });

  // If quiz ended => disable text
  socket.on('quiz-ended', () => {
    textArea.disabled = true;
    statusMessage.textContent = 'Quiz ended.';
  });
});
