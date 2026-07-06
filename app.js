// Multi-User Database via LocalStorage
const DB_KEY = 'sales_trainer_db';

// Helper to load database
function loadDB() {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    // Initial seeded structure
    const initial = {
      users: {
        'manager@test.com': {
          email: 'manager@test.com',
          password: 'password', // Test password
          isAdmin: false,
          progress: 0,
          completedLevels: [],
          homeworks: {
            '1': { status: 'submitted', answer: '1. Потери выручки: из-за жары гости сидят не более 20 минут, средний чек падает на 40%, прямые потери около 45 000 руб.\n2. Персонал: повара на кухне работают медленно, путают заказы.\n3. Репутация: гости оставляют плохие отзывы в Яндекс.Картах про духоту.' },
            '2': { status: 'submitted', answer: 'Для банка: «Добрый день! Подскажите имя руководителя административно-хозяйственного отдела, чтобы согласовать плановый замер перегрева процессоров из-за систем кондиционирования?»' },
            '3': { status: 'none', answer: '' },
            '4': { status: 'none', answer: '' },
            '5': { status: 'none', answer: '' }
          }
        }
      }
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

// Helper to save database
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// State
let db = loadDB();
let currentUser = null;

// Auth Tab Switching
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const btnSubmitAuth = document.getElementById('btnSubmitAuth');
let authMode = 'login'; // 'login' or 'register'

tabLoginBtn.addEventListener('click', () => {
  authMode = 'login';
  tabLoginBtn.classList.add('active');
  tabRegisterBtn.classList.remove('active');
  btnSubmitAuth.innerText = 'Войти в систему';
});

tabRegisterBtn.addEventListener('click', () => {
  authMode = 'register';
  tabRegisterBtn.classList.add('active');
  tabLoginBtn.classList.remove('active');
  btnSubmitAuth.innerText = 'Зарегистрироваться';
});

// Authentication handlers
const authForm = document.getElementById('authForm');
const authOverlay = document.getElementById('authOverlay');
const authError = document.getElementById('authError');
const userEmailSpan = document.getElementById('userEmailSpan');

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  
  if (!email || !password) return;

  // Check if supervisor login
  if (email === 'sultan.marketing.dubai@gmail.com' && password === '312312312') {
    // Admin login success
    currentUser = { email, isAdmin: true };
    authOverlay.classList.remove('active');
    authError.innerText = '';
    authError.style.display = 'none';
    showAdminDashboard();
    return;
  }

  db = loadDB(); // reload fresh state

  if (authMode === 'login') {
    const user = db.users[email];
    if (user && user.password === password) {
      currentUser = user;
      authOverlay.classList.remove('active');
      authError.innerText = '';
      authError.style.display = 'none';
      initializeTraineeDashboard();
    } else {
      authError.innerText = 'Неверный email или пароль';
      authError.style.display = 'block';
    }
  } else {
    // Register
    if (db.users[email]) {
      authError.innerText = 'Пользователь с таким email уже существует';
      authError.style.display = 'block';
    } else {
      const newUser = {
        email: email,
        password: password,
        isAdmin: false,
        progress: 0,
        completedLevels: [],
        homeworks: {
          '1': { status: 'none', answer: '' },
          '2': { status: 'none', answer: '' },
          '3': { status: 'none', answer: '' },
          '4': { status: 'none', answer: '' },
          '5': { status: 'none', answer: '' }
        }
      };
      db.users[email] = newUser;
      saveDB(db);
      currentUser = newUser;
      authOverlay.classList.remove('active');
      authError.innerText = '';
      authError.style.display = 'none';
      initializeTraineeDashboard();
    }
  }
});

// Logout handler
document.getElementById('btnLogOut').addEventListener('click', () => {
  currentUser = null;
  document.getElementById('authEmail').value = '';
  document.getElementById('authPassword').value = '';
  authOverlay.classList.add('active');
  document.getElementById('traineeView').style.display = 'none';
  document.getElementById('adminView').style.display = 'none';
  document.getElementById('appSidebar').style.display = 'flex';
});

// Level selector navigation
const levelNavItems = document.querySelectorAll('.level-nav-item');
let activeLevel = 1;

levelNavItems.forEach(item => {
  item.addEventListener('click', () => {
    if (item.classList.contains('locked')) return;
    const lvl = parseInt(item.getAttribute('data-level'));
    switchLevel(lvl);
  });
});

