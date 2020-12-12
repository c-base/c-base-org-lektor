const CALENDAR_COLORS = {
  'c_base_events': '#14105D',
  'c_base_regulars': '#055D53',
  'c_base_seminars': '#145D1B',
  'c_base_online': '#5D1459'
};


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
    'event': event
  }
}

function updateFragmentWithViewState(uid = null) {
  const calendar = $('#calendar');
  const date = calendar.fullCalendar('getDate');
  const view = calendar.fullCalendar('getView');

  window.location.hash = "view=" + view.type + "&date=" + date.format('YYYY-MM-DD') + (uid ? "&event=" + uid : '');
}

function updateViewFromFragment() {
  const calendar = $('#calendar');
  const viewState = getViewStateFromFragment();
  if (viewState != null) {
    calendar.fullCalendar('changeView', viewState.view, viewState.date);
    if (viewState.event) {
      const events = calendar.fullCalendar('clientEvents', event => event.uid == viewState.event);
      if (events.length > 0) {
        showEventDialog(events[0]);
        return;
      }
    }
  } else {
    calendar.fullCalendar('changeView', 'month');
    calendar.fullCalendar('today');
  }

  const dialog = $('#dialog-details');
  if (dialog.hasClass('is-open')) {
    dialog.removeClass('from-view');
    MicroModal.close('dialog-details');
  }
}

function safeMarked(input) {
  const markedOptions = {
    breaks: true,
    headerPrefix: 'event-'
  }

  return DOMPurify.sanitize(marked(input, markedOptions));
}

function showEventDialog(calendarEvent) {
  const calendar = $('#calendar');

  if (calendarEvent.allDay) {
    const formattedStart = calendarEvent.start.format("LL");
    $('#event-day').text(formattedStart).parent().show();
    $('#event-start').parent().hide();
    $('#event-end').parent().hide();
  } else {
    const formattedStart = (calendarEvent.start) ? calendarEvent.start.format("LLL") : '';
    const formattedEnd = (calendarEvent.end) ? calendarEvent.end.format("LLL") : '';
    $('#event-start').text(formattedStart).parent().show();
    $('#event-end').text(formattedEnd).parent().show();
    $('#event-day').parent().hide();
  }

  $('#dialog-details-title').text(calendarEvent.title);
  $('#event-location').html(safeMarked(calendarEvent.location));
  $('#event-description').html(safeMarked(calendarEvent.description));

  updateFragmentWithViewState(calendarEvent.uid)

  MicroModal.show('dialog-details', {
    onClose: () => {
      const dialog = $('#dialog-details');
      if (dialog.hasClass('from-view')) {
        dialog.removeClass('from-view');
        window.history.back();
      } else {
        updateFragmentWithViewState();
      }
    },
    disableFocus: true
  });
}

$(document).ready(function () {
  // page is now ready, initialize the calendar...
  const viewState = getViewStateFromFragment();
  const startView = (viewState != null) ? viewState.view : 'month';
  const startDate = (viewState != null) ? viewState.date : null;

  const calendar = $('#calendar');
  calendar.fullCalendar({
    //height: 'auto',
    defaultView: startView,
    defaultDate: startDate,
    theme: true,
    timeFormat: 'HH:mm',
    titleFormat: 'MMMM YYYY',
    customButtons: {
      info: {
        // text: "Legend",
        icon: 'info',
        themeIcon: 'info',
        click: function (event) {
          event.stopPropagation();

          const dialog = $('#dialog-legend');

          for (let kind in CALENDAR_COLORS) {
            if (CALENDAR_COLORS.hasOwnProperty(kind)) {
              dialog.find('#' + kind).css({ backgroundColor: CALENDAR_COLORS[kind], color: 'white' });
            }
          }

          MicroModal.show('dialog-legend');
        }
      }
    },
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'info month,agendaWeek,agendaDay'
    },
    locale: 'de',
    navLinks: true,
    eventSources: [
      {
        events: [], // window.c_base_events,
        color: CALENDAR_COLORS.c_base_events
      }, {
        events: [], // window.c_base_regulars,
        color: CALENDAR_COLORS.c_base_regulars
      }, {
        events: [], // window.c_base_seminars,
        color: CALENDAR_COLORS.c_base_seminars
      }, {
        events: window.c_base_online,
        color: CALENDAR_COLORS.c_base_online
      }
    ],
    eventClick: function(calendarEvent, jsEvent, view) {
      $('#dialog-details').addClass('from-view');
      showEventDialog(calendarEvent);
    },
    views: {
      month: {
        titleFormat: 'MMMM YYYY',
        displayEventEnd: true
      },
      week: {
        titleFormat: 'LL'
      },
      day: {
        titleFormat: 'LL'
      }
    },
    eventAfterAllRender: function(view) {
      const viewState = getViewStateFromFragment()
      const uid = viewState ? viewState.event : null;

      if (uid) {
        // Search event with uid supplied in URL fragment
        const events = calendar.fullCalendar('clientEvents', event => event.uid == uid);
        if (events.length > 0) {
          showEventDialog(events[0]);
          return;
        }
      }

      updateFragmentWithViewState();
    }
  });

  $('#last-update').html(window.lastUpdate);
  $('#error-display').html(window.c_base_errors);

  $(window).on('popstate', updateViewFromFragment);
});
