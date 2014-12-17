/* A view with a simple list
----------------------------------------------------------------------------------------------------------------------*/

fcViews.list = ListView; // register this view

function ListView(calendar) {
    View.call(this, calendar); // call the super-constructor
}


ListView.prototype = createObject(View.prototype); // define the super-class
$.extend(ListView.prototype, {

    name: 'list',


    incrementDate: function(date, delta) {
        var out = date.clone().stripTime().add(delta, 'days'); //imitated week view
        out = this.skipHiddenDays(out, delta < 0 ? -1 : 1);
        return out;
    },


    render: function(date) {

        this.intervalStart = date.clone().stripTime();
        this.intervalEnd = this.intervalStart.clone().add(this.calendar.options.listInterval);

        this.start = this.skipHiddenDays(this.intervalStart);
        this.end = this.skipHiddenDays(this.intervalEnd, -1, true);

        this.title = this.calendar.formatRange(
            this.start,
            this.end.clone().subtract(1), // make inclusive by subtracting 1 ms? why?
            this.opt('titleFormat'),
            ' \u2014 ' // emphasized dash
        );

        this.trigger('viewRender', this, this, this.el);

        // attach handlers to document. do it here to allow for destroy/rerender
        $(document)
            .on('mousedown', this.documentMousedownProxy)
            .on('dragstart', this.documentDragStartProxy); // jqui drag

    },

    renderEvents: function renderListEvents(events) {
        var eventsCopy = events.slice().reverse(); //copy and reverse so we can modify while looping

        var tbody = $('<tbody></tbody>');

        this.scrollerEl = $('<div class="fc-scroller"></div>');

        this.el.html('')
            .append(this.scrollerEl).children()
            .append('<table style="border: 0; width:100%"></table>').children()
            .append(tbody);

        var periodEnd = this.end.clone(); //clone so as to not accidentally modify

        var currentDayStart = this.start.clone();
        while (currentDayStart.isBefore(periodEnd)) {

            var didAddDayHeader = false;
            var currentDayEnd = currentDayStart.clone().add(1, 'days');

            //Assume events were ordered descending originally (notice we reversed them)
            for (var i = eventsCopy.length - 1; i >= 0; --i) {
                var e = eventsCopy[i];

                var eventStart = e.start.clone();
                var eventEnd = this.calendar.getEventEnd(e);

                if (currentDayStart.isAfter(eventEnd) || (currentDayStart.isSame(eventEnd) && !eventStart.isSame(eventEnd)) || periodEnd.isBefore(eventStart)) {
                    eventsCopy.splice(i, 1);
                } else if (currentDayEnd.isAfter(eventStart)) {
                    //We found an event to display
                    if (!didAddDayHeader) {
                        tbody.append(''+
                                '<tr>'+
                                    '<th colspan="4">'+
                                        '<span class="fc-header-day">' + this.calendar.formatDate(currentDayStart, 'dddd') + '</span>'+
                                        '<span class="fc-header-date">' + this.calendar.formatDate(currentDayStart, this.opt('columnFormat')) + '</span>'+
                                    '</th>'+
                                '</tr>');

                        didAddDayHeader = true;
                    }

                    var segEl = $(''+
                        '<tr class="fc-row fc-event-container fc-content">'+
                            '<td class="fc-event-handle">'+
                                '<span class="fc-event"></span>'+
                            '</td>'+
                            '<td class="fc-time">' + (e.allDay ? this.opt('allDayText') : this.getEventTimeText(e)) + '</td>'+
                            '<td class="fc-title">' + e.title + '</td>'+
                            '<td class="fc-location">' + e.location || '' + '</td>'+
                        '</tr>');
                    tbody.append(segEl);

                    //Tried to use fullcalendar code for this stuff but to no avail
                    (function(_this, myEvent, mySegEl) { //temp bug fix because 'e' seems to change
                        segEl.on('click', function(ev) {
                            return _this.trigger('eventClick', mySegEl, myEvent, ev);
                        });
                    })(this, e, segEl);
                }

            }

            currentDayStart.add(1, 'days');
        }

        this.updateHeight();

        //View.prototype.renderEvents.call(this, events);

    },

    updateWidth: function() {
        this.scrollerEl.width(this.el.width());
    },

    setHeight: function(height, isAuto) {
        //only seems to happen at resize

        var diff = this.el.outerHeight() - this.scrollerEl.height();

        this.scrollerEl.height(height - diff);

        var contentHeight = 0;
        this.scrollerEl.children().each(function(index, child) {
            contentHeight += $(child).outerHeight();
        });


        if (height - diff > contentHeight) {
            this.scrollerEl.css('overflow-y', 'hidden');
        }
        else {
            this.scrollerEl.css('overflow-y', 'scroll');
        }

    },

    getSegs: function() {
        return this.segs || [];
    },

    renderDrag: function(start, end, seg) {
        // subclasses should implement
    },

    // Unrenders a visual indication of event hovering
    destroyDrag: function() {
        // subclasses should implement
    },

    // Renders a visual indication of the selection
    renderSelection: function(start, end) {
        // subclasses should implement
    },

    // Unrenders a visual indication of selection
    destroySelection: function() {
        // subclasses should implement
    }

});