function switchLevel(lvl) {
  activeLevel = lvl;
  // Update nav UI active class
  levelNavItems.forEach(item => {
    if (parseInt(item.getAttribute('data-level')) === lvl) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch content section visible
  document.querySelectorAll('.level-section').forEach(sec => {
    sec.classList.remove('active');
  });
  document.getElementById(`level-${lvl}`).classList.add('active');

  // Update header text
  const levelTitles = {
    1: 'Уровень 1: Боли и Экономика Потерь',
    2: 'Уровень 2: Обход секретаря & Сценарии звонков',
    3: 'Уровень 3: Психология Возражений',
    4: 'Уровень 4: Ведение CRM-системы',
    5: 'Уровень 5: Аналитика и Финал'
  };
  const levelDays = {
    1: 'Дни 1-2 программы обучения',
    2: 'Дни 3-4 программы обучения',
    3: 'Дни 5-6 программы обучения',
    4: 'Дни 7-8 программы обучения',
    5: 'Дни 9-10 программы обучения'
  };
  document.getElementById('headerLevelTitle').innerText = levelTitles[lvl];
  document.getElementById('headerLevelDays').innerText = levelDays[lvl];

  // Specific content initialization per level if needed
  if (lvl === 2) {
    initPhoneSimulator();
  }
}

// Update sidebar status locks based on current user progress
function updateSidebarLocks() {
  db = loadDB();
  const user = db.users[currentUser.email];
  if (!user) return;

  // Complete Levels: Let's unlock sequentially
  // If Level X completed, unlock X+1
  levelNavItems.forEach(item => {
    const lvl = parseInt(item.getAttribute('data-level'));
    if (lvl === 1) {
      item.classList.remove('locked');
      item.removeAttribute('disabled');
    } else {
      // Unlock if previous level is in completed list
      const prevCompleted = user.completedLevels.includes(lvl - 1);
      if (prevCompleted) {
        item.classList.remove('locked');
        item.removeAttribute('disabled');
        const lockIcon = item.querySelector('.lock-badge');
        if (lockIcon) lockIcon.style.display = 'none';
      } else {
        item.classList.add('locked');
        item.setAttribute('disabled', 'true');
        const lockIcon = item.querySelector('.lock-badge');
        if (lockIcon) lockIcon.style.display = 'block';
      }
    }

    // Set checkmark if completed
    if (user.completedLevels.includes(lvl)) {
      item.classList.add('completed');
      item.querySelector('.level-status-icon').innerText = '✓';
    } else {
      item.classList.remove('completed');
      item.querySelector('.level-status-icon').innerText = lvl;
    }
  });

  // Update progress bar
  const pct = user.progress || 0;
  document.getElementById('progressBar').style.width = `${pct}%`;
  document.getElementById('progressText').innerText = `${pct}% выполнено`;

  // Render homework statuses
  for (let i = 1; i <= 5; i++) {
    const hw = user.homeworks[i.toString()];
    const badge = document.getElementById(`hwStatus-${i}`);
    const textarea = document.getElementById(`hwInput-${i}`);
    const submitBtn = document.getElementById(`btnSubmit-${i}`);
    
    if (badge && hw) {
      if (hw.status === 'none') {
        badge.innerHTML = '<span class="badge badge-blue">Не сдано</span>';
        if (textarea) textarea.value = '';
        if (submitBtn) submitBtn.disabled = false;
      } else if (hw.status === 'submitted') {
        badge.innerHTML = '<span class="badge badge-cyan">На проверке куратором</span>';
        if (textarea) textarea.value = hw.answer;
        if (submitBtn) submitBtn.disabled = true;
      } else if (hw.status === 'accepted') {
        badge.innerHTML = '<span class="badge badge-success">Зачтено куратором</span>';
        if (textarea) textarea.value = hw.answer;
        if (submitBtn) submitBtn.disabled = true;
      }
    }
  }
}

// Trainee panel homework submit
for (let i = 1; i <= 5; i++) {
  const submitBtn = document.getElementById(`btnSubmit-${i}`);
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const text = document.getElementById(`hwInput-${i}`).value.trim();
      if (!text) {
        alert('Пожалуйста, напишите ответ перед отправкой.');
        return;
      }

      db = loadDB();
      const user = db.users[currentUser.email];
      user.homeworks[i.toString()] = {
        status: 'submitted',
        answer: text
      };
      
      // Calculate progress increment: submitting homework increases progress
      // Let's say completing a level fully (homework accepted + quiz done) sets progress.
      // We will let the Admin mark it as "accepted", which unlocks the next level!
      saveDB(db);
      updateSidebarLocks();
      alert('Домашнее задание успешно отправлено куратору на проверку!');
    });
  }
}

