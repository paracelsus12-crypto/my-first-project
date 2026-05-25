// app.js - Главная логика учебного портала PyLearn

// Глобальное состояние приложения
const state = {
  xp: 0,
  level: 1,
  streak: 1,
  completedLessons: [], // список id пройденных уроков
  completedModules: [], // список id пройденных модулей (все уроки пройдены)
  activeModuleIdx: 0,
  activeLessonIdx: 0,
  lessonCodes: {}, // сохраненный код для каждого урока { lessonId: code }
  currentScreen: "dashboard",
  
  // Экземпляры CodeMirror
  lessonEditor: null,
  playgroundEditor: null
};

// Загрузка состояния из LocalStorage
function loadState() {
  const saved = localStorage.getItem("pylearn_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.xp = parsed.xp || 0;
      state.level = Math.floor(state.xp / 100) + 1;
      state.streak = parsed.streak || 1;
      state.completedLessons = parsed.completedLessons || [];
      state.completedModules = parsed.completedModules || [];
      state.lessonCodes = parsed.lessonCodes || {};
    } catch (e) {
      console.error("Ошибка загрузки состояния из LocalStorage:", e);
    }
  }
}

// Сохранение состояния в LocalStorage
function saveState() {
  const dataToSave = {
    xp: state.xp,
    streak: state.streak,
    completedLessons: state.completedLessons,
    completedModules: state.completedModules,
    lessonCodes: state.lessonCodes
  };
  localStorage.setItem("pylearn_state", JSON.stringify(dataToSave));
}

