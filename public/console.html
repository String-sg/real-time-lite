const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const short = require('short-uuid');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public'));

// Student page => "/"
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Teacher console => "/console"
app.get('/console', (req, res) => {
  res.sendFile(__dirname + '/public/console.html');
});

// We store exactly one quiz in memory for simplicity
let quiz = {
  code: null,
  teacherSocket: null,
  active: false,
  currentQuestion: 0,  // 0 means "quiz not started yet"
  students: {}
  // students[socketId] = { name: "...", typedText: "...(for current question)..." }
};

function genCode() {
  return short.generate().substring(0,6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // ---------- TEACHER EVENTS ----------

  // 1) Teacher creates brand new quiz
  socket.on('teacher-join', () => {
    quiz.code = genCode();
    quiz.teacherSocket = socket.id;
    quiz.active = true;
    quiz.currentQuestion = 0;
    quiz.students = {};
    socket.join(quiz.code);

    // Return quiz code to teacher
    socket.emit('quiz-code', quiz.code);
    console.log(`Teacher joined => code=${quiz.code}`);
  });

  // 2) Teacher tries to rejoin an existing quiz
  socket.on('teacher-rejoin', (rejoinCode) => {
    // If we have an active quiz with that code, re-bind
    if (quiz.active && quiz.code === rejoinCode) {
      quiz.teacherSocket = socket.id;    // re-bind teacher
      socket.join(quiz.code);

      // Send code & current question
      socket.emit('quiz-code', quiz.code);
      socket.emit('teacher-rejoined', { currentQuestion: quiz.currentQuestion });

      // Also send the current student list (names)
      const names = Object.values(quiz.students).map(st => st.name);
      socket.emit('student-list', names);
      console.log(`Teacher rejoined => code=${quiz.code}`);
    } else {
      // Otherwise, no active quiz => teacher must create a new one
      socket.emit('no-active-quiz');
    }
  });

  // 3) Teacher sets new question
  socket.on('new-question', (qNum) => {
    quiz.currentQuestion = qNum;
    // Broadcast to all => "question"
    io.to(quiz.code).emit('question', qNum);
    console.log(`Teacher => question #${qNum}`);
  });

  // 4) Teacher ends quiz
  socket.on('end-quiz', () => {
    if (socket.id === quiz.teacherSocket && quiz.active) {
      quiz.active = false;
      io.to(quiz.code).emit('quiz-ended');
      console.log('Quiz ended by teacher');
    }
  });

  // ---------- STUDENT EVENTS ----------

  // a) Student join from scratch
  socket.on('student-join', ({ quizCode, studentName }) => {
    if (!quiz.active || quizCode !== quiz.code) {
      socket.emit('join-failed', 'Invalid code or quiz not active.');
      return;
    }
    quiz.students[socket.id] = { name: studentName, typedText: '' };
    socket.join(quizCode);

    // Let them know they joined
    socket.emit('joined-quiz');
    // Immediately tell them the current question
    socket.emit('question', quiz.currentQuestion);

    // Update teacher’s student list
    updateTeacherStudentList();
    console.log(`Student "${studentName}" joined => code=${quizCode}`);
  });

  // b) Student rejoin (page refresh)
  socket.on('student-rejoin', ({ quizCode, studentName }) => {
    // If quiz is active & code matches => re-add them
    if (quiz.active && quiz.code === quizCode) {
      quiz.students[socket.id] = { name: studentName, typedText: '' };
      socket.join(quizCode);

      // joined
      socket.emit('joined-quiz');
      // also send them the current question
      socket.emit('question', quiz.currentQuestion);

      updateTeacherStudentList();
      console.log(`Student rejoined => code=${quizCode}, name=${studentName}`);
    } else {
      socket.emit('join-failed', 'Invalid code or quiz not active.');
    }
  });

  // c) Student typing partial text
  socket.on('student-typing', (partialText) => {
    if (!quiz.active) return;
    const st = quiz.students[socket.id];
    if (!st) return;
    // store it
    st.typedText = partialText;

    // Send teacher an update with the student's name
    io.to(quiz.teacherSocket).emit('student-typing-update', {
      studentName: st.name,
      partialText
    });
  });

  // ---------- DISCONNECT ----------

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    // If teacher => end quiz
    if (quiz.teacherSocket === socket.id && quiz.active) {
      quiz.active = false;
      io.to(quiz.code).emit('quiz-ended');
      console.log('Teacher left => quiz ended');
    }
    // If student => remove
    if (quiz.students[socket.id]) {
      delete quiz.students[socket.id];
      updateTeacherStudentList();
    }
  });
});

// Update teacher with all student names
function updateTeacherStudentList() {
  if (!quiz.teacherSocket) return;
  const names = Object.values(quiz.students).map(st => st.name);
  io.to(quiz.teacherSocket).emit('student-list', names);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