// Initializing Trainee view
function initializeTraineeDashboard() {
  document.getElementById('traineeView').style.display = 'flex';
  document.getElementById('adminView').style.display = 'none';
  document.getElementById('appSidebar').style.display = 'flex';
  userEmailSpan.innerText = currentUser.email;
  updateSidebarLocks();
  switchLevel(1);
  initMatchingGame();
  initCrmSimulator();
  initQuizObjections();
  initFinalExam();
}


// ================= LEVEL 1: MATCHING GAME =================
function initMatchingGame() {
  const sourceCards = document.getElementById('sourceCards');
  const targetCafe = document.getElementById('target-cafe');
  const targetBank = document.getElementById('target-bank');

  // Reset columns
  targetCafe.innerHTML = '';
  targetBank.innerHTML = '';
  
  // Drag & drop handlers
  const matchItems = document.querySelectorAll('.match-item');
  matchItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.id);
      item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });

    // Mobile tap matching support
    item.addEventListener('click', () => {
      // Clear previous selection
      matchItems.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
  });

  const targets = [targetCafe, targetBank];
  targets.forEach(target => {
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
      const id = e.dataTransfer.getData('text/plain');
      const element = document.getElementById(id);
      if (!element) return;
      
      handleMatchPlacement(element, target);
    });

    // Mobile click target support
    target.addEventListener('click', () => {
      const selected = document.querySelector('.match-item.selected');
      if (selected) {
        handleMatchPlacement(selected, target);
        selected.classList.remove('selected');
      }
    });
  });

  function handleMatchPlacement(item, targetCol) {
    const category = item.getAttribute('data-category');
    const targetType = targetCol.getAttribute('data-target');

    if (category === targetType) {
      // Correct Match
      targetCol.appendChild(item);
      item.classList.add('matched-success');
      item.draggable = false;
      checkMatchingComplete();
    } else {
      // Incorrect Match
      item.style.borderColor = 'var(--danger)';
      setTimeout(() => {
        item.style.borderColor = 'var(--border-color)';
      }, 1000);
    }
  }

  function checkMatchingComplete() {
    const totalMatched = document.querySelectorAll('.matched-success').length;
    if (totalMatched === 6) {
      alert('Прекрасно! Все экономические боли распределены абсолютно верно.');
      // Auto save progress for level 1 quiz part
      db = loadDB();
      const u = db.users[currentUser.email];
      if (!u.completedLevels.includes(1)) {
        // level 1 unlocked by homework verification eventually, but matching game is complete
      }
    }
  }
}


// ================= LEVEL 2: 2-STAGE PHONE SIMULATOR =================
let simStage = 1; // 1 = Gatekeeper, 2 = LPR (Igor)
let simStep = 0;
const simChatArea = document.getElementById('simChatArea');
const simChoicesArea = document.getElementById('simChoicesArea');
const btnResetSim = document.getElementById('btnResetSim');
const simContactName = document.getElementById('simContactName');
const simContactTitle = document.getElementById('simContactTitle');
const simAvatar = document.getElementById('simAvatar');

