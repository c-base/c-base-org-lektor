function fixListHeight() {
  $('#upcoming .fc-scroller').css('height', '');
}

$(document).ready(function () {
  const calendar = $('#upcoming');
  calendar.fullCalendar({
    defaultView: 'upcoming',
    noEventsMessage: 'Keine Veranstaltungen in den nächsten Tagen 😢',
    theme: true,
    header: false,
    eventTimeFormat: 'HH:mm',
    displayEventEnd: false,
    locale: 'de',
    eventSources: [
      {
        events: [] // window.c_base_events
      }, 
      {
        events: [] // window.c_base_regulars
      }, 
      {
        events: [] // window.c_base_seminars
      }, 
      {
        events: window.c_base_online
      }
    ],
    eventClick: function(calendarEvent, jsEvent, view) {
      const date = calendarEvent.start.format('YYYY-MM-DD');
      window.location.href = '/calendar/#view=month&date=' + date + '&event=' + calendarEvent.uid;
    },
    views: {
      upcoming: {
        type: 'list',
        listDayFormat: 'dddd',
        listDayAltFormat: 'LL',
        duration: { days: 7 }
      }
    },
    eventAfterAllRender: fixListHeight,
    windowResize: fixListHeight
  });
});
