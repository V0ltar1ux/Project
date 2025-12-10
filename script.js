document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // LocalStorage keys
  // -------------------------------
  const LS_USERS_KEY = "muffin_users";
  const LS_CURRENT_USER_KEY = "muffin_current_user";

  // -------------------------------
  // Helpers to work with localStorage
  // -------------------------------
  function loadUsers() {
    try {
      const raw = localStorage.getItem(LS_USERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function loadCurrentUser() {
    try {
      const raw = localStorage.getItem(LS_CURRENT_USER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.email ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function saveUsers() {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  }

  function saveCurrentUser() {
    if (currentUser) {
      localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LS_CURRENT_USER_KEY);
    }
  }

  // -------------------------------
  // Users DB in memory + current user
  // -------------------------------
  let users = loadUsers();
  let currentUser = loadCurrentUser();

  // If stored currentUser not in users list -> reset
  if (
    currentUser &&
    !users.find(u => u.email === currentUser.email && u.password === currentUser.password)
  ) {
    currentUser = null;
    saveCurrentUser();
  }

  // Buttons "Заказать" in celebration section
  const orderButtons = document.querySelectorAll(".order-btn");

  // -------------------------------
  // Small helper to escape HTML
  // -------------------------------
  function escapeHtml(str) {
    return String(str).replace(/[&<>\\"']/g, (ch) => {
      switch (ch) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "\"": return "&quot;";
        case "'": return "&#039;";
        default: return ch;
      }
    });
  }

  // -------------------------------
  // Modal helper for nice messages
  // -------------------------------
  const infoModalElement = document.getElementById("infoModal");
  const infoModalTitle = document.getElementById("infoModalTitle");
  const infoModalBody = document.getElementById("infoModalBody");
  const infoModal = infoModalElement ? new bootstrap.Modal(infoModalElement) : null;

  function showInfoModal(title, message) {
    if (!infoModal) {
      alert(message); // запасной вариант, если вдруг модал не найдётся
      return;
    }
    if (infoModalTitle) infoModalTitle.textContent = title;
    if (infoModalBody) infoModalBody.textContent = message;
    infoModal.show();
  }

  // -------------------------------
  // Payment blocks toggling
  // -------------------------------
  function setupOrderPaymentSwitch() {
    const radios = document.querySelectorAll('input[name="orderPayment"]');
    const cardBlock = document.getElementById("orderPaymentCardFields");
    const transferBlock = document.getElementById("orderPaymentTransferFields");

    radios.forEach(r => {
      r.addEventListener("change", () => {
        if (r.value === "card") {
          cardBlock?.classList.remove("d-none");
          transferBlock?.classList.add("d-none");
        } else if (r.value === "transfer") {
          transferBlock?.classList.remove("d-none");
          cardBlock?.classList.add("d-none");
        } else {
          // cash
          cardBlock?.classList.add("d-none");
          transferBlock?.classList.add("d-none");
        }
      });
    });
  }

  function setupPhotoPaymentSwitch() {
    const radios = document.querySelectorAll('input[name="photoPayment"]');
    const cardBlock = document.getElementById("photoPaymentCardFields");
    const transferBlock = document.getElementById("photoPaymentTransferFields");

    radios.forEach(r => {
      r.addEventListener("change", () => {
        if (r.value === "card") {
          cardBlock?.classList.remove("d-none");
          transferBlock?.classList.add("d-none");
        } else if (r.value === "transfer") {
          transferBlock?.classList.remove("d-none");
          cardBlock?.classList.add("d-none");
        } else {
          // cash
          cardBlock?.classList.add("d-none");
          transferBlock?.classList.add("d-none");
        }
      });
    });
  }

  setupOrderPaymentSwitch();
  setupPhotoPaymentSwitch();

  // -------------------------------
  // Toggle "Заказать" buttons availability based on auth
  // -------------------------------
  function updateOrderButtonsState() {
    orderButtons.forEach(btn => {
      if (currentUser) {
        // Authorized — button opens order modal
        btn.setAttribute("data-bs-toggle", "modal");
        btn.setAttribute("data-bs-target", "#orderModal");
      } else {
        // Not authorized — prevent opening order modal
        btn.removeAttribute("data-bs-toggle");
        btn.removeAttribute("data-bs-target");
      }
    });
  }

  // -------------------------------
  // Render auth area in header
  // -------------------------------
  function renderAuthArea() {
    const authArea = document.getElementById("authArea");
    if (!authArea) return;

    if (currentUser) {
      authArea.innerHTML = `
        <span class="me-3 d-none d-sm-inline">Привет, <strong>${escapeHtml(currentUser.name)}</strong></span>
        <button class="btn btn-outline-dark btn-sm" id="logoutBtn">Выход</button>
      `;
      const logoutBtn = document.getElementById("logoutBtn");
      logoutBtn?.addEventListener("click", () => {
        currentUser = null;
        saveCurrentUser();
        renderAuthArea();
        showInfoModal("Выход из аккаунта", "Вы вышли из аккаунта.");
      });
    } else {
      authArea.innerHTML = `
        <button class="btn btn-dark me-2" data-bs-toggle="modal" data-bs-target="#loginModal">Вход</button>
        <button class="btn btn-outline-dark" data-bs-toggle="modal" data-bs-target="#registerModal">Регистрация</button>
      `;
    }

    updateOrderButtonsState();
  }

  renderAuthArea();

    // -------------------------------
    // Кнопка "Зарегистрироваться" внизу модалки входа
    // -------------------------------
    const openRegisterFromLoginBtn = document.getElementById("openRegisterFromLogin");
    openRegisterFromLoginBtn?.addEventListener("click", () => {
      const loginModalEl = document.getElementById("loginModal");
      const registerModalEl = document.getElementById("registerModal");
      if (!loginModalEl || !registerModalEl) return;

      const loginInstance =
        bootstrap.Modal.getInstance(loginModalEl) || new bootstrap.Modal(loginModalEl);
      const registerInstance =
        bootstrap.Modal.getInstance(registerModalEl) || new bootstrap.Modal(registerModalEl);

      loginInstance.hide();
      registerInstance.show();
    });

  // -------------------------------
  // Registration
  // -------------------------------
  const registerForm = document.getElementById("registerForm");
  registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    if (!name || !email || !password) {
      alert("Пожалуйста, заполните все поля регистрации.");
      return;
    }

    if (users.find(u => u.email === email)) {
      alert("Пользователь с таким email уже существует!");
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    saveUsers();

    currentUser = newUser;
    saveCurrentUser();
    renderAuthArea();

    const registerModalInstance = bootstrap.Modal.getInstance(document.getElementById("registerModal"));
    registerModalInstance?.hide();

    registerForm.reset();

    showInfoModal("Регистрация успешна", `Вы вошли как ${name}.`);
  });

  // -------------------------------
  // Login
  // -------------------------------
  const loginForm = document.getElementById("loginForm");
  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      alert("Пожалуйста, заполните email и пароль.");
      return;
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      currentUser = user;
      saveCurrentUser();
      renderAuthArea();

      const loginModalInstance = bootstrap.Modal.getInstance(document.getElementById("loginModal"));
      loginModalInstance?.hide();
      loginForm.reset();

      showInfoModal("Вход выполнен", `Привет, ${user.name}!`);
    } else {
      alert("Неверный email или пароль!");
    }
  });

  // -------------------------------
  // Celebration "Заказать" buttons (require auth)
  // -------------------------------
  orderButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (!currentUser) {
        e.preventDefault();
        const loginModalInstance = new bootstrap.Modal(document.getElementById("loginModal"));
        loginModalInstance.show();
      }
      // If currentUser exists, Bootstrap will open order modal automatically
    });
  });

  // -------------------------------
  // Order modal form
  // -------------------------------
  const orderForm = document.getElementById("orderForm");
  orderForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!currentUser) {
      const loginModalInstance = new bootstrap.Modal(document.getElementById("loginModal"));
      loginModalInstance.show();
      return;
    }

    const name = document.getElementById("orderName").value.trim();
    const phone = document.getElementById("orderPhone").value.trim();
    const qty = document.getElementById("orderQty").value;
    const paymentInput = document.querySelector('input[name="orderPayment"]:checked');

    if (!name || !phone || !qty || !paymentInput) {
      alert("Пожалуйста, заполните все поля и выберите способ оплаты!");
      return;
    }

    const payment = paymentInput.value;
    let paymentDescription = "";

    if (payment === "card") {
      const cardNumber = document.getElementById("orderCardNumber").value.trim();
      const cardExpiry = document.getElementById("orderCardExpiry").value.trim();
      const cardCvv = document.getElementById("orderCardCvv").value.trim();
      const cardName = document.getElementById("orderCardName").value.trim();

      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        alert("Пожалуйста, заполните все данные банковской карты.");
        return;
      }

      paymentDescription = "Банковская карта онлайн";
    } else if (payment === "transfer") {
      const fio = document.getElementById("orderTransferFio").value.trim();
      const bank = document.getElementById("orderTransferBank").value.trim();
      const acc = document.getElementById("orderTransferAccount").value.trim();
      // comment can be empty

      if (!fio || !bank || !acc) {
        alert("Пожалуйста, заполните все обязательные поля для перевода по реквизитам.");
        return;
      }

      paymentDescription = "Перевод по реквизитам";
    } else {
      paymentDescription = "Наличные курьеру";
    }

    const orderModalInstance = bootstrap.Modal.getInstance(document.getElementById("orderModal"));
    orderModalInstance?.hide();
    orderForm.reset();

    showInfoModal("Заказ оформлен", "Ваш заказ принят. Мы свяжемся с вами для подтверждения.");
  });

  // -------------------------------
  // Photo order form
  // -------------------------------
  const photoForm = document.querySelector(".photo-form");
  photoForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!currentUser) {
      const loginModalInstance = new bootstrap.Modal(document.getElementById("loginModal"));
      loginModalInstance.show();
      return;
    }

    const name = photoForm.querySelector('input[type="text"]').value.trim();
    const phone = photoForm.querySelector('input[type="tel"]').value.trim();
    const fileInput = photoForm.querySelector('input[type="file"]');
    const paymentInput = photoForm.querySelector('input[name="photoPayment"]:checked');

    if (!name || !phone || fileInput.files.length === 0 || !paymentInput) {
      alert("Пожалуйста, заполните все поля, загрузите фото и выберите способ оплаты!");
      return;
    }

    const payment = paymentInput.value;

    if (payment === "card") {
      const cardNumber = document.getElementById("photoCardNumber").value.trim();
      const cardExpiry = document.getElementById("photoCardExpiry").value.trim();
      const cardCvv = document.getElementById("photoCardCvv").value.trim();
      const cardName = document.getElementById("photoCardName").value.trim();

      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        alert("Пожалуйста, заполните все данные банковской карты.");
        return;
      }
    } else if (payment === "transfer") {
      const fio = document.getElementById("photoTransferFio").value.trim();
      const bank = document.getElementById("photoTransferBank").value.trim();
      const acc = document.getElementById("photoTransferAccount").value.trim();

      if (!fio || !bank || !acc) {
        alert("Пожалуйста, заполните все обязательные поля для перевода по реквизитам.");
        return;
      }
    }

    const photoSuccessModal = new bootstrap.Modal(document.getElementById("photoOrderSuccessModal"));
    photoSuccessModal.show();
    photoForm.reset();
  });

  // -------------------------------
  // Feedback form (contacts section)
  // -------------------------------
  const feedbackForm = document.getElementById("feedbackForm");
  feedbackForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("fbName").value.trim();
    const email = document.getElementById("fbEmail").value.trim();
    const message = document.getElementById("fbMessage").value.trim();

    if (!name || !email || !message) {
      alert("Пожалуйста, заполните все поля формы обратной связи!");
      return;
    }

    feedbackForm.reset();
    showInfoModal("Сообщение отправлено", "Спасибо! Мы свяжемся с вами в ближайшее время.");
  });

  // -------------------------------
  // Blog "Подробнее" modal
  // -------------------------------
  const blogArticles = {
    kids: {
      title: "5 идей маффинов на детский праздник",
      content: `
        <p>На детском празднике важно, чтобы каждый гость нашёл что-то по вкусу. Попробуйте сделать
        несколько разных вариантов маффинов:</p>
        <ul>
          <li>Нежные ванильные с яркими посыпками;</li>
          <li>Шоколадные маффины с начинкой из карамели;</li>
          <li>Фруктовые маффины с кусочками клубники и банана;</li>
          <li>Мини-маффины для самых маленьких гостей;</li>
          <li>Персональные маффины с именами детей на топперах.</li>
        </ul>
        <p>Комбинируя вкусы и оформление, вы можете превратить десерт в настоящую игру:
        дети выбирают себе маффин «по характеру».</p>
      `
    },
    trends: {
      title: "Тренды оформления капкейков",
      content: `
        <p>Современное оформление капкейков всё больше уходит в сторону минимализма.
        Вот несколько трендов, которые выбирают наши клиенты:</p>
        <ul>
          <li>Пастельные оттенки крема и плавные градиенты;</li>
          <li>Съедобные цветы и сухоцветы;</li>
          <li>Однотонный крем + акцент в виде маленького топпера;</li>
          <li>Комбинация разных фактур: гладкий крем и хрустящие посыпки;</li>
          <li>Персонализированные капкейки с логотипом компании.</li>
        </ul>
        <p>Такие десерты идеально подходят для фотосессий и праздничных столов в стиле «инстаграм».</p>
      `
    },
    storage: {
      title: "Как хранить маффины дома",
      content: `
        <p>Чтобы маффины дольше оставались свежими и мягкими, важно соблюдать несколько простых правил:</p>
        <ul>
          <li>Храните маффины в закрытой коробке или контейнере при комнатной температуре;</li>
          <li>Не ставьте их в холодильник без необходимости — там они быстрее зачерствеют;</li>
          <li>Маффины с кремом лучше держать в прохладном месте, но доставать за 30 минут до подачи;</li>
          <li>Если вы заморозили маффины, размораживайте их естественным образом, при комнатной температуре;</li>
          <li>Не разогревайте десерт в микроволновке слишком долго, чтобы не пересушить.</li>
        </ul>
        <p>При правильном хранении маффины остаются вкусными до 2–3 дней.</p>
      `
    }
  };

  const blogMoreButtons = document.querySelectorAll(".blog-more-btn");
  const blogModalElement = document.getElementById("blogModal");
  const blogModalTitle = document.getElementById("blogModalTitle");
  const blogModalContent = document.getElementById("blogModalContent");
  const blogModal = blogModalElement ? new bootstrap.Modal(blogModalElement) : null;

  blogMoreButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.article;
      const article = blogArticles[key];
      if (!article || !blogModal) return;

      blogModalTitle.textContent = article.title;
      blogModalContent.innerHTML = article.content;
      blogModal.show();
    });
  });

  // -------------------------------
  // Reviews carousel + add new review
  // -------------------------------
  const reviews = [
    {
      name: "Анна",
      subtitle: "Детский день рождения",
      text: "Дети были в восторге, особенно от маффинов в виде единорогов. Всё привезли вовремя и очень аккуратно."
    },
    {
      name: "Максим",
      subtitle: "Офисный праздник",
      text: "Заказали сразу 60 штук. Вкусные, красивые, хватило всем. Отдельное спасибо за быструю доставку."
    },
    {
      name: "Екатерина",
      subtitle: "Заказ по фото",
      text: "Сделали точную копию маффинов с Pinterest. Очень понравился сервис и вежливый оператор."
    }
  ];

  const reviewsCarouselInner = document.getElementById("reviewsCarouselInner");
  const reviewsCarouselElement = document.getElementById("reviewsCarousel");

  function renderReviews() {
    if (!reviewsCarouselInner) return;
    reviewsCarouselInner.innerHTML = "";

    reviews.forEach((r, index) => {
      const item = document.createElement("div");
      item.className = "carousel-item" + (index === 0 ? " active" : "");

      item.innerHTML = `
        <div class="d-flex justify-content-center">
          <div class="review-card p-3 rounded h-100">
            <p class="mb-1 fw-semibold">${escapeHtml(r.name)}</p>
            <p class="text-muted small mb-2">${escapeHtml(r.subtitle || "")}</p>
            <p>${escapeHtml(r.text)}</p>
          </div>
        </div>
      `;
      reviewsCarouselInner.appendChild(item);
    });
  }

  renderReviews();

  const newReviewForm = document.getElementById("newReviewForm");
  newReviewForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("reviewName").value.trim();
    const subtitle = document.getElementById("reviewSubtitle").value.trim();
    const text = document.getElementById("reviewText").value.trim();

    if (!name || !text) {
      alert("Пожалуйста, укажите имя и текст отзыва.");
      return;
    }

    reviews.push({ name, subtitle, text });
    renderReviews();
    newReviewForm.reset();

    if (reviewsCarouselElement) {
      const carousel = bootstrap.Carousel.getInstance(reviewsCarouselElement) ||
                       new bootstrap.Carousel(reviewsCarouselElement);
      carousel.to(reviews.length - 1);
    }

    showInfoModal("Отзыв отправлен", "Спасибо за отзыв!");
  });

  // -------------------------------
  // Back-to-top button
  // -------------------------------
  const backToTopBtn = document.getElementById("backToTopBtn");

  window.addEventListener("scroll", () => {
    if (!backToTopBtn) return;
    if (window.scrollY > 400) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  });

  backToTopBtn?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});