const dialogData = {
  stage1: [
    {
      text: "Ресторан «Палермо», здравствуйте! Меня зовут Алина. Чем могу помочь?",
      sender: "client",
      choices: [
        {
          text: "Здравствуйте! Я хочу предложить обслуживание кондиционеров со скидкой для ресторанов.",
          nextStep: 99, // Failure state
          reply: "Ой, извините, нам ничего не нужно. До свидания!"
        },
        {
          text: "Здравствуйте, позовите пожалуйста управляющего к телефону.",
          nextStep: 1,
          reply: "А по какому вопросу? Управляющий занят, если вы с коммерческим предложением — отправьте на почту info@palermo.ru."
        },
        {
          text: "Алина, добрый день! Подскажите, с кем я могу согласовать плановые замеры давления фреона и аудит вытяжки перед пиком жары?",
          nextStep: 2, // Success transition
          reply: "Ой... ну это технические дела. Вам нужно поговорить с управляющим. Его зовут Игорь. Секунду, переключаю на него..."
        }
      ]
    },
    {
      // Step 1: Asked for manager directly but rejected
      text: "А по какому вопросу? Управляющий занят, если вы с коммерческим предложением — отправьте на почту info@palermo.ru.",
      sender: "client",
      choices: [
        {
          text: "Хорошо, отправлю на почту. До свидания.",
          nextStep: 99,
          reply: "До свидания!"
        },
        {
          text: "Алина, отправлю обязательно. Но подскажите, с кем я могу согласовать плановый замер перегрева фреона перед жарой? Это не коммерческое, а технический регламент.",
          nextStep: 2, // Recover to success transition
          reply: "А, поняла. Секунду, переключаю на Игоря (управляющий)."
        }
      ]
    }
  ],
  stage2: [
    {
      text: "Да, алло. Игорь у телефона. По какому вопросу?",
      sender: "client",
      choices: [
        {
          text: "Игорь, здравствуйте! Хотим предложить вам услуги по ремонту кондиционеров «Климат Севера».",
          nextStep: 99, // Failure
          reply: "У нас есть мастера, которые всё чинят. Ничего не нужно. Всего хорошего!"
        },
        {
          text: "Игорь, здравствуйте! Мы занимаемся промышленным климатом ресторанов. На этой неделе бесплатно проводим замер давления фреона и аудит вытяжки для кафе в вашем районе. Зал у вас большой, если кондиционер в субботу встанет — потеряете до 60 000 рублей выручки за день из-за духоты. Наш инженер будет рядом в среду, сделает замеры бесплатно. Согласуем выезд?",
          nextStep: 3, // Success continue
          reply: "Бесплатно? Хм... А в чём ваш интерес? Бесплатный сыр только в мышеловке."
        }
      ]
    },
    {
      // Step 3: Interest sparked, handling suspicion
      text: "Бесплатно? Хм... А в чём ваш интерес? Бесплатный сыр только в мышеловке.",
      sender: "client",
      choices: [
        {
          text: "Мы надеемся, что вам понравится наша работа и в будущем вы заключите с нами договор на постоянное обслуживание.",
          nextStep: 4,
          reply: "Ну, постоянный договор мне пока не нужен. У меня есть дядя Вася, он чистит если что."
        },
        {
          text: "Интерес простой — мы расширяем клиентскую базу ресторанов. Диагностика ни к чему вас не обязывает, но мы выдадим вам официальный дефектный акт. С ним вы сможете проверить работу ваших текущих мастеров. Если всё идеально — мы пожмем руки. Если есть критическая утечка фреона — вы узнаете об этом заранее, а не когда потекут слезы поваров на кухне. В среду в 14:00 удобно принять инженера Петра?",
          nextStep: 5, // Close Deal!
          reply: "Логично. Хорошо, давайте проверим кондиционеры. Дядя Вася давно не заглядывал. Записывайте адрес: ул. Ленина, д. 12..."
        }
      ]
    },
    {
      // Step 4: Responded with direct sale pitch (Dauding)
      text: "Ну, постоянный договор мне пока не нужен. У меня есть дядя Вася, он чистит если что.",
      sender: "client",
      choices: [
        {
          text: "Понял. Если дядя Вася не справится — звоните. Всего доброго.",
          nextStep: 99,
          reply: "Да, хорошо. До свидания."
        },
        {
          text: "Игорь, отлично, когда есть проверенный мастер! Но Петр приедет со специальным тепловизором и газоанализатором. Мы снимем точные параметры перегрева компрессора. Это бесплатно, а для вашего мастера будет готовый чек-лист. В среду в 14:00 отправим инженера?",
          nextStep: 5, // Recovery to success close
          reply: "Ладно, уговорили, пусть посмотрит. Адрес: ул. Ленина, д. 12, ресторан «Палермо»."
        }
      ]
    }
  ]
};

function initPhoneSimulator() {
  simStage = 1;
  simStep = 0;
  simContactName.innerText = "Алина (Хостес / Секретарь)";
  simContactTitle.innerText = "Ресторан «Палермо» (Этап 1: Обход секретаря)";
  simAvatar.innerText = "А";
  simAvatar.style.background = "var(--border-color)";
  simChatArea.innerHTML = '';
  simChoicesArea.innerHTML = '';
  btnResetSim.style.display = 'none';
  document.getElementById('simStatus').innerText = "Разговор начат...";

  renderDialogStep();
}