// Вспомогательная функция для отображения тостов (всплывающих уведомлений)
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let iconSVG = '';
  if (type === "success") {
    iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === "xp") {
    iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polygon points="12 2 2 22 12 17 22 22 12 2"/></svg>`;
  } else {
    iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSVG}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  // Плавное удаление тоста через 3.5 секунды
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s reverse forwards";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Добавление XP с проверкой на повышение уровня
function addXP(amount) {
  const prevLevel = state.level;
  state.xp += amount;
  state.level = Math.floor(state.xp / 100) + 1;
  
  saveState();
  updateUI();
  
  showToast(`+${amount} XP Получено! 🎯`, "xp");
  
  if (state.level > prevLevel) {
    setTimeout(() => {
      showToast(`🎉 Поздравляем! Вы достигли уровня ${state.level}!`, "success");
      // Проигрываем приятный звук или эффект если нужно
    }, 1000);
  }
}

// Инициализация интерфейса и обработчиков событий
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initRouting();
  initPlayground();
  initCheatSheet();
  updateUI();

  // Следим за готовностью Pyodide
  PythonRunner.onReady(() => {
    console.log("Интерпретатор готов, активируем кнопки запуска кода");
    document.getElementById("console-status-text").innerText = "Готов к запуску";
    document.getElementById("console-status-dot").classList.add("active");
  });
});

// Навигация (SPA роутинг)
function initRouting() {
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      if (target === "lesson") {
        loadLesson(state.activeModuleIdx, state.activeLessonIdx);
      } else {
        switchScreen(target);
      }
    });
  });

  // Кнопка "Назад к дашборду" из экрана урока
  document.getElementById("btn-back-to-dashboard").addEventListener("click", () => {
    switchScreen("dashboard");
  });
}

function switchScreen(screenId) {
  // Скрываем все экраны
  const screens = document.querySelectorAll(".screen");
  screens.forEach(s => {
    s.classList.remove("active");
  });

  // Показываем нужный экран
  const targetScreen = document.getElementById(`${screenId}-screen`);
  if (targetScreen) {
    targetScreen.classList.add("active");
  }

  // Обновляем активный пункт в сайдбаре
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    if (link.getAttribute("data-target") === screenId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  state.currentScreen = screenId;

  // Инициализируем или обновляем редакторы CodeMirror при показе экрана
  if (screenId === "lesson") {
    initLessonEditor();
  } else if (screenId === "playground") {
    initPlaygroundEditor();
  }
}

// Инициализация редактора на экране урока
function initLessonEditor() {
  if (!state.lessonEditor) {
    state.lessonEditor = CodeMirror.fromTextArea(document.getElementById("lesson-editor"), {
      mode: "python",
      theme: "dracula",
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      lineWrapping: true, // Перенос строк включен, после него стоит запятая
      extraKeys: {
        "Ctrl-Enter": () => runActiveLessonCode()
      }
    });

    // При изменении кода сохраняем в state
    state.lessonEditor.on("change", (editor) => {
      const activeLesson = pythonLessonsData[state.activeModuleIdx].lessons[state.activeLessonIdx];
      state.lessonCodes[activeLesson.id] = editor.getValue();
      saveState();
    });
  }
  
  // Обновляем размер CodeMirror
  setTimeout(() => state.lessonEditor.refresh(), 100);
}

// Инициализация редактора в Песочнице
function initPlaygroundEditor() {
  if (!state.playgroundEditor) {
    state.playgroundEditor = CodeMirror.fromTextArea(document.getElementById("playground-editor"), {
      mode: "python",
      theme: "dracula",
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      lineWrapping: true, // Перенос строк включен, после него стоит запятая
      extraKeys: {
        "Ctrl-Enter": () => runPlaygroundCode()
      }
    });
  }
  
  // Обновляем размер CodeMirror для Песочницы при запуске
  setTimeout(() => {
    if (state.playgroundEditor) state.playgroundEditor.refresh();
  }, 100);
}
  
  // Обновляем размер
  setTimeout(() => state.playgroundEditor.refresh(), 100);
}

// Обновление глобального UI (прогресс-бары, текст уровня и XP)
function updateUI() {
  // Имя и роль
  const roles = ["Новичок", "Стажер Python", "Junior Разработчик", "Python Мастер", "Магистр Кода"];
  const roleIdx = Math.min(Math.floor(state.level / 2), roles.length - 1);
  
  document.getElementById("profile-name").innerText = "Кодер Python";
  document.getElementById("profile-avatar").innerText = "K";
  document.getElementById("profile-level-name").innerText = roles[roleIdx];
  
  // Очки на дашборде
  document.getElementById("display-username").innerText = "Кодер Python";
  document.getElementById("stat-xp").innerText = `${state.xp} XP`;
  document.getElementById("stat-streak").innerText = `${state.streak} ${getNoun(state.streak, 'день', 'дня', 'дней')}`;
  
  // Подсчет пройденных уроков
  let totalLessonsCount = 0;
  pythonLessonsData.forEach(m => totalLessonsCount += m.lessons.length);
  document.getElementById("stat-lessons").innerText = `${state.completedLessons.length} / ${totalLessonsCount}`;

  // Уровень и XP Прогресс-бар
  document.getElementById("profile-level").innerText = state.level;
  
  const xpInCurrentLevel = state.xp % 100;
  const xpNeeded = 100;
  
  document.getElementById("xp-numbers").innerText = `${xpInCurrentLevel} / ${xpNeeded} XP`;
  document.getElementById("xp-bar-fill").style.width = `${(xpInCurrentLevel / xpNeeded) * 100}%`;

  // Перерендерить модули на дашборде
  renderDashboardModules();
}

// Склонение существительных
function getNoun(number, one, two, five) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) {
    return five;
  }
  n %= 10;
  if (n === 1) {
    return one;
  }
  if (n >= 2 && n <= 4) {
    return two;
  }
  return five;
}

// Отрисовка списка модулей на дашборде
function renderDashboardModules() {
  const container = document.getElementById("modules-container");
  if (!container) return;
  
  container.innerHTML = "";
  
  pythonLessonsData.forEach((mod, modIdx) => {
    // Подсчитываем сколько уроков модуля пройдено
    const moduleLessonsCount = mod.lessons.length;
    const completedModuleLessons = mod.lessons.filter(l => state.completedLessons.includes(l.id)).length;
    const progressPercent = Math.round((completedModuleLessons / moduleLessonsCount) * 100);
    
    // Проверяем, завершен ли весь модуль
    const isModuleCompleted = completedModuleLessons === moduleLessonsCount;
    if (isModuleCompleted && !state.completedModules.includes(mod.id)) {
      // Записываем модуль в завершенные
      state.completedModules.push(mod.id);
      saveState();
    }

    const card = document.createElement("div");
    card.className = "module-card";
    
    // Иконка в зависимости от прогресса или индекса
    let iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
    if (isModuleCompleted) {
      iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" width="22" height="22"><polyline points="20 6 9 17 4 12"/></svg>`;
    }
    
    card.innerHTML = `
      <div class="module-left">
        <div class="module-icon-box">${iconSVG}</div>
        <div class="module-details">
          <div class="module-card-title">${mod.title}</div>
          <div class="module-card-summary">${mod.summary}</div>
        </div>
      </div>
      <div class="module-meta">
        <span class="module-xp">+${mod.xpReward} XP бонус</span>
        <div class="module-progress-info">
          <span class="module-progress-text">${completedModuleLessons} из ${moduleLessonsCount} уроков</span>
          <div class="module-progress-bar">
            <div class="module-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
      </div>
    `;
    
    // Клик на карточку модуля запускает первый непройденный урок модуля
    card.addEventListener("click", () => {
      // Ищем первый непройденный урок
      let lessonIdx = 0;
      for (let i = 0; i < mod.lessons.length; i++) {
        if (!state.completedLessons.includes(mod.lessons[i].id)) {
          lessonIdx = i;
          break;
        }
      }
      loadLesson(modIdx, lessonIdx);
    });
    
    container.appendChild(card);
  });
}

