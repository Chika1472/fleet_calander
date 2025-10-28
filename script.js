document.addEventListener("DOMContentLoaded", () => {
  const calendarEl = document.getElementById("calendar");
  const workspace = document.getElementById("workspace");
  const heroSection = document.querySelector(".hero");
  const detailModal = document.getElementById("detail-modal");
  const closePanelButton = detailModal?.querySelector("#close-panel");
  const form = document.getElementById("event-form");
  const startInput = document.getElementById("start");
  const endInput = document.getElementById("end");
  const fleetInput = document.getElementById("fleet");
  const doctrineInput = document.getElementById("doctrine");
  const handoutInput = document.getElementById("handout");
  const addEventButton = document.getElementById("add-event");
  const statusEl = document.getElementById("status");
  const summaryCard = document.getElementById("summary-card");
  const summaryBody = summaryCard.querySelector(".summary-body");

  let selection = null;
  let ignoreSelect = false;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    locale: "ko",
    slotMinTime: "06:00:00",
    slotMaxTime: "24:00:00",
    selectable: true,
    selectMirror: true,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
    },
    select(info) {
      if (ignoreSelect) {
        ignoreSelect = false;
        return;
      }
      prepareSelection(info.start, info.end);
      openPanel();
    },
    dateClick(info) {
      const start = info.date;
      const end = info.allDay
        ? new Date(start.getTime() + 24 * 60 * 60 * 1000)
        : new Date(start.getTime() + 60 * 60 * 1000);

      prepareSelection(start, end);
      openPanel();

      ignoreSelect = true;
      calendar.select({
        start,
        end,
        allDay: info.allDay
      });
    },
    eventClick(info) {
      info.jsEvent.preventDefault();
      const event = info.event;
      renderSummary({
        title: event.title,
        start: event.start,
        end: event.end,
        extendedProps: event.extendedProps
      });
    }
  });

  calendar.render();

  if (closePanelButton) {
    closePanelButton.addEventListener("click", () => {
      closePanel();
    });
  }

  detailModal?.addEventListener("click", (event) => {
    if (event.target === detailModal) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailModal && !detailModal.hidden) {
      closePanel();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selection) {
      statusEl.textContent = "캘린더에서 날짜와 시간을 먼저 선택해주세요.";
      return;
    }

    const eventData = {
      title: `${fleetInput.value.trim()} | ${doctrineInput.value.trim()}`,
      start: selection.start,
      end: selection.end,
      extendedProps: {
        fleet: fleetInput.value.trim(),
        doctrine: doctrineInput.value.trim(),
        handout: handoutInput.value
      }
    };

    calendar.addEvent(eventData);
    calendar.unselect();
    selection = null;
    addEventButton.disabled = true;

    renderSummary(eventData);
    statusEl.textContent = "일정이 추가되었습니다. 아래 요약을 확인하세요.";

    form.reset();
    startInput.value = "";
    endInput.value = "";
  });

  function formatDateTime(date) {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function openPanel() {
    if (!detailModal) {
      return;
    }

    if (detailModal.hidden) {
      detailModal.hidden = false;
      requestAnimationFrame(() => {
        detailModal.classList.add("is-visible");
      });
    } else {
      detailModal.classList.add("is-visible");
    }

    detailModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    workspace?.setAttribute("aria-hidden", "true");
    heroSection?.setAttribute("aria-hidden", "true");

    window.setTimeout(() => {
      fleetInput?.focus();
    }, 200);
  }

  function closePanel() {
    if (!detailModal) {
      return;
    }

    detailModal.classList.remove("is-visible");
    detailModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    workspace?.removeAttribute("aria-hidden");
    heroSection?.removeAttribute("aria-hidden");

    setTimeout(() => {
      detailModal.hidden = true;
    }, 280);

    selection = null;
    calendar.unselect();
    addEventButton.disabled = true;
    form.reset();
    startInput.value = "";
    endInput.value = "";
    statusEl.textContent = "";
  }

  function prepareSelection(start, end) {
    selection = { start, end };
    startInput.value = formatDateTime(start);
    endInput.value = formatDateTime(end);
    addEventButton.disabled = false;
    statusEl.textContent = "세부 정보를 입력한 후 일정을 추가하세요.";
  }

  function renderSummary(eventData) {
    const { start, end, extendedProps } = eventData;
    const summaryTemplate = `
      <dl>
        <div>
          <dt>시작</dt>
          <dd>${formatDateTime(start)}</dd>
        </div>
        <div>
          <dt>종료</dt>
          <dd>${formatDateTime(end)}</dd>
        </div>
        <div>
          <dt>플릿 컴포</dt>
          <dd>${escapeHtml(extendedProps?.fleet ?? "")}</dd>
        </div>
        <div>
          <dt>독트린</dt>
          <dd>${escapeHtml(extendedProps?.doctrine ?? "")}</dd>
        </div>
        <div>
          <dt>핸드아웃 여부</dt>
          <dd>${escapeHtml(extendedProps?.handout ?? "")}</dd>
        </div>
      </dl>
    `;

    summaryBody.innerHTML = summaryTemplate;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
