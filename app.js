// Multi-User state registry for Manager Training Application
document.addEventListener('DOMContentLoaded', () => {
  
  // --- DATABASE INITIALIZATION ---
  const ACCOUNTS_KEY = 'climate_severa_accounts';
  const SESSION_KEY = 'climate_severa_session';
  
  // Pre-configured Admin Credentials
  const ADMIN_EMAIL = 'sultan.marketing.dubai@gmail.com';
  const ADMIN_PASSWORD = '312312312';

  // Master Database structure
  let dbRegistry = {
    users: {} // Keys: email, Value: User progress object
  };

  // Session state
  let sessionState = {
    currentUser: null, // Stores email of logged-in manager, or 'admin'
    role: null // 'trainee' or 'admin'
  };

  // Trainee template structure
  function createNewTraineeProfile(password) {
    return {
      password: password,
      currentLevel: 1,
      unlockedLevels: [1],
      completedLevels: [],
      homeworks: {
        1: { text: '', status: 'Не сдано' },
        2: { text: '', status: 'Не сдано' },
        3: { text: '', status: 'Не сдано' },
        4: { text: '', status: 'Не сдано' },
        5: { text: '', status: 'Не сдано' }
      },
      exercises: {
        level1Matching: false,
        level2Sim: false,
        level3Quiz: false,
        level4Crm: false,
        level5Wa: false,
        level5Exam: false
      }
    };
  }

  // --- HTML SELECTORS ---
  // Auth Screen Selectors
  const authOverlay = document.getElementById('authOverlay');
  const authForm = document.getElementById('authForm');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const authError = document.getElementById('authError');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const btnSubmitAuth = document.getElementById('btnSubmitAuth');
  
  // Main Navigation / Layout Selectors
  const traineeView = document.getElementById('traineeView');
  const adminView = document.getElementById('adminView');
  const roadmapNav = document.getElementById('roadmapNav');
  const userEmailSpan = document.getElementById('userEmailSpan');
  const btnLogOut = document.getElementById('btnLogOut');
  
  // Trainee View Selectors
  const headerLevelTitle = document.getElementById('headerLevelTitle');
  const headerLevelDays = document.getElementById('headerLevelDays');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const levelSections = document.querySelectorAll('.level-section');

  // Admin Panel View Selectors
  const adminUsersCount = document.getElementById('adminUsersCount');
  const adminUsersContainer = document.getElementById('adminUsersContainer');
  const adminDetailsCard = document.getElementById('adminDetailsCard');
  const adminDetailsPlaceholder = document.getElementById('adminDetailsPlaceholder');
  const adminDetailsContent = document.getElementById('adminDetailsContent');
  const adminSelectedUserEmail = document.getElementById('adminSelectedUserEmail');
  const adminSelectedUserProgress = document.getElementById('adminSelectedUserProgress');
  const adminHwTimeline = document.getElementById('adminHwTimeline');
  const btnAdminExport = document.getElementById('btnAdminExport');
  const btnAdminReset = document.getElementById('btnAdminReset');

  // --- AUTH CARD CONTROLLER (TABS) ---
  let isRegisterTab = false; // default login

  if (tabLoginBtn && tabRegisterBtn) {
    tabLoginBtn.addEventListener('click', () => {
      isRegisterTab = false;
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      btnSubmitAuth.textContent = 'Войти в систему';
      authError.textContent = '';
    });

    tabRegisterBtn.addEventListener('click', () => {
      isRegisterTab = true;
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      btnSubmitAuth.textContent = 'Зарегистрироваться';
      authError.textContent = '';
    });
  }

  // --- LOCAL DATABASE HELPERS ---
  function loadDatabase() {
    const rawDB = localStorage.getItem(ACCOUNTS_KEY);
    if (rawDB) {
      try {
        dbRegistry = JSON.parse(rawDB);
      } catch (e) {
        console.error("DB corruption, resetting registry.", e);
      }
    }
    
    // Load session
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (rawSession) {
      try {
        sessionState = JSON.parse(rawSession);
      } catch (e) {}
    }
  }

  function saveDatabase() {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(dbRegistry));
  }

  function saveSession() {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionState));
  }

  // --- LOGIN & REGISTER IMPLEMENTATION ---
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = authEmail.value.trim().toLowerCase();
      const pass = authPassword.value;
      
      authError.textContent = '';

      if (!email || !pass) {
        authError.textContent = 'Пожалуйста, заполните все поля!';
        return;
      }

      // Check for Admin credentials
      if (email === ADMIN_EMAIL.toLowerCase()) {
        if (pass === ADMIN_PASSWORD) {
          sessionState.currentUser = email;
          sessionState.role = 'admin';
          saveSession();
          enterApplication();
          return;
        } else {
          authError.textContent = 'Неверный пароль администратора!';
          return;
        }
      }

      if (isRegisterTab) {
        // Registration Logic
        if (pass.length < 6) {
          authError.textContent = 'Пароль должен быть не менее 6 символов!';
          return;
        }
        if (dbRegistry.users[email]) {
          authError.textContent = 'Пользователь с таким email уже существует!';
          return;
        }

        // Create new account
        dbRegistry.users[email] = createNewTraineeProfile(pass);
        saveDatabase();

        // Auto login
        sessionState.currentUser = email;
        sessionState.role = 'trainee';
        saveSession();
        enterApplication();
      } else {
        // Login Logic
        const user = dbRegistry.users[email];
        if (!user) {
          authError.textContent = 'Пользователь не найден. Зарегистрируйтесь!';
          return;
        }
        if (user.password !== pass) {
          authError.textContent = 'Неверный пароль!';
          return;
        }

        // Login success
        sessionState.currentUser = email;
        sessionState.role = 'trainee';
        saveSession();
        enterApplication();
      }
    });
  }

  // Log out action
  if (btnLogOut) {
    btnLogOut.addEventListener('click', () => {
      sessionState.currentUser = null;
      sessionState.role = null;
      saveSession();
      
      // Reset inputs on logout
      authEmail.value = '';
      authPassword.value = '';
      authError.textContent = '';
      
      location.reload(); // Reload window to flush UI DOM variables and return to auth
    });
  }

  // --- INITIAL CHECK ---
  loadDatabase();
  if (sessionState.currentUser) {
    enterApplication();
  } else {
    // Show auth card
    authOverlay.classList.add('active');
  }

  // Launching the actual views based on role
  function enterApplication() {
    authOverlay.classList.remove('active');
    
    if (sessionState.role === 'admin') {
      traineeView.style.display = 'none';
      roadmapNav.style.display = 'none';
      adminView.style.display = 'flex';
      userEmailSpan.textContent = 'Куратор (Admin)';
      
      initAdminPanel();
    } else {
      adminView.style.display = 'none';
      traineeView.style.display = 'flex';
      roadmapNav.style.display = 'flex';
      userEmailSpan.textContent = sessionState.currentUser;
      
      initTraineePortal();
    }
  }

  // =========================================================================
  // ========================= TRAINEE PORTAL ENGINE =========================
  // =========================================================================
  
  let traineeState = null;

  function initTraineePortal() {
    traineeState = dbRegistry.users[sessionState.currentUser];
    if (!traineeState) {
      // Safety reset
      sessionState.currentUser = null;
      sessionState.role = null;
      saveSession();
      location.reload();
      return;
    }

    updateTraineeUI();
    restoreTraineeWidgetStates();
  }

  function updateTraineeUI() {
    // 1. Update Roadmap list state
    const navItems = roadmapNav.querySelectorAll('.level-nav-item');
    navItems.forEach((btn, idx) => {
      const lvlNum = idx + 1;
      
      // Lock / Unlock
      if (traineeState.unlockedLevels.includes(lvlNum)) {
        btn.classList.remove('locked');
        btn.removeAttribute('disabled');
        const lockBadge = btn.querySelector('.lock-badge');
        if (lockBadge) lockBadge.remove();
      } else {
        btn.classList.add('locked');
        btn.setAttribute('disabled', 'true');
        if (!btn.querySelector('.lock-badge')) {
          const badge = document.createElement('span');
          badge.className = 'lock-badge';
          badge.innerHTML = '🔒';
          btn.appendChild(badge);
        }
      }

      // Selected Level Active State
      if (traineeState.currentLevel === lvlNum) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }

      // Checkmark icon for completed
      const icon = btn.querySelector('.level-status-icon');
      if (traineeState.completedLevels.includes(lvlNum)) {
        btn.classList.add('completed');
        icon.innerHTML = '✓';
      } else {
        btn.classList.remove('completed');
        icon.innerHTML = lvlNum;
      }
    });

    // 2. Header details
    const levelTitles = {
      1: "Уровень 1: Понимание болей клиентов",
      2: "Уровень 2: Скрипт «Эксперт-Помощник»",
      3: "Уровень 3: Преодоление возражений",
      4: "Уровень 4: Правила ведения AMO CRM",
      5: "Уровень 5: Аналитика, Дожим и Финал"
    };
    const levelDays = {
      1: "Дни 1-2 программы обучения",
      2: "Дни 3-4 программы обучения",
      3: "Дни 5-6 программы обучения",
      4: "Дни 7-8 программы обучения",
      5: "Дни 9-10 программы обучения"
    };
    headerLevelTitle.textContent = levelTitles[traineeState.currentLevel] || "";
    headerLevelDays.textContent = levelDays[traineeState.currentLevel] || "";

    // 3. Compute Progress (out of 11 milestones)
    let totalPoints = 11;
    let earnedPoints = 0;
    earnedPoints += traineeState.completedLevels.length;
    if (traineeState.exercises.level1Matching) earnedPoints++;
    if (traineeState.exercises.level2Sim) earnedPoints++;
    if (traineeState.exercises.level3Quiz) earnedPoints++;
    if (traineeState.exercises.level4Crm) earnedPoints++;
    if (traineeState.exercises.level5Wa) earnedPoints++;
    if (traineeState.exercises.level5Exam) earnedPoints++;

    const percent = Math.round((earnedPoints / totalPoints) * 100);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}% выполнено`;

    // 4. Set Section visibility
    levelSections.forEach(section => {
      if (section.id === `level-${traineeState.currentLevel}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // 5. Homework inputs
    for (let l = 1; l <= 5; l++) {
      const hwInput = document.getElementById(`hwInput-${l}`);
      const hwStatus = document.getElementById(`hwStatus-${l}`);
      const btnSubmit = document.getElementById(`btnSubmit-${l}`);
      
      if (hwInput) {
        hwInput.value = traineeState.homeworks[l].text;
      }
      
      if (hwStatus) {
        let badgeHtml = '';
        if (traineeState.homeworks[l].status === 'Сдано') {
          badgeHtml = '<span class="badge badge-success">Сдано куратором</span>';
          if (hwInput) hwInput.disabled = true;
          if (btnSubmit) btnSubmit.disabled = true;
        } else if (traineeState.homeworks[l].status === 'На проверке') {
          badgeHtml = '<span class="badge badge-blue">На проверке у куратора</span>';
        } else {
          badgeHtml = '<span class="badge badge-blue" style="opacity: 0.6;">Не сдано</span>';
        }
        hwStatus.innerHTML = badgeHtml;
      }
    }
  }

  function saveTraineeState() {
    dbRegistry.users[sessionState.currentUser] = traineeState;
    saveDatabase();
  }

  // --- TRAINEE NAVIGATION EVENT ---
  roadmapNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.level-nav-item');
    if (!btn || btn.classList.contains('locked')) return;
    
    const targetLvl = parseInt(btn.getAttribute('data-level'), 10);
    traineeState.currentLevel = targetLvl;
    saveTraineeState();
    updateTraineeUI();
    
    document.querySelector('.main-content').scrollTop = 0;
  });

  // Restore states of matching exercises, simulators, quizzes
  function restoreTraineeWidgetStates() {
    // 1. Level 1 Matchings
    const targetCafe = document.getElementById('target-cafe');
    const targetBank = document.getElementById('target-bank');
    const sourceCards = document.getElementById('sourceCards');
    
    if (traineeState.exercises.level1Matching) {
      const cards = [
        { id: 'card-1', category: 'cafe' },
        { id: 'card-2', category: 'bank' },
        { id: 'card-3', category: 'cafe' },
        { id: 'card-4', category: 'bank' },
        { id: 'card-5', category: 'cafe' },
        { id: 'card-6', category: 'bank' }
      ];
      cards.forEach(c => {
        const card = document.getElementById(c.id);
        const target = document.getElementById(`target-${c.category}`);
        if (card && target) {
          card.classList.add('matched-success');
          card.setAttribute('draggable', 'false');
          target.appendChild(card);
        }
      });
      // Show checkmark text
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'callout callout-info';
      feedbackDiv.style.borderColor = 'var(--success)';
      feedbackDiv.innerHTML = '<strong>Практика зачтена!</strong> Вы верно распределили все боли по сегментам.';
      
      const practiceCard = document.querySelector('#level-1 .card:nth-child(2)');
      if (practiceCard && !practiceCard.querySelector('.callout-info')) {
        practiceCard.appendChild(feedbackDiv);
      }
    }

    // 2. Level 2 Simulator
    startSimulator();

    // 3. Level 3 Quiz
    const quizObjectionOptions = document.getElementById('quizObjectionOptions');
    const quizObjectionFeedback = document.getElementById('quizObjectionFeedback');
    if (traineeState.exercises.level3Quiz && quizObjectionOptions) {
      quizObjectionOptions.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.add('disabled');
        if (opt.getAttribute('data-correct') === 'true') {
          opt.classList.add('correct');
        }
      });
      quizObjectionFeedback.textContent = 'Правильно! Тест пройден.';
      quizObjectionFeedback.className = 'quiz-feedback show correct';
    } else if (quizObjectionOptions) {
      quizObjectionOptions.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.remove('disabled', 'correct', 'incorrect');
      });
      quizObjectionFeedback.classList.remove('show');
    }

    // 4. Level 4 CRM
    const crmDeal = document.getElementById('crm-deal-1');
    const crmColDiag = document.getElementById('crm-col-diag');
    const crmColCold = document.getElementById('crm-col-cold');
    const crmScheduler = document.getElementById('crmScheduler');
    
    if (traineeState.exercises.level4Crm && crmColDiag && crmDeal) {
      crmColDiag.appendChild(crmDeal);
      document.getElementById('crmCountCold').textContent = '0';
      document.getElementById('crmCountDiag').textContent = '1';
      if (crmScheduler) {
        crmScheduler.classList.add('active');
        crmScheduler.innerHTML = '<div style="color: var(--success); font-weight: 600; text-align: center; padding: 1rem;">✓ Сделка успешно переведена, задача на напоминание за 2 часа поставлена! Блок CRM зачтен.</div>';
      }
    } else if (crmColCold && crmDeal) {
      crmColCold.appendChild(crmDeal);
      document.getElementById('crmCountCold').textContent = '1';
      document.getElementById('crmCountDiag').textContent = '0';
      if (crmScheduler) {
        crmScheduler.classList.remove('active');
        crmScheduler.innerHTML = `
          <div class="scheduler-title">➕ Создание автоматической задачи по сделке</div>
          <form class="scheduler-form" id="schedulerForm" onsubmit="event.preventDefault();">
            <div class="form-group">
              <label for="taskType">Тип задачи</label>
              <select id="taskType">
                <option value="">-- Выберите тип --</option>
                <option value="call">Звонок / WhatsApp (Напомнить о встрече)</option>
                <option value="audit">Узнать результат у инженера</option>
                <option value="other">Другое</option>
              </select>
            </div>
            <div class="form-group">
              <label for="taskTime">Срок (когда выполнить)</label>
              <select id="taskTime">
                <option value="">-- Выберите срок --</option>
                <option value="2h">За 2 часа до выезда инженера</option>
                <option value="post">Сразу после выезда инженера</option>
                <option value="eod">В конце дня</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label for="taskText">Текст задачи (комментарий для менеджера)</label>
              <textarea id="taskText" placeholder="Например: Напомнить Ирине о выезде инженера Петра в 14:00, написать в WhatsApp за 2 часа."></textarea>
            </div>
            <div style="grid-column: span 2; display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
              <button type="button" class="btn btn-secondary" id="btnCancelTask">Сбросить</button>
              <button type="button" class="btn btn-primary" id="btnSaveTask">Сохранить задачу</button>
            </div>
          </form>
        `;
        bindCRMTaskSchedulerEvents();
      }
    }

    // 5. Level 5 WhatsApp Message Check
    const waMessageText = document.getElementById('waMessageText');
    const waFeedback = document.getElementById('waFeedback');
    if (traineeState.exercises.level5Wa && waFeedback) {
      waFeedback.innerHTML = 'Отлично! WhatsApp сообщение успешно составлено и зачтено.';
      waFeedback.className = 'quiz-feedback show correct';
    } else {
      if (waMessageText) waMessageText.value = '';
      if (waFeedback) waFeedback.classList.remove('show');
    }

    // 6. Level 5 Exam Quiz
    const examQuestions = ['q1', 'q2', 'q3'];
    const examFeedback = document.getElementById('examFeedback');
    
    if (traineeState.exercises.level5Exam && examFeedback) {
      examQuestions.forEach(qId => {
        const qBlock = document.querySelector(`.quiz-options[data-question="${qId}"]`);
        if (qBlock) {
          qBlock.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.add('disabled');
            if (opt.getAttribute('data-correct') === 'true') {
              opt.classList.add('correct');
            } else {
              opt.classList.remove('incorrect');
            }
          });
        }
      });
      examFeedback.textContent = 'Поздравляем! Экзамен успешно сдан.';
      examFeedback.className = 'quiz-feedback show correct';
    } else if (examFeedback) {
      examQuestions.forEach(qId => {
        const qBlock = document.querySelector(`.quiz-options[data-question="${qId}"]`);
        if (qBlock) {
          qBlock.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('disabled', 'correct', 'incorrect');
          });
        }
      });
      examFeedback.classList.remove('show');
    }
  }

  // --- TRAINEE PRACTICE WIDGET EVENT HANDLERS ---
  // Level 1: Matching Card game Drag-and-drop
  const sourceCards = document.getElementById('sourceCards');
  const targetCafe = document.getElementById('target-cafe');
  const targetBank = document.getElementById('target-bank');
  let selectedItem = null;

  if (sourceCards) {
    sourceCards.addEventListener('click', (e) => {
      const matchItem = e.target.closest('.match-item');
      if (!matchItem || matchItem.classList.contains('matched-success')) return;

      document.querySelectorAll('.match-item').forEach(el => el.classList.remove('selected'));
      selectedItem = matchItem;
      matchItem.classList.add('selected');
    });
  }

  const targets = [targetCafe, targetBank];
  targets.forEach(target => {
    if (!target) return;
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      target.classList.add('dragover');
    });
    target.addEventListener('dragleave', () => {
      target.classList.remove('dragover');
    });
    target.addEventListener('drop', (e) => {
      e.preventDefault();
      target.classList.remove('dragover');
      const cardId = e.dataTransfer.getData('text/plain');
      const card = document.getElementById(cardId);
      if (card) handleMatchDrop(card, target);
    });
    target.addEventListener('click', () => {
      if (selectedItem) {
        handleMatchDrop(selectedItem, target);
        selectedItem.classList.remove('selected');
        selectedItem = null;
      }
    });
  });

  if (sourceCards) {
    sourceCards.querySelectorAll('.match-item').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });
  }

  function handleMatchDrop(card, target) {
    const cardCategory = card.getAttribute('data-category');
    const targetCategory = target.getAttribute('data-target');

    if (cardCategory === targetCategory) {
      card.classList.add('matched-success');
      card.setAttribute('draggable', 'false');
      card.classList.remove('selected');
      target.appendChild(card);
      
      checkLevel1Completion();
    } else {
      card.style.borderColor = 'var(--danger)';
      setTimeout(() => { card.style.borderColor = 'var(--border-color)'; }, 800);
    }
  }

  function checkLevel1Completion() {
    const remaining = sourceCards.querySelectorAll('.match-item:not(.matched-success)').length;
    if (remaining === 0) {
      traineeState.exercises.level1Matching = true;
      saveTraineeState();
      updateTraineeUI();
      
      const practiceCard = document.querySelector('#level-1 .card:nth-child(2)');
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'callout callout-info';
      feedbackDiv.style.borderColor = 'var(--success)';
      feedbackDiv.innerHTML = '<strong>Практика зачтена!</strong> Вы верно распределили все боли по сегментам.';
      if (practiceCard && !practiceCard.querySelector('.callout-info')) {
        practiceCard.appendChild(feedbackDiv);
      }
    }
  }

  // Level 2: Dialogue Simulator Tree
  const simChatArea = document.getElementById('simChatArea');
  const simChoicesArea = document.getElementById('simChoicesArea');
  const btnResetSim = document.getElementById('btnResetSim');
  const simStatus = document.getElementById('simStatus');

  const dialogueTree = {
    start: {
      speaker: 'client',
      text: '— Алло? Да, слушаю вас.',
      choices: [
        {
          text: '«Добрый день! Ирина, беспокоит Дмитрий, компания "Климат Севера". Мы профессионально занимаемся обслуживанием систем кондиционирования для ресторанов. Подскажите, я правильно попал на человека, который отвечает за техническое состояние помещения?»',
          next: 'node_intro_ok'
        },
        {
          text: '«Привет! Это клининговая компания по кондиционерам. Нам надо проверить ваши фильтры бесплатно. В среду будете на месте?»',
          next: 'fail_hangup_abrupt'
        },
        {
          text: '«Здравствуйте, а позовите управляющего или директора, у меня коммерческое предложение по ремонту сплит-систем».',
          next: 'fail_gatekeeper_reject'
        }
      ]
    },
    node_intro_ok: {
      speaker: 'client',
      text: '— Да, я управляющая. А что вы хотели? У нас вроде всё работает нормально.',
      choices: [
        {
          text: '«Понимаю вас. Мы как раз проводим плановый аудит оборудования в вашем районе. В связи с сезоном, многие заведения сейчас сталкиваются с перегревом или внезапным отключением техники. Как у вас дела с климатом в зале? Все штатно или замечали посторонние шумы / слабый холод?»',
          next: 'node_pain_check'
        },
        {
          text: '«Да ладно вам, в такую жару кондиционеры всегда ломаются. Давайте мы приедем и почистим их за полцены, пока компрессор не сгорел?»',
          next: 'fail_scare_tactics'
        }
      ]
    },
    node_pain_check: {
      speaker: 'client',
      text: '— Да вроде запахов нет, холодит нормально. Иногда только на кухне повара жалуются, что душно, но там плиты работают...',
      choices: [
        {
          text: '«Ну, на кухне всегда жарко, это нормально. А вот в зале если сломается, то клиенты уйдут. Давайте инженер приедет?»',
          next: 'fail_dismissive'
        },
        {
          text: '«Понимаю. Духота на кухне — частая проблема, если вытяжка забита жиром, кондиционер задыхается и компрессор перегревается. Чтобы вы были уверены, что техника не откажет в разгар сезона, мы предлагаем бесплатный выезд нашего инженера. Он замерит давление фреона, проверит состояние компрессора и даст честное заключение. Вам удобнее в среду в первой или второй половине дня?»',
          next: 'node_offer_accepted'
        }
      ]
    },
    node_offer_accepted: {
      speaker: 'client',
      text: '— Ну, бесплатно... Давайте в среду после обеда, часиков в три.',
      choices: [
        {
          text: '«Хорошо, Ирина, договорились. В среду в 15:00 наш инженер Петр будет у вас. Давайте я зафиксирую выезд, а перед выездом за 2 часа мы пришлем вам короткое подтверждение в WhatsApp. Договорились?»',
          next: 'success_node'
        },
        {
          text: '«Окей, записал. В среду в 15:00. Приедет мастер, разберется там с вашими кондиционерами. До свидания.»',
          next: 'fail_no_confirmation_protocol'
        }
      ]
    },
    success_node: {
      speaker: 'client',
      text: '— Да, хорошо, пришлите подтверждение на этот номер. Будем ждать инженера. Спасибо!',
      isSuccess: true
    },
    fail_hangup_abrupt: {
      speaker: 'client',
      text: '— Нет, нам ничего не нужно. *гудки* Пип... Пип... Пип...',
      isFailure: true,
      reason: 'Слишком навязчивое начало разговора без выхода на ЛПР и объяснения ценности.'
    },
    fail_gatekeeper_reject: {
      speaker: 'client',
      text: '— Отправляйте ваше КП на почту info@romashka.ru, всего доброго! *гудки* Пип... Пип...',
      isFailure: true,
      reason: 'Прямая попытка продать "коммерческое предложение по ремонту" сразу натыкается на автоматический отказ.'
    },
    fail_scare_tactics: {
      speaker: 'client',
      text: '— Вы меня запугать хотите? У нас свой мастер есть, до свидания. *гудки*',
      isFailure: true,
      reason: 'Агрессивная продажа в лоб и попытка спорить с клиентом оттолкнули ЛПР.'
    },
    fail_dismissive: {
      speaker: 'client',
      text: '— Нет, спасибо, не надо. У нас всё хорошо. До свидания. *гудки*',
      isFailure: true,
      reason: 'Игнорирование жалобы поваров на духоту. Менеджер упустил зацепку для закрытия выезда.'
    },
    fail_no_confirmation_protocol: {
      speaker: 'client',
      text: '— Знаете, я подумала... Наверное, в среду не получится. Давайте отложим, я сама позвоню. *гудки*',
      isFailure: true,
      reason: 'Менеджер не согласовал дисциплину подтверждения по WhatsApp, потеряв фиксацию сделки.'
    }
  };

  function startSimulator() {
    if (!simChatArea) return;
    simChatArea.innerHTML = '';
    simChoicesArea.innerHTML = '';
    btnResetSim.style.display = 'none';
    simStatus.textContent = 'В процессе разговора...';
    simStatus.style.color = 'var(--accent-cyan)';
    
    renderNode('start');
  }

  function renderNode(nodeId) {
    const node = dialogueTree[nodeId];
    if (!node) return;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble client';
    bubble.innerHTML = node.text;
    simChatArea.appendChild(bubble);
    simChatArea.scrollTop = simChatArea.scrollHeight;

    if (node.isSuccess) {
      simStatus.textContent = 'Успех: Выезд назначен!';
      simStatus.style.color = 'var(--success)';
      btnResetSim.style.display = 'inline-flex';
      btnResetSim.textContent = 'Пройти тренажер еще раз';
      
      traineeState.exercises.level2Sim = true;
      saveTraineeState();
      updateTraineeUI();
      return;
    }

    if (node.isFailure) {
      simStatus.textContent = 'Разговор сорван!';
      simStatus.style.color = 'var(--danger)';
      
      const rBubble = document.createElement('div');
      rBubble.className = 'chat-bubble client';
      rBubble.style.borderColor = 'var(--danger)';
      rBubble.style.background = 'var(--danger-glow)';
      rBubble.innerHTML = `<strong>Ошибка:</strong> ${node.reason}`;
      simChatArea.appendChild(rBubble);
      simChatArea.scrollTop = simChatArea.scrollHeight;

      btnResetSim.style.display = 'inline-flex';
      btnResetSim.textContent = 'Попробовать снова';
      return;
    }

    simChoicesArea.innerHTML = '';
    node.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        const mBubble = document.createElement('div');
        mBubble.className = 'chat-bubble manager';
        mBubble.textContent = choice.text;
        simChatArea.appendChild(mBubble);
        simChoicesArea.innerHTML = '';
        
        setTimeout(() => { renderNode(choice.next); }, 600);
      });
      simChoicesArea.appendChild(btn);
    });
  }

  if (btnResetSim) {
    btnResetSim.addEventListener('click', startSimulator);
  }

  // Level 3: Objection Quiz
  const quizObjectionOptions = document.getElementById('quizObjectionOptions');
  const quizObjectionFeedback = document.getElementById('quizObjectionFeedback');

  if (quizObjectionOptions) {
    quizObjectionOptions.addEventListener('click', (e) => {
      const option = e.target.closest('.quiz-option');
      if (!option || option.classList.contains('disabled')) return;

      const isCorrect = option.getAttribute('data-correct') === 'true';
      quizObjectionOptions.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.add('disabled');
        if (opt.getAttribute('data-correct') === 'true') {
          opt.classList.add('correct');
        } else if (opt === option) {
          opt.classList.add('incorrect');
        }
      });

      if (isCorrect) {
        quizObjectionFeedback.textContent = 'Правильно! Этот ответ хвалит ЛПР, объясняет необходимость сохранения гарантии и закрывает разговор предложением времени.';
        quizObjectionFeedback.className = 'quiz-feedback show correct';
        
        traineeState.exercises.level3Quiz = true;
        saveTraineeState();
        updateTraineeUI();
      } else {
        quizObjectionFeedback.textContent = 'Неверно. Такой ответ либо спорит с клиентом, либо ведет к потере инициативы.';
        quizObjectionFeedback.className = 'quiz-feedback show incorrect';
        
        setTimeout(() => {
          quizObjectionOptions.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('disabled', 'correct', 'incorrect');
          });
          quizObjectionFeedback.classList.remove('show');
        }, 2000);
      }
    });
  }

  // Level 4: CRM board Drag-and-drop & tasks scheduler
  function bindCRMTaskSchedulerEvents() {
    const crmDeal = document.getElementById('crm-deal-1');
    const crmColCold = document.getElementById('crm-col-cold');
    const crmScheduler = document.getElementById('crmScheduler');
    const btnSaveTask = document.getElementById('btnSaveTask');
    const btnCancelTask = document.getElementById('btnCancelTask');
    
    if (btnCancelTask) {
      btnCancelTask.addEventListener('click', () => {
        if (crmColCold && crmDeal) {
          crmColCold.appendChild(crmDeal);
          document.getElementById('crmCountCold').textContent = '1';
          document.getElementById('crmCountDiag').textContent = '0';
        }
        crmScheduler.classList.remove('active');
      });
    }

    if (btnSaveTask) {
      btnSaveTask.addEventListener('click', () => {
        const type = document.getElementById('taskType').value;
        const time = document.getElementById('taskTime').value;
        const text = document.getElementById('taskText').value.trim();

        if (!type || !time || !text) {
          alert('Пожалуйста, заполните все поля задачи!');
          return;
        }

        if (type === 'call' && time === '2h' && text.length > 15) {
          alert('Задача успешно создана в AMO CRM по регламенту!');
          crmScheduler.innerHTML = '<div style="color: var(--success); font-weight: 600; text-align: center; padding: 1rem;">✓ Сделка успешно переведена, задача на напоминание за 2 часа поставлена! Блок CRM зачтен.</div>';
          
          traineeState.exercises.level4Crm = true;
          saveTraineeState();
          updateTraineeUI();
        } else {
          alert('Ошибка регламента! Проверьте условия:\n1. Тип задачи: "Напомнить о встрече (Звонок/WhatsApp)".\n2. Срок: "За 2 часа до выезда инженера".\n3. В тексте укажите подробные инструкции (кто едет, во сколько, кому написать).');
        }
      });
    }
  }

  // Level 5: WhatsApp message verification
  const btnCheckWaMessage = document.getElementById('btnCheckWaMessage');
  const waFeedback = document.getElementById('waFeedback');

  if (btnCheckWaMessage) {
    btnCheckWaMessage.addEventListener('click', () => {
      const text = document.getElementById('waMessageText').value.trim().toLowerCase();
      if (text.length < 30) {
        waFeedback.innerHTML = 'Сообщение слишком короткое. Клиент не поймет серьезность ситуации.';
        waFeedback.className = 'quiz-feedback show incorrect';
        return;
      }

      const keywords = ['ирина', 'инженер', 'отчет', 'компрессор', 'фреон', 'сгореть', '75'];
      const missing = [];
      keywords.forEach(kw => {
        if (!text.includes(kw)) missing.push(kw);
      });

      if (missing.length === 0) {
        waFeedback.innerHTML = 'Отлично! Вы указали имя клиента, сослались на отчет инженера, четко описали проблему (фреон, компрессор), предупредили о критических последствиях (сгорит компрессор) и указали стоимость альтернативного дорогого ремонта (75 000 рублей). Это идеальное письмо-дожим!';
        waFeedback.className = 'quiz-feedback show correct';
        
        traineeState.exercises.level5Wa = true;
        saveTraineeState();
        updateTraineeUI();
      } else {
        const missingReport = missing.map(m => `"${m}"`).join(', ');
        waFeedback.innerHTML = `Сообщение хорошее, но не хватает убедительности. Попробуйте включить важные детали: ${missingReport}. Помните, клиент должен почувствовать выгоду ремонта прямо сейчас по сравнению с заменой сгоревшего компрессора за 75 000 рублей.`;
        waFeedback.className = 'quiz-feedback show incorrect';
      }
    });
  }

  // Level 5: Exam block click listeners
  const examQuestions = ['q1', 'q2', 'q3'];
  examQuestions.forEach(qId => {
    const qBlock = document.querySelector(`.quiz-options[data-question="${qId}"]`);
    if (qBlock) {
      qBlock.addEventListener('click', (e) => {
        const option = e.target.closest('.quiz-option');
        if (!option || option.classList.contains('disabled')) return;
        
        qBlock.querySelectorAll('.quiz-option').forEach(opt => {
          opt.classList.remove('correct', 'incorrect');
        });
        
        const isCorrect = option.getAttribute('data-correct') === 'true';
        if (isCorrect) option.classList.add('correct');
        else option.classList.add('incorrect');
      });
    }
  });

  const btnSubmitExam = document.getElementById('btnSubmitExam');
  const examFeedback = document.getElementById('examFeedback');

  if (btnSubmitExam) {
    btnSubmitExam.addEventListener('click', () => {
      let allCorrect = true;
      let answeredCount = 0;

      examQuestions.forEach(qId => {
        const qBlock = document.querySelector(`.quiz-options[data-question="${qId}"]`);
        if (qBlock) {
          const selected = qBlock.querySelector('.quiz-option.correct');
          if (selected) answeredCount++;
          else allCorrect = false;
        }
      });

      if (answeredCount < 3) {
        examFeedback.textContent = 'Пожалуйста, ответьте на все 3 вопроса перед отправкой!';
        examFeedback.className = 'quiz-feedback show incorrect';
        return;
      }

      if (allCorrect) {
        examFeedback.textContent = 'Поздравляем! Вы правильно ответили на все вопросы экзамена. Программа обучения завершена!';
        examFeedback.className = 'quiz-feedback show correct';
        
        traineeState.exercises.level5Exam = true;
        saveTraineeState();
        updateTraineeUI();
      } else {
        examFeedback.textContent = 'В ответах есть ошибки. Перечитайте теоретический материал и попробуйте изменить ответы.';
        examFeedback.className = 'quiz-feedback show incorrect';
      }
    });
  }

  // --- TRAINEE HOMEWORK SUBMIT ACTIONS ---
  for (let l = 1; l <= 5; l++) {
    const btnSubmit = document.getElementById(`btnSubmit-${l}`);
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        const hwInput = document.getElementById(`hwInput-${l}`);
        const text = hwInput.value.trim();

        if (text.length < 20) {
          alert('Пожалуйста, напишите более подробный ответ на домашнее задание (хотя бы 20 символов).');
          return;
        }

        // Check if level practice exercise was completed first
        if (l === 1 && !traineeState.exercises.level1Matching) {
          alert('Прежде чем отправить ДЗ, завершите интерактивную практику (сопоставьте боли клиентов).');
          return;
        }
        if (l === 2 && !traineeState.exercises.level2Sim) {
          alert('Прежде чем отправить ДЗ, успешно пройдите симулятор звонка.');
          return;
        }
        if (l === 3 && !traineeState.exercises.level3Quiz) {
          alert('Прежде чем отправить ДЗ, верно ответьте на практический тест по возражениям.');
          return;
        }
        if (l === 4 && !traineeState.exercises.level4Crm) {
          alert('Прежде чем отправить ДЗ, завершите интерактивную практику в симуляторе CRM.');
          return;
        }
        if (l === 5 && (!traineeState.exercises.level5Wa || !traineeState.exercises.level5Exam)) {
          alert('Прежде чем отправить ДЗ, завершите практику по WhatsApp-письму и сдайте финальный экзамен.');
          return;
        }

        // Save homework
        traineeState.homeworks[l].text = text;
        traineeState.homeworks[l].status = 'На проверке'; // Send to curator

        // Mark level completed
        if (!traineeState.completedLevels.includes(l)) {
          traineeState.completedLevels.push(l);
        }

        // Unlock next level
        const nextLvl = l + 1;
        if (nextLvl <= 5 && !traineeState.unlockedLevels.includes(nextLvl)) {
          traineeState.unlockedLevels.push(nextLvl);
        }

        saveTraineeState();
        updateTraineeUI();
        alert(`Домашнее задание для уровня ${l} отправлено! Теперь куратор сможет зайти в свою панель и проверить его.`);
      });
    }
  }


  // =========================================================================
  // ========================== SUPERVISOR ADMIN PANEL =======================
  // =========================================================================
  
  let selectedStudentEmail = null;

  function initAdminPanel() {
    renderAdminTraineesList();
    
    // Clear display viewport
    adminDetailsPlaceholder.style.display = 'block';
    adminDetailsContent.style.display = 'none';
    selectedStudentEmail = null;
  }

  function renderAdminTraineesList() {
    if (!adminUsersContainer) return;
    adminUsersContainer.innerHTML = '';

    const managerEmails = Object.keys(dbRegistry.users);
    adminUsersCount.textContent = managerEmails.length;

    if (managerEmails.length === 0) {
      adminUsersContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1.5rem;">Нет зарегистрированных студентов.</p>';
      return;
    }

    managerEmails.forEach(email => {
      const student = dbRegistry.users[email];
      
      // Calculate progress percentage
      let earned = student.completedLevels.length;
      if (student.exercises.level1Matching) earned++;
      if (student.exercises.level2Sim) earned++;
      if (student.exercises.level3Quiz) earned++;
      if (student.exercises.level4Crm) earned++;
      if (student.exercises.level5Wa) earned++;
      if (student.exercises.level5Exam) earned++;
      const progressPercent = Math.round((earned / 11) * 100);

      // Create item card
      const itemBtn = document.createElement('button');
      itemBtn.className = `student-item ${selectedStudentEmail === email ? 'active' : ''}`;
      itemBtn.innerHTML = `
        <div class="student-meta">
          <span class="student-email" title="${email}">${email}</span>
          <div class="student-progress-row">
            <span>Прогресс обучения</span>
            <span>${progressPercent}%</span>
          </div>
          <div class="student-bar-outer">
            <div class="student-bar-inner" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
      `;

      itemBtn.addEventListener('click', () => {
        // Toggle active button
        adminUsersContainer.querySelectorAll('.student-item').forEach(el => el.classList.remove('active'));
        itemBtn.classList.add('active');

        selectedStudentEmail = email;
        renderAdminStudentDetails(email);
      });

      adminUsersContainer.appendChild(itemBtn);
    });
  }

  function renderAdminStudentDetails(email) {
    const student = dbRegistry.users[email];
    if (!student) return;

    adminDetailsPlaceholder.style.display = 'none';
    adminDetailsContent.style.display = 'block';

    adminSelectedUserEmail.textContent = email;

    // Calc progress
    let earned = student.completedLevels.length;
    if (student.exercises.level1Matching) earned++;
    if (student.exercises.level2Sim) earned++;
    if (student.exercises.level3Quiz) earned++;
    if (student.exercises.level4Crm) earned++;
    if (student.exercises.level5Wa) earned++;
    if (student.exercises.level5Exam) earned++;
    const progressPercent = Math.round((earned / 11) * 100);
    adminSelectedUserProgress.textContent = `Выполнение программы: ${progressPercent}% (${earned}/11 контрольных точек)`;

    // Draw homework details timeline
    adminHwTimeline.innerHTML = '';
    
    const levelHwTitles = {
      1: "ДЗ 1-2: Карточки болей в ресторане",
      2: "ДЗ 3-4: Психология бесплатной диагностики",
      3: "ДЗ 5-6: Отработка возражения «Нет денег»",
      4: "ДЗ 7-8: Схема обхода администратора (ресепшена)",
      5: "ДЗ 9-10: Анализ бутылочного горлышка воронки"
    };

    for (let l = 1; l <= 5; l++) {
      const hw = student.homeworks[l];
      const isCompleted = student.completedLevels.includes(l);
      
      const timelineItem = document.createElement('div');
      timelineItem.className = `timeline-item ${isCompleted ? 'completed' : ''}`;
      
      let badgeClass = 'badge-blue';
      if (hw.status === 'Сдано') badgeClass = 'badge-success';
      else if (hw.status === 'Не сдано') badgeClass = 'badge-blue';

      let statusBadge = `<span class="badge ${badgeClass}" id="admin-hw-badge-${l}">${hw.status}</span>`;

      // Build mock approve/reject controls
      let controlsHtml = '';
      if (hw.status === 'На проверке') {
        controlsHtml = `
          <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;" id="admin-hw-controls-${l}">
            <button class="btn btn-success" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="approveHomework('${email}', ${l})">Одобрить ДЗ</button>
            <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; border-color: var(--danger); color: var(--danger); background: transparent;" onclick="rejectHomework('${email}', ${l})">Отклонить ДЗ</button>
          </div>
        `;
      }

      timelineItem.innerHTML = `
        <div class="timeline-header">
          <span class="timeline-title">${levelHwTitles[l]}</span>
          ${statusBadge}
        </div>
        <div class="timeline-body ${hw.text ? '' : 'empty'}">${hw.text ? escapeHTML(hw.text) : 'Домашнее задание еще не отправлено.'}</div>
        ${controlsHtml}
      `;
      adminHwTimeline.appendChild(timelineItem);
    }
  }

  // Expose review functions to window so they can trigger from HTML inline onclick
  window.approveHomework = function(email, lvl) {
    const student = dbRegistry.users[email];
    if (student) {
      student.homeworks[lvl].status = 'Сдано';
      saveDatabase();
      
      // Re-render
      renderAdminStudentDetails(email);
      renderAdminTraineesList();
      alert(`Домашнее задание пользователя ${email} по уровню ${lvl} принято!`);
    }
  };

  window.rejectHomework = function(email, lvl) {
    const student = dbRegistry.users[email];
    if (student) {
      student.homeworks[lvl].status = 'Не сдано';
      student.homeworks[lvl].text = ''; // Reset text for re-submission
      
      // Remove level from completed
      const idx = student.completedLevels.indexOf(lvl);
      if (idx > -1) {
        student.completedLevels.splice(idx, 1);
      }
      
      saveDatabase();
      
      // Re-render
      renderAdminStudentDetails(email);
      renderAdminTraineesList();
      alert(`Домашнее задание пользователя ${email} по уровню ${lvl} отклонено и сброшено!`);
    }
  };

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Admin export JSON logic
  if (btnAdminExport) {
    btnAdminExport.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbRegistry, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `all_trainees_report_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // Admin database reset
  if (btnAdminReset) {
    btnAdminReset.addEventListener('click', () => {
      if (confirm('ВНИМАНИЕ! Это полностью очистит базу данных и удалит всех менеджеров и их прогресс. Вы действительно хотите сбросить БД?')) {
        localStorage.removeItem(ACCOUNTS_KEY);
        dbRegistry = { users: {} };
        saveDatabase();
        initAdminPanel();
        alert('База данных сброшена!');
      }
    });
  }
});