function renderDialogStep() {
  simChoicesArea.innerHTML = '';

  let currentDialog;
  if (simStage === 1) {
    currentDialog = dialogData.stage1[simStep];
  } else {
    currentDialog = dialogData.stage2[simStep];
  }

  if (!currentDialog) return;

  // Render client text
  addChatBubble(currentDialog.text, 'client');

  // Render choices
  currentDialog.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = choice.text;
    btn.addEventListener('click', () => {
      handleChoiceSelection(choice);
    });
    simChoicesArea.appendChild(btn);
  });
}

function addChatBubble(text, sender) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerText = text;
  simChatArea.appendChild(bubble);
  simChatArea.scrollTop = simChatArea.scrollHeight;
}

function handleChoiceSelection(choice) {
  // Disable options during animation
  simChoicesArea.innerHTML = '';

  // Add manager's answer
  addChatBubble(choice.text, 'manager');

  setTimeout(() => {
    // Add client reply
    addChatBubble(choice.reply, 'client');

    setTimeout(() => {
      if (choice.nextStep === 99) {
        // Failure
        addChatBubble("🔴 РАЗГОВОР ПРЕРВАН. КЛИЕНТ ПОВЕСИЛ ТРУБКУ.", "client");
        document.getElementById('simStatus').innerText = "Ошибка в диалоге!";
        btnResetSim.style.display = 'block';
      } else if (choice.nextStep === 2) {
        // Success of Stage 1, transition to Stage 2
        simStage = 2;
        simStep = 0;
        simContactName.innerText = "Игорь (Управляющий)";
        simContactTitle.innerText = "Ресторан «Палермо» (Этап 2: Закрытие ЛПР)";
        simAvatar.innerText = "И";
        simAvatar.style.background = "rgba(0, 240, 255, 0.2)";
        addChatBubble("📞 ИДЕТ ПЕРЕАДРЕСАЦИЯ ЗВОНКА НА УПРАВЛЯЮЩЕГО...", "manager");
        setTimeout(() => {
          renderDialogStep();
        }, 1500);
      } else if (choice.nextStep === 5) {
        // Success of Stage 2, complete simulator!
        addChatBubble("🎉 ОТЛИЧНО! ВСТРЕЧА СОГЛАСОВАНА. ЗАПИСЬ ДОБАВЛЕНА В CRM.", "manager");
        document.getElementById('simStatus').innerText = "Диалог успешно завершен!";
        
        // Auto mark Level 2 simulator complete in state
        db = loadDB();
        const u = db.users[currentUser.email];
        // progress tracking logic
        saveDB(db);
        btnResetSim.innerText = "Пройти симулятор еще раз";
        btnResetSim.style.display = 'block';
      } else {
        // Continue within stage
        if (simStage === 1) {
          simStep = choice.nextStep;
        } else {
          // Adjust index for Stage 2 list mapping
          // nextStep for Stage 2 maps index: 3 -> index 1, 4 -> index 2
          simStep = choice.nextStep - 2;
        }
        renderDialogStep();
      }
    }, 800);
  }, 600);
}

btnResetSim.addEventListener('click', () => {
  initPhoneSimulator();
});


// ================= LEVEL 3: QUIZ OBJECTIONS =================
function initQuizObjections() {
  const options = document.querySelectorAll('#quizObjectionOptions .quiz-option');
  const feedback = document.getElementById('quizObjectionFeedback');

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      // Remove classes
      options.forEach(o => {
        o.classList.remove('correct', 'incorrect');
        o.classList.add('disabled');
      });

      const isCorrect = opt.getAttribute('data-correct') === 'true';
      if (isCorrect) {
        opt.classList.add('correct');
        feedback.innerText = '✨ Абсолютно верно! Вы присоединились к клиенту, похвалили его мастера («проявили уважение»), а затем предложили бесплатный независимый аудит как пользу для его же бизнеса.';
        feedback.className = 'quiz-feedback correct show';
      } else {
        opt.classList.add('incorrect');
        feedback.innerText = '❌ Неверно. Это агрессивный или пассивный ответ. Наша задача — мягко обойти мастера дядю Васю, не критикуя его, а предложив бесплатную техническую ценность.';
        feedback.className = 'quiz-feedback incorrect show';
        
        // Reset after 3 seconds to try again
        setTimeout(() => {
          options.forEach(o => {
            o.classList.remove('correct', 'incorrect', 'disabled');
          });
          feedback.classList.remove('show');
        }, 3000);
      }
    });
  });
}


