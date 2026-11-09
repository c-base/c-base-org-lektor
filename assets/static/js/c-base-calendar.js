const CALENDAR_COLORS = {
  'c_base_events': '#14105D',
  'c_base_regulars': '#055D53',
  'c_base_seminars': '#145D1B',
};

const DISPLAY_TIMEZONE = 'Europe/Berlin';

document.addEventListener('DOMContentLoaded', function() {

  // Note: For all-day events Event.start and Event.end are the start of the respective UTC day, not start of the day
  // in the display time zone (or the user's local time zone). So we'll use a date formatter configured for UTC.
  const dateFormatter = new Intl.DateTimeFormat('de', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const dateTimeFormatter = new Intl.DateTimeFormat('de', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: 'numeric',
    hour12: false,
    timeZone: DISPLAY_TIMEZONE,
  });

  const initialViewState = getViewStateFromFragment();
  const startView = (initialViewState != null) ? initialViewState.view : 'month';
  const startDate = (initialViewState != null) ? initialViewState.date : null;
  let initialEventUid = (initialViewState != null) ? initialViewState.event : null;

  let skipFragmentUpdate = false;

  const calendarElement = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarElement, {
    timeZone: DISPLAY_TIMEZONE,
    initialView: startView,
    initialDate: startDate,
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    //nextDayThreshold: '06:00:00',
    height: 'auto',
    customButtons: {
      info: {
        icon: 'info',
        hint: 'Colors',
        click: function (event) {
          event.stopPropagation();

          for (let kind in CALENDAR_COLORS) {
            if (CALENDAR_COLORS.hasOwnProperty(kind)) {
              const colorElement = document.getElementById(kind);
              colorElement.style.setProperty('background-color', CALENDAR_COLORS[kind]);
              colorElement.style.setProperty('color', 'white');
            }
          }

          MicroModal.show('dialog-legend');
        },
      },
    },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'info month,agendaWeek,agendaDay',
    },
    locale: 'de',
    firstDay: 1,
    buttonText: {
      today: 'Heute',
      month: 'Monat',
      week: 'Woche',
      day: 'Tag',
    },
    allDayText: 'Ganztägig',
    navLinks: true,
    eventSources: [
      {
        events: window.c_base_events,
        color: CALENDAR_COLORS.c_base_events,
        display: 'block',
      },
      {
        events: window.c_base_regulars,
        color: CALENDAR_COLORS.c_base_regulars,
        display: 'block',
      },
      {
        events: window.c_base_seminars,
        color: CALENDAR_COLORS.c_base_seminars,
        display: 'block',
      },
      {
        events: window.c_base_online,
        color: CALENDAR_COLORS.c_base_online,
        display: 'block',
      },
    ],
    eventClick: function(info) {
      document.getElementById('dialog-details').classList.add('from-view');
      showEventDialog(info.event);
    },
    views: {
      month: {
        type: 'dayGridMonth',
        titleFormat: { year: 'numeric', month: 'long' },
        displayEventEnd: true,
      },
      agendaWeek: {
        type: 'timeGridWeek',
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      },
      agendaDay: {
        type: 'timeGridDay',
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      },
    },
    datesSet: function(dateInfo) {
      if (!initialEventUid) {
        if (skipFragmentUpdate) {
          skipFragmentUpdate = false;
        } else {
          updateFragmentWithViewState();
        }
      }
    },
  });

  document.getElementById('last-update').textContent = window.lastUpdate;
  document.getElementById('error-display').textContent = window.c_base_errors;

  window.addEventListener('popstate', updateViewFromFragment);

  function decodeParameters(parametersString) {
    const parameters = {};
    const keyValuePairs = parametersString.split('&');
    for (let i = 0; i < keyValuePairs.length; i++) {
        const pair = keyValuePairs[i].split('=', 2);
        const key = pair[0];
        const value = pair[1];
        parameters[key] = value;
    }

    return parameters;
  }

  function getViewStateFromFragment() {
    const fragment = window.location.hash.substring(1);
    const parameters = decodeParameters(fragment);

    const view = parameters.view;
    const date = parameters.date;
    const event = parameters.event;

    if (view == null || date == null) {
      return null;
    }

    return {
      'view': view,
      'date': date,
      'event': event,
    }
  }

  function toDateString(date) {
    // YYYY-MM-DD
    return date.getUTCFullYear().toString() +
        '-' +
        (date.getUTCMonth() + 1).toString().padStart(2, '0') +
        '-' +
        date.getUTCDate().toString().padStart(2, '0');
  }

  function updateFragmentWithViewState(uid = null) {
    const date = calendar.getDate();
    const view = calendar.view;
    window.location.hash = 'view=' + view.type + '&date=' + toDateString(date) + (uid ? '&event=' + uid : '');
  }

  function updateViewFromFragment() {
    const viewState = getViewStateFromFragment();
    skipFragmentUpdate = true;
    if (viewState != null) {
      calendar.changeView(viewState.view, viewState.date);
      if (viewState.event) {
        const event = calendar.getEvents().find(event => event.extendedProps.uid == viewState.event);
        if (event) {
          showEventDialog(event);
          return;
        }
      }
    } else {
      calendar.changeView('month');
      calendar.today();
    }

    const dialog = document.getElementById('dialog-details');
    if (dialog.classList.contains('is-open')) {
      dialog.classList.remove('from-view');
      MicroModal.close('dialog-details');
    }
  }

  function safeMarked(input) {
    const markedOptions = {
      breaks: true,
      headerPrefix: 'event-',
    }

    return DOMPurify.sanitize(marked(input, markedOptions));
  }

  function showEventDialog(calendarEvent) {
    const eventDayElement = document.getElementById('event-day');
    const eventStartElement = document.getElementById('event-start');
    const eventEndElement = document.getElementById('event-end');

    if (calendarEvent.allDay) {
      if (calendarEvent.end - calendarEvent.start < 36 * 60 * 60 * 1000) {
        // Single day all-day event

        eventDayElement.textContent = dateFormatter.format(calendarEvent.start);
        eventDayElement.parentElement.style.setProperty('display', '');
        eventStartElement.parentElement.style.setProperty('display', 'none');
        eventEndElement.parentElement.style.setProperty('display', 'none');
      } else {
        // All-day event spanning multiple days

        // The end time is the start of the next day. We subtract a millisecond to end up with a time on the previous day.
        const endDate = new Date(calendarEvent.end.getTime() - 1);

        eventStartElement.textContent = dateFormatter.format(calendarEvent.start);
        eventStartElement.parentElement.style.setProperty('display', '');
        eventEndElement.textContent = dateFormatter.format(endDate);
        eventEndElement.parentElement.style.setProperty('display', '');
        eventDayElement.parentElement.style.setProperty('display', 'none');
      }
    } else {
      // Event with start and end time

      // Parse dates from strings because fullCalendar seems to perform some unwanted time zone(?) adjustments on
      // calendarEvent.start and calendarEvent.end.
      const startDate = new Date(Date.parse(calendarEvent.startStr));
      const endDate = new Date(Date.parse(calendarEvent.endStr));

      eventStartElement.textContent = dateTimeFormatter.format(startDate);
      eventStartElement.parentElement.style.setProperty('display', '');
      eventEndElement.textContent = dateTimeFormatter.format(endDate);
      eventEndElement.parentElement.style.setProperty('display', '');
      eventDayElement.parentElement.style.setProperty('display', 'none');
    }

    document.getElementById('dialog-details-title').textContent = calendarEvent.title;
    document.getElementById('event-location').innerHTML = safeMarked(calendarEvent.extendedProps.location);
    document.getElementById('event-description').innerHTML = safeMarked(calendarEvent.extendedProps.description);

    MicroModal.show('dialog-details', {
      onShow: () => {
        updateFragmentWithViewState(calendarEvent.extendedProps.uid);
      },
      onClose: () => {
        const dialog = document.getElementById('dialog-details');
        if (dialog.classList.contains('from-view')) {
          dialog.classList.remove('from-view');
          window.history.back();
        } else {
          updateFragmentWithViewState();
        }
      },
      disableFocus: true,
    });
  }

  calendar.render();

  if (initialEventUid) {
    const event = calendar.getEvents().find(event => event.extendedProps.uid == initialEventUid);
    initialEventUid = null;
    if (event) {
      showEventDialog(event);
    }
  }
});