// Загрузка конкретного урока
function loadLesson(moduleIdx, lessonIdx) {
  state.activeModuleIdx = moduleIdx;
  state.activeLessonIdx = lessonIdx;

  const module = pythonLessonsData[moduleIdx];
  const lesson = module.lessons[lessonIdx];
  
  // Переключаемся на экран
  switchScreen("lesson");

  // Заполняем текстовые поля
  document.getElementById("lesson-breadcrumbs").innerText = `${module.title} / Урок ${lessonIdx + 1}`;
  document.getElementById("lesson-title").innerText = lesson.title;
  document.getElementById("theory-content").innerHTML = lesson.theory;

  // Очищаем консоль и статус
  const consoleOutput = document.getElementById("console-output");
  consoleOutput.innerHTML = `<span class="console-cursor"></span>`;
  
  const statusDot = document.getElementById("console-status-dot");
  const statusText = document.getElementById("console-status-text");
  
  if (PythonRunner.isReady) {
    statusText.innerText = "Готов к запуску";
    statusDot.className = "status-dot active";
  } else {
    statusText.innerText = "Среда Python загружается...";
    statusDot.className = "status-dot";
  }

  // Загружаем код
  const savedCode = state.lessonCodes[lesson.id];
  const codeToLoad = savedCode !== undefined ? savedCode : lesson.starterCode;
  
  if (state.lessonEditor) {
    state.lessonEditor.setValue(codeToLoad);
    setTimeout(() => state.lessonEditor.refresh(), 100);
  }

  // Настройка кнопок Назад/Далее
  const btnPrev = document.getElementById("btn-prev-lesson");
  const btnNext = document.getElementById("btn-next-lesson");

  // Есть ли предыдущий урок?
  if (lessonIdx > 0 || moduleIdx > 0) {
    btnPrev.disabled = false;
    btnPrev.onclick = () => {
      if (lessonIdx > 0) {
        loadLesson(moduleIdx, lessonIdx - 1);
      } else {
        // переходим к последнему уроку предыдущего модуля
        const prevModuleIdx = moduleIdx - 1;
        const prevModuleLessons = pythonLessonsData[prevModuleIdx].lessons;
        loadLesson(prevModuleIdx, prevModuleLessons.length - 1);
      }
    };
  } else {
    btnPrev.disabled = true;
  }

  // Есть ли следующий урок?
  if (lessonIdx < module.lessons.length - 1 || moduleIdx < pythonLessonsData.length - 1) {
    btnNext.disabled = false;
    btnNext.innerText = "Далее ▶";
    btnNext.onclick = () => {
      if (lessonIdx < module.lessons.length - 1) {
        loadLesson(moduleIdx, lessonIdx + 1);
      } else {
        loadLesson(moduleIdx + 1, 0);
      }
    };
  } else {
    // Последний урок последнего модуля
    btnNext.disabled = false;
    btnNext.innerText = "В панель управления 🎉";
    btnNext.onclick = () => switchScreen("dashboard");
  }

  // Инициализация/Отображение Квиза
  const quizWrapper = document.getElementById("lesson-quiz");
  
  // Показываем квиз только если урок решен (или если пользователь уже проходил этот урок раньше)
  const isLessonPassed = state.completedLessons.includes(lesson.id);
  
  if (lesson.quiz) {
    quizWrapper.style.display = "flex";
    if (isLessonPassed) {
      quizWrapper.classList.add("active");
      renderQuiz(lesson.quiz, true); // Рендерим в разблокированном состоянии
    } else {
      quizWrapper.classList.remove("active");
      renderQuiz(lesson.quiz, false); // Скрываем или блокируем (покажем после запуска кода)
    }
  } else {
    quizWrapper.style.display = "none";
  }
}