// ================= LEVEL 4: CRM DRAG AND DROP =================
function initCrmSimulator() {
  const dealCard = document.getElementById('crm-deal-1');
  const columns = document.querySelectorAll('.crm-column');
  const scheduler = document.getElementById('crmScheduler');

  if (!dealCard) return;

  dealCard.addEventListener('dragstart', () => {
    dealCard.classList.add('dragging');
  });

  dealCard.addEventListener('dragend', () => {
    dealCard.classList.remove('dragging');
  });

  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('dragover');
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('dragover');
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('dragover');
      const draggingCard = document.querySelector('.crm-deal-card.dragging');
      if (draggingCard) {
        moveCrmCard(draggingCard, col);
      }
    });
    
    // Tap to move support for mobile
    col.addEventListener('click', () => {
      const selected = document.querySelector('.crm-deal-card.selected');
      if (selected) {
        moveCrmCard(selected, col);
        selected.classList.remove('selected');
      }
    });
  });

  dealCard.addEventListener('click', (e) => {
    e.stopPropagation();
    dealCard.classList.toggle('selected');
  });

  function moveCrmCard(card, column) {
    column.appendChild(card);
    const status = column.getAttribute('data-status');
    
    // Update counts
    document.getElementById('crmCountCold').innerText = document.getElementById('crm-col-cold').querySelectorAll('.crm-deal-card').length;
    document.getElementById('crmCountDiag').innerText = document.getElementById('crm-col-diag').querySelectorAll('.crm-deal-card').length;

    if (status === 'diag') {
      // Trigger task scheduler popup
      scheduler.classList.add('active');
    } else {
      scheduler.classList.remove('active');
    }
  }

  // Task scheduler handlers
  const btnSaveTask = document.getElementById('btnSaveTask');
  const btnCancelTask = document.getElementById('btnCancelTask');

  btnSaveTask.addEventListener('click', () => {
    const type = document.getElementById('taskType').value;
    const time = document.getElementById('taskTime').value;
    const text = document.getElementById('taskText').value.trim();

    if (!type || !time || !text) {
      alert('Пожалуйста, заполните все поля регламента задачи!');
      return;
    }

    if (type === 'call' && time === '2h') {
      alert('✅ Отлично! Задача создана по регламенту. Теперь сделка переведена на этап «Назначена диагностика», а система напомнит вам написать клиенту за 2 часа до приезда инженера.');
      scheduler.classList.remove('active');
      document.getElementById('taskType').value = '';
      document.getElementById('taskTime').value = '';
      document.getElementById('taskText').value = '';
    } else {
      alert('❌ Ошибка регламента! По правилам «Климат Севера», вы должны поставить тип задачи «Звонок / WhatsApp (Напомнить о встрече)» и выбрать срок «За 2 часа до выезда инженера». Исправьте настройки задачи.');
    }
  });

  btnCancelTask.addEventListener('click', () => {
    // Reset deal card position
    document.getElementById('crm-col-cold').appendChild(dealCard);
    document.getElementById('crmCountCold').innerText = '1';
    document.getElementById('crmCountDiag').innerText = '0';
    scheduler.classList.remove('active');
  });
}


// ================= LEVEL 5: WHATSAPP MESSAGE & EXAM =================
const btnCheckWaMessage = document.getElementById('btnCheckWaMessage');
btnCheckWaMessage.addEventListener('click', () => {
  const text = document.getElementById('waMessageText').value.trim();
  const feedback = document.getElementById('waFeedback');

  if (!text) {
    alert('Напишите сообщение перед проверкой.');
    return;
  }

  // Keywords checking for advanced salesman presentation
  const hasGreeting = text.includes('Добрый') || text.includes('Здравствуйте');
  const hasPrice = text.includes('8 500');
  const hasRisk = text.includes('75 000') || text.includes('сгорит') || text.includes('компрессор');
  const hasAction = text.includes('Согласуем') || text.includes('Когда') || text.includes('удобно');

  if (hasGreeting && hasPrice && hasRisk && hasAction) {
    feedback.innerText = '✨ Отличный скрипт! Вы поприветствовали клиента, четко противопоставили профилактику за 8 500 рублей риску потерять 75 000 рублей на замену сгоревшего компрессора и сделали призыв к действию. Это продажа ценности!';
    feedback.className = 'quiz-feedback correct show';
  } else {
    let missing = [];
    if (!hasGreeting) missing.push('Приветствие (Ирина, добрый день!)');
    if (!hasPrice) missing.push('Цена обслуживания (8 500 руб.)');
    if (!hasRisk) missing.push('Риск потери/замены компрессора (75 000 руб.)');
    if (!hasAction) missing.push('Призыв к действию (Когда прислать мастера?)');

    feedback.innerText = `❌ Сообщение недостаточно убедительно. Пропущенные элементы продажника: ${missing.join(', ')}. Попробуйте доработать скрипт!`;
    feedback.className = 'quiz-feedback incorrect show';
  }
});

// Final Exam
function initFinalExam() {
  const btnSubmitExam = document.getElementById('btnSubmitExam');
  const examFeedback = document.getElementById('examFeedback');

  // Handle option select highlighting
  const qBlocks = document.querySelectorAll('.quiz-question-block');
  qBlocks.forEach(block => {
    const opts = block.querySelectorAll('.quiz-option');
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('correct', 'incorrect', 'selected-val'));
        opt.classList.add('selected-val');
        
        // Visual indicator
        opts.forEach(o => {
          o.querySelector('.option-dot').style.borderColor = 'var(--text-muted)';
          o.querySelector('.option-dot').style.background = 'transparent';
        });
        opt.querySelector('.option-dot').style.borderColor = 'var(--accent-cyan)';
        opt.querySelector('.option-dot').style.background = 'var(--accent-cyan)';
      });
    });
  });

  btnSubmitExam.addEventListener('click', () => {
    let score = 0;
    let totalQuestions = 3;
    let allSelected = true;

    const selections = {};
    qBlocks.forEach(block => {
      const qId = block.querySelector('.quiz-options').getAttribute('data-question');
      const selectedOpt = block.querySelector('.quiz-option.selected-val');
      if (!selectedOpt) {
        allSelected = false;
      } else {
        selections[qId] = selectedOpt;
      }
    });

    if (!allSelected) {
      alert('Пожалуйста, выберите ответы на все вопросы экзамена!');
      return;
    }

    // Check answers
    Object.keys(selections).forEach(qId => {
      const opt = selections[qId];
      const isCorrect = opt.getAttribute('data-correct') === 'true';
      if (isCorrect) {
        score++;
        opt.classList.add('correct');
      } else {
        opt.classList.add('incorrect');
      }
    });

    if (score === totalQuestions) {
      examFeedback.innerText = '🏆 ПОЗДРАВЛЯЕМ! Вы сдали итоговый экзамен на 100%. Ваша квалификация «Суперпродажник Климата» подтверждена. Теперь отправьте домашнее задание Уровня 5 куратору для финальной верификации.';
      examFeedback.className = 'quiz-feedback correct show';
    } else {
      examFeedback.innerText = `❌ Вы ответили верно на ${score} из ${totalQuestions} вопросов. Ознакомьтесь с теорией разделов заново и пройдите тест повторно.`;
      examFeedback.className = 'quiz-feedback incorrect show';
    }
  });
}


// ================= SUPERVISOR DASHBOARD (ADMIN) =================
const adminUsersContainer = document.getElementById('adminUsersContainer');
const adminDetailsCard = document.getElementById('adminDetailsCard');
const adminDetailsPlaceholder = document.getElementById('adminDetailsPlaceholder');
const adminDetailsContent = document.getElementById('adminDetailsContent');
const adminSelectedUserEmail = document.getElementById('adminSelectedUserEmail');
const adminSelectedUserProgress = document.getElementById('adminSelectedUserProgress');
const adminHwTimeline = document.getElementById('adminHwTimeline');

function showAdminDashboard() {
  document.getElementById('traineeView').style.display = 'none';
  document.getElementById('adminView').style.display = 'flex';
  document.getElementById('appSidebar').style.display = 'flex';
  userEmailSpan.innerText = 'Куратор (Админ)';
  renderAdminUsersList();
}