// Запуск кода на экране Урока
async function runActiveLessonCode() {
  if (!PythonRunner.isReady) {
    showToast("Пожалуйста, подождите загрузки Python...", "error");
    return;
  }

  const runBtn = document.getElementById("btn-run-code");
  runBtn.disabled = true;
  runBtn.innerHTML = `<span class="spinner" style="margin-right: 8px;"></span>Выполняется...`;

  const statusDot = document.getElementById("console-status-dot");
  const statusText = document.getElementById("console-status-text");
  
  statusText.innerText = "Выполняется скрипт...";
  statusDot.className = "status-dot active";
  
  const consoleOutput = document.getElementById("console-output");
  consoleOutput.innerHTML = ""; // Очищаем

  const activeLesson = pythonLessonsData[state.activeModuleIdx].lessons[state.activeLessonIdx];
  const code = state.lessonEditor.getValue();

  const printToConsole = (text) => {
    consoleOutput.innerHTML += `<div>${escapeHtml(text)}</div>`;
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  };

  const printErrorToConsole = (text) => {
    consoleOutput.innerHTML += `<div class="log-error">${escapeHtml(text)}</div>`;
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  };

  // Запускаем через Runner
  const runResult = await PythonRunner.runCode(code, {
    onStdout: printToConsole,
    onStderr: printErrorToConsole,
    validationType: activeLesson.validationType,
    validationCode: activeLesson.validationCode,
    expectedOutput: activeLesson.expectedOutput
  });

  // Возвращаем кнопку в исходное состояние
  runBtn.disabled = false;
  runBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg> Запустить`;

  if (runResult.success) {
    statusText.innerText = "Выполнено успешно";
    consoleOutput.innerHTML += `<div class="log-success">\n✔ Задание выполнено верно! Код прошел все тесты!</div>`;
    
    // Если урок еще не был пройден
    if (!state.completedLessons.includes(activeLesson.id)) {
      state.completedLessons.push(activeLesson.id);
      saveState();
      
      addXP(25); // +25 XP за решение задачи!
      updateUI();
      
      // Разблокируем Квиз
      if (activeLesson.quiz) {
        const quizWrapper = document.getElementById("lesson-quiz");
        quizWrapper.classList.add("active");
        renderQuiz(activeLesson.quiz, true);
        showToast("Открыт квиз для этого урока! Проверьте свои знания.", "success");
      }

      // Проверяем, не завершили ли мы модуль целиком
      checkModuleCompletion(state.activeModuleIdx);
    }
  } else {
    statusText.innerText = "Ошибка выполнения";
    consoleOutput.innerHTML += `<div class="log-error">\n❌ Ошибка в задании:\n${escapeHtml(runResult.error || "Неверный вывод программы. Сверьтесь с условием.")}</div>`;
    showToast("Код не прошел тесты. Попробуйте еще раз!", "error");
  }

  // Добавляем курсор
  consoleOutput.innerHTML += `<span class="console-cursor"></span>`;
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Сброс кода на экране Урока
function resetActiveLessonCode() {
  const activeLesson = pythonLessonsData[state.activeModuleIdx].lessons[state.activeLessonIdx];
  if (confirm("Вы действительно хотите сбросить код к начальному состоянию?")) {
    state.lessonEditor.setValue(activeLesson.starterCode);
    delete state.lessonCodes[activeLesson.id];
    saveState();
    showToast("Код сброшен!", "success");
  }
}

// Привязка событий к кнопкам урока
document.getElementById("btn-run-code").addEventListener("click", runActiveLessonCode);
document.getElementById("btn-reset-code").addEventListener("click", resetActiveLessonCode);

// Отрисовка Квиза
function renderQuiz(quiz, isUnlocked) {
  const qQuestion = document.getElementById("quiz-question");
  const qOptions = document.getElementById("quiz-options");
  const qFeedback = document.getElementById("quiz-feedback");
  
  qQuestion.innerText = quiz.question;
  qOptions.innerHTML = "";
  qFeedback.className = "quiz-feedback"; // скрываем
  
  quiz.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.innerText = opt;
    
    if (!isUnlocked) {
      btn.disabled = true;
      btn.style.opacity = "0.6";
      btn.style.cursor = "not-allowed";
    } else {
      btn.onclick = () => handleQuizSubmit(idx, quiz.correctIdx, quiz.explanation, btn);
    }
    
    qOptions.appendChild(btn);
  });

  if (!isUnlocked) {
    qQuestion.innerHTML = `<span style="color: var(--text-muted);">🔒 Завершите практическое задание выше, чтобы открыть тест!</span><br><br>${quiz.question}`;
  }
}

// Обработка выбора ответа в квизе
function handleQuizSubmit(selectedIdx, correctIdx, explanation, buttonEl) {
  const qFeedback = document.getElementById("quiz-feedback");
  const qFeedbackTitle = document.getElementById("quiz-feedback-title");
  const qFeedbackText = document.getElementById("quiz-feedback-text");
  
  const options = document.querySelectorAll(".quiz-option");
  
  // Сбрасываем классы у всех кнопок
  options.forEach(opt => {
    opt.className = "quiz-option";
  });

  if (selectedIdx === correctIdx) {
    buttonEl.classList.add("correct");
    qFeedbackTitle.innerText = "Правильно! 🎉";
    qFeedbackTitle.className = "feedback-title correct";
    qFeedbackText.innerText = explanation;
    qFeedback.className = "quiz-feedback show";
    
    // Блокируем дальнейший выбор
    options.forEach(opt => opt.disabled = true);
    
    // Начисляем экстра XP (+10 XP за тест), если урок еще не был "полностью решен"
    const activeLesson = pythonLessonsData[state.activeModuleIdx].lessons[state.activeLessonIdx];
    const quizPassKey = `quiz_${activeLesson.id}`;
    
    if (!state.completedLessons.includes(quizPassKey)) {
      state.completedLessons.push(quizPassKey);
      saveState();
      addXP(10);
    }
  } else {
    buttonEl.classList.add("incorrect");
    qFeedbackTitle.innerText = "Не совсем правильно ❌";
    qFeedbackTitle.className = "feedback-title incorrect";
    qFeedbackText.innerText = "Попробуйте прочитать теорию еще раз и выбрать другой ответ.";
    qFeedback.className = "quiz-feedback show";
  }
}

// Проверка завершения модуля целиком
function checkModuleCompletion(moduleIdx) {
  const module = pythonLessonsData[moduleIdx];
  const allLessonIds = module.lessons.map(l => l.id);
  
  const allPassed = allLessonIds.every(id => state.completedLessons.includes(id));
  
  if (allPassed && !state.completedModules.includes(module.id)) {
    state.completedModules.push(module.id);
    saveState();
    
    // Показываем оверлей поздравления
    const overlay = document.getElementById("module-completion-overlay");
    const xpTag = document.getElementById("completion-xp-tag");
    
    xpTag.innerText = `+${module.xpReward} XP Бонус!`;
    overlay.style.display = "flex";
    
    // Кнопка закрытия оверлея
    document.getElementById("btn-completion-ok").onclick = () => {
      overlay.style.display = "none";
      addXP(module.xpReward); // Начисляем бонус
      switchScreen("dashboard");
    };
  }
}


// ================= 3. ЛОГИКА ПЕСОЧНИЦЫ (PLAYGROUND) =================

function initPlayground() {
  const templatesContainer = document.getElementById("templates-container");
  if (!templatesContainer) return;
  
  templatesContainer.innerHTML = "";
  
  playgroundTemplates.forEach((temp) => {
    const item = document.createElement("button");
    item.className = "template-item";
    item.innerHTML = `
      <div class="template-title">${temp.title}</div>
      <div class="template-desc">${temp.desc}</div>
    `;
    
    item.onclick = () => {
      if (confirm(`Загрузить шаблон "${temp.title}"? Текущий код в редакторе песочницы будет заменен.`)) {
        state.playgroundEditor.setValue(temp.code);
        setTimeout(() => state.playgroundEditor.refresh(), 100);
        showToast("Шаблон успешно загружен!", "success");
      }
    };
    
    templatesContainer.appendChild(item);
  });

  // Задаем стартовый код в песочнице
  const defaultPlaygroundCode = `# Добро пожаловать в Песочницу Python!\n# Здесь вы можете писать и запускать любой код.\n\nprint("Hello World!")\n\nfor i in range(3):\n    print(f"Итерация {i+1}")\n`;
  
  // Кнопка запуск
  document.getElementById("btn-playground-run").addEventListener("click", runPlaygroundCode);
  
  // Очистка консоли
  document.getElementById("btn-clear-playground-console").addEventListener("click", () => {
    document.getElementById("playground-console-output").innerHTML = `<span class="console-cursor"></span>`;
  });

  // Скачивание файла кода
  document.getElementById("btn-download-code").addEventListener("click", () => {
    const code = state.playgroundEditor.getValue();
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "pylearn_script.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast("Код скачан как pylearn_script.py!", "success");
  });
}