function renderAdminUsersList() {
  db = loadDB();
  adminUsersContainer.innerHTML = '';
  const emails = Object.keys(db.users);
  
  document.getElementById('adminUsersCount').innerText = emails.length;

  emails.forEach(email => {
    const user = db.users[email];
    const div = document.createElement('div');
    div.className = 'student-item';
    div.innerHTML = `
      <div class="student-meta">
        <span class="student-email">${email}</span>
        <div class="student-progress-row">
          <span>Прогресс</span>
          <span>${user.progress}%</span>
        </div>
        <div class="student-bar-outer">
          <div class="student-bar-inner" style="width: ${user.progress}%"></div>
        </div>
      </div>
    `;
    div.addEventListener('click', () => {
      document.querySelectorAll('.student-item').forEach(x => x.classList.remove('active'));
      div.classList.add('active');
      showStudentDetails(email);
    });
    adminUsersContainer.appendChild(div);
  });
}

function showStudentDetails(email) {
  db = loadDB();
  const user = db.users[email];
  if (!user) return;

  adminDetailsPlaceholder.style.display = 'none';
  adminDetailsContent.style.display = 'block';

  adminSelectedUserEmail.innerText = email;
  adminSelectedUserProgress.innerText = `Прогресс: ${user.progress}%`;

  adminHwTimeline.innerHTML = '';

  for (let i = 1; i <= 5; i++) {
    const hw = user.homeworks[i.toString()];
    const div = document.createElement('div');
    
    // Status display
    let statusText = 'Не приступал';
    let isCompletedClass = '';
    let btnHtml = '';

    if (hw && hw.status === 'submitted') {
      statusText = 'На проверке';
      btnHtml = `
        <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
          <button class="btn btn-success" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="acceptHomework('${email}', ${i})">Принять ДЗ</button>
          <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; color: var(--danger);" onclick="rejectHomework('${email}', ${i})">Отклонить</button>
        </div>
      `;
    } else if (hw && hw.status === 'accepted') {
      statusText = 'Зачтено';
      isCompletedClass = 'completed';
    }

    div.className = `timeline-item ${isCompletedClass}`;
    div.innerHTML = `
      <div class="timeline-header">
        <span class="timeline-title">Домашнее задание Уровень ${i}</span>
        <span class="badge ${hw && hw.status === 'accepted' ? 'badge-success' : 'badge-blue'}">${statusText}</span>
      </div>
      <div class="timeline-body ${!hw || !hw.answer ? 'empty' : ''}">
        ${hw && hw.answer ? hw.answer : 'Студент еще не написал ответ на это задание.'}
      </div>
      ${btnHtml}
    `;
    adminHwTimeline.appendChild(div);
  }
}

// Global functions for admin action calls
window.acceptHomework = function(email, level) {
  db = loadDB();
  const user = db.users[email];
  if (!user) return;

  // Accept homework
  user.homeworks[level.toString()].status = 'accepted';
  
  // Unlock level and add progress
  if (!user.completedLevels.includes(level)) {
    user.completedLevels.push(level);
  }
  
  // Calculate progress: 20% per level accepted
  user.progress = user.completedLevels.length * 20;

  saveDB(db);
  showStudentDetails(email);
  renderAdminUsersList();
};

window.rejectHomework = function(email, level) {
  db = loadDB();
  const user = db.users[email];
  if (!user) return;

  // Reject back to empty
  user.homeworks[level.toString()].status = 'none';
  user.homeworks[level.toString()].answer = '';

  // Remove from completed if it was there
  user.completedLevels = user.completedLevels.filter(x => x !== level);
  user.progress = user.completedLevels.length * 20;

  saveDB(db);
  showStudentDetails(email);
  renderAdminUsersList();
};

// Admin Export Database JSON
document.getElementById('btnAdminExport').addEventListener('click', () => {
  db = loadDB();
  const jsonStr = JSON.stringify(db, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `progress_report_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Admin Reset database
document.getElementById('btnAdminReset').addEventListener('click', () => {
  if (confirm('Вы уверены, что хотите полностью сбросить базу данных? Все студенты и их ответы будут удалены!')) {
    localStorage.removeItem(DB_KEY);
    db = loadDB();
    renderAdminUsersList();
    adminDetailsPlaceholder.style.display = 'block';
    adminDetailsContent.style.display = 'none';
    alert('База данных успешно сброшена.');
  }
});