// Запуск кода в Песочнице
async function runPlaygroundCode() {
  if (!PythonRunner.isReady) {
    showToast("Интерпретатор Python еще загружается...", "error");
    return;
  }

  const runBtn = document.getElementById("btn-playground-run");
  runBtn.disabled = true;
  runBtn.innerHTML = `<span class="spinner" style="margin-right: 8px;"></span>Выполнение...`;

  const consoleOutput = document.getElementById("playground-console-output");
  consoleOutput.innerHTML = ""; // очищаем

  const code = state.playgroundEditor.getValue();

  const printToConsole = (text) => {
    consoleOutput.innerHTML += `<div>${escapeHtml(text)}</div>`;
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  };

  const printErrorToConsole = (text) => {
    consoleOutput.innerHTML += `<div class="log-error">${escapeHtml(text)}</div>`;
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  };

  const result = await PythonRunner.runCode(code, {
    onStdout: printToConsole,
    onStderr: printErrorToConsole
  });

  runBtn.disabled = false;
  runBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg> Запустить`;

  if (result.success === false && result.error) {
    // В песочнице ошибки компиляции тоже логируем
    // (Поскольку validationType="none", success=false бывает только при Python исключениях)
  } else {
    // Добавляем красивую зеленую отметку о конце выполнения
    consoleOutput.innerHTML += `<div class="log-info">\n--- Программа завершена ---</div>`;
  }

  consoleOutput.innerHTML += `<span class="console-cursor"></span>`;
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}


// ================= 4. ЛОГИКА ШПАРАГАЛКИ (CHEATSHEET) =================

function initCheatSheet() {
  renderCheatSheetCards(cheatsheetData);

  // Живой поиск
  const searchInput = document.getElementById("cheatsheet-search");
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (!val) {
      renderCheatSheetCards(cheatsheetData);
      return;
    }

    const filtered = cheatsheetData.filter(item => {
      return item.title.toLowerCase().includes(val) || 
             item.category.toLowerCase().includes(val) || 
             item.desc.toLowerCase().includes(val) ||
             item.code.toLowerCase().includes(val);
    });

    renderCheatSheetCards(filtered);
  });
}

function renderCheatSheetCards(data) {
  const container = document.getElementById("cheatsheet-container");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (data.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
        Ничего не найдено по вашему запросу 🔍
      </div>
    `;
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "glass-card cheat-card";
    
    card.innerHTML = `
      <div class="cheat-title">
        <span style="font-size: 11px; background: rgba(59, 130, 246, 0.1); color: var(--secondary); border: 1px solid rgba(59,130,246,0.2); padding: 2px 8px; border-radius: 12px; font-weight: 500;">${item.category}</span>
        ${item.title}
      </div>
      <div class="cheat-description">${item.desc}</div>
      <div class="cheat-example-box">
        <pre style="margin: 0;"><code class="language-python">${escapeHtml(item.code)}</code></pre>
      </div>
      <div class="cheat-actions">
        <button class="btn btn-secondary btn-tiny btn-playground-import">Запустить в песочнице 🚀</button>
      </div>
    `;
    
    // Кнопка импорта в песочницу
    card.querySelector(".btn-playground-import").onclick = () => {
      switchScreen("playground");
      
      // Задаем код в редактор
      state.playgroundEditor.setValue(item.code);
      setTimeout(() => state.playgroundEditor.refresh(), 150);
      
      showToast("Код перенесен в песочницу!", "success");
    };

    container.appendChild(card);
  });
}


// Вспомогательные утилиты
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
