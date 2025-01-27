<template>
  <div style="position: relative">
    <v-toolbar id="toolbar" dense flat class="grey lighten-4">
      <v-btn rounded icon @click="prev()">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <h3 class="text--secondary text-center" style="min-width: 210px">
        {{ moment(currentDate).format("dddd DD MMMM YYYY") }}
      </h3>
      <v-btn rounded icon @click="next()">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
      <v-btn-toggle
        mandatory
        v-model="typeValue"
        rounded
        dense
        color="secondary darken-2"
        class="ml-5"
      >
        <v-btn :value="hasCategoryView ? 'category' : 'day'"> Giorno </v-btn>

        <v-btn value="week"> Settimana </v-btn>

        <v-btn value="month"> Mese </v-btn>
      </v-btn-toggle>
      <v-switch
        v-if="typeValue != 'month'"
        v-model="showFullDay"
        inset
        class="ml-5 mt-5"
        color="primary"
        label="Mostra intera giornata"
        @change="setCalendarViewInterval"
      >
      </v-switch>
      <v-btn
        v-if="typeValue == 'category' && !proposalData && extraBtnData.visible"
        elevation="0"
        rounded
        class="ml-5"
        color="orange"
        dark
        @click="extraBtnData.fn"
      >
        {{ extraBtnData.text }}
      </v-btn>
    </v-toolbar>
    <MtaHorizontalScrollbar
        v-if="showTopScrollbar && typeValue !== 'category' && typeValue !== 'day'"
        ref="horizontalScrollbar"
        :container-ref="horizontalScheduleScrollbar.container"
    ></MtaHorizontalScrollbar>
    <div ref="scheduleScrollbarRef" style="width: 100%; overflow: auto">
      <div ref="schedulerContainer">
        <v-calendar
          v-on="$listeners"
          ref="calendar"
          id="calendar"
          v-model="currentDate"
          :locale="localeValue"
          :type="typeValue"
          :events="eventsData"
          :event-overlap-mode="modeValue"
          :event-overlap-threshold="30"
          :event-color="getEventColor"
          :first-time="firstTimeValue"
          :interval-count="intervalCountValue"
          :interval-minutes="intervalMinutesValue"
          :interval-format="(locale, getOptions) => locale.time"
          :mobile-breakpoint="0"
          :event-more="false"
          :categories="categories"
          :weekdays="[1, 2, 3, 4, 5, 6, 0]"
          @change="getEvents"
          @click:event="showDetails"
          @click:date="goToDate"
          @click:interval="emitDateTime"
        >
          <template #event="{ event }">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <div v-bind="attrs" v-on="on">
                  <div class="pl-1" style="text-shadow: 1px 1px 2px rgb(0 0 0)">
                    <strong>{{ event.title }}</strong>
                    <br />
                    <span>
                      {{ getTimeRange(event) }}
                    </span>
                    <br />
                    <small v-if="event.subtitle" class="font-weight-bold mr-2">
                      {{ event.subtitle }}
                    </small>
                  </div>
                  <div
                    v-if="event.isChecked"
                    style="position: absolute; top: -1px; right: 3px"
                  >
                    <v-icon color="white">mdi-check</v-icon>
                  </div>
                </div>
              </template>
              <span>
                <div>
                  <strong>
                    {{ event.title }}
                    <span v-if="event.isChecked" class="ml-3">
                      <v-icon color="white">mdi-check</v-icon>
                    </span>
                  </strong>
                  <br />
                  <span>
                    {{ getTimeRange(event) }}
                  </span>
                  <br />
                  <small v-if="event.subtitle" class="font-weight-bold mr-2">
                    {{ event.subtitle }}
                  </small>
                </div>
              </span>
            </v-tooltip>
          </template>
        </v-calendar>
      </div>
    </div>
  </div>
</template>
<script>
import moment from "moment";
import EventModel from "../models/event.model";
export default {
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: () => moment().format("YYYY-MM-DD"),
    },
    events: {
      type: Array,
      default: () => [],
    },
    hasCategoryView: {
      type: Boolean,
      default: () => true,
    },
    proposal: {
      type: Object,
      default: () => null,
    },
    headOnly: {
      type: Boolean,
      default: () => false,
    },
    locale: {
      type: String,
      default: () => "it",
    },
    type: {
      type: String,
      default: () => "category",
    },
    mode: {
      type: String,
      default: () => "stack",
    },
    firstTime: {
      type: Number,
      default: () => 8,
    },
    lastTime: {
      type: Number,
      default: () => 19,
    },
    intervalMinutes: {
      type: Number,
      default: () => 15,
    },
    extraBtn: {
      type: Object,
      default: () => {
        return {
          visible: false,
          text: "",
          fn: "",
        };
      },
    },
    showTopScrollbar: {
      type: Boolean,
      default: () => false,
    },
  },
  data: () => ({
    moment,
    currentDate: moment().format("YYYY-MM-DD"),
    proposalData: null,
    localeValue: "it",
    typeValue: "category",
    modeValue: "stack",
    firstTimeValue: "08:00",
    intervalCountValue: 44,
    intervalMinutesValue: 15,
    extraBtnData: {},
    showFullDay: false,
    isMounted: false,

    horizontalScheduleScrollbar: {
      container: null
    }
  }),
  mounted() {
    moment.locale(this.locale);
    this.hasCategoryView
      ? (this.typeValue = "category")
      : (this.typeValue = "day");
    this.setCalendarViewInterval();
    this.isMounted = true;
    if (this.$refs.scheduleScrollbarRef) {
      this.horizontalScheduleScrollbar.container = this.$refs.scheduleScrollbarRef;
    }
  },
  updated() {
    if (this.$refs && this.$refs.calendar) {
      if(this.$refs.calendar.$el && this.$refs.calendar.$el.style) {
        if (this.typeValue == "month") {
          this.$refs.calendar.$el.style.maxHeight = "auto";
        } else {
          this.$refs.calendar.$el.style.maxHeight = "700px";
        }
      }
      if (this.headOnly) {
        if(this.$refs.calendar.$el && this.$refs.calendar.$el.style) {
          this.$refs.calendar.$el.style.maxHeight = "auto";
        }
        if (this.typeValue != "month") {
          this.$refs.calendar.$el.children[0].style.minHeight = "500px";
          this.$refs.calendar.$el.children[1].style.display = "none";
          const row = this.$refs.calendar.$el.children[0].querySelector(
            ".v-calendar-category__columns"
          );
          if (row) {
            row.style.height = "100%";
          }
        } else {
          this.$refs.calendar.$el.children[0].style.minHeight = "auto";
          this.$refs.calendar.$el.children[1].style.display = "flex";
          const row = this.$refs.calendar.$el.children[0].querySelector(
            ".v-calendar-category__columns"
          );
          if (row) {
            row.style.height = "auto";
          }
        }
      }

      if(typeof this.$refs.calendar.$el.querySelectorAll === 'function') {
        const reset = this.$refs.calendar.$el.querySelectorAll(
            ".v-calendar-weekly__day"
        );
        reset.forEach((day) => {
          day.children[0].style.display = "block";
        });
        const daysOutOfRange = this.$refs.calendar.$el.querySelectorAll(
            ".v-calendar-weekly__day.v-outside"
        );
        daysOutOfRange.forEach((day) => {
          day.children[0].style.display = "none";
        });
      }
    }
  },
  methods: {
    intToTime(i) {
      return i < 10 ? `0${i}:00` : `${i}:00`;
    },
    countFullDayIntervals() {
      return 24 * (60 / this.intervalMinutesValue);
    },
    countIntervals() {
      return (
        (this.lastTime - this.firstTime) * (60 / this.intervalMinutesValue)
      );
    },
    setCalWidth() {
      if (this.$refs.schedulerContainer) {
        if (
            (this.categories.length > 5 && this.typeValue === "category") ||
            this.typeValue === "week"
        ) {
          this.$refs.schedulerContainer.style.width = "2500px";
        } else {
          this.$refs.schedulerContainer.style.width = "";
        }

        if (this.$refs.horizontalScrollbar) {
          this.$refs.horizontalScrollbar.updateScrollbar();
        }
      }
    },
    setCalendarViewInterval() {
      if (this.$refs && this.$refs.calendar) {
        if (this.showFullDay) {
          this.firstTimeValue = "00:00";
          this.intervalCountValue = this.countFullDayIntervals();
        } else {
          this.firstTimeValue = this.intToTime(this.firstTime);
          this.intervalCountValue = this.countIntervals();
        }
      }
    },
    showDetails({ nativeEvent, event }) {
      if (this.$refs && this.$refs.calendar) {
        this.$emit("eventDetails", event);
      }
      if (nativeEvent) nativeEvent.stopPropagation();
    },
    goToDate(date) {
      if (this.typeValue !== "category" && this.typeValue !== "day") {
        this.hasCategoryView
          ? (this.typeValue = "category")
          : (this.typeValue = "day");
        this.currentDate = date.date;
      }
    },
    emitDateTime(date) {
      this.$emit("timeClick", date);
    },
    getTimeRange(event) {
      const start = moment(event.start);
      const end = moment(event.end);

      if (
        start.isValid() &&
        end.isValid() &&
        start.format("HH:mm") != "00:00" &&
        end.format("HH:mm") != "00:00"
      ) {
        return start.format("HH:mm") + " - " + end.format("HH:mm");
      } else {
        return "Tutto il giorno";
      }
    },
    prev() {
      this.$refs.calendar.prev();
    },
    next() {
      this.$refs.calendar.next();
    },
    getEventColor(event) {
      return event.color;
    },
    getEvents({ start, end }) {
      if (this.isMounted && this.$refs && this.$refs.calendar) {
        if(this.typeValue === 'category' || this.typeValue === 'day') {
          end = start
        }
        this.$emit("rangeChanged", {
          start,
          end,
          date: this.currentDate,
          showFullDay: this.showFullDay,
        });
        this.setCalWidth();
      }
    },
  },
  computed: {
    eventsData() {
      let data = [];
      if (this.events && this.events.length) {
        data = this.events.slice().map((e) => new EventModel(e));
        data.forEach((e) => {
          if (!e.timed) {
            e.start = moment(e.start).format("YYYY-MM-DD");
            e.end = null;
          }
        });
      }
      return data;
    },
    categories() {
      let list = [];
      list = this.eventsData.filter((e) => !!e.category).map((e) => e.category);
      return [...new Set(list)];
    }
  },
  watch: {
    value: {
      handler(newVal) {
        this.currentDate = newVal;
      },
      immediate: true,
    },
    events: {
      handler() {
        this.setCalWidth();
      },
      immediate: true,
    },
    proposal: {
      handler(newVal) {
        this.porposalData = newVal;
      },
      immediate: true,
    },
    locale: {
      handler(newVal) {
        this.localeValue = newVal;
      },
      immediate: true,
    },
    type: {
      handler(newVal) {
        this.typeValue = newVal;
      },
      immediate: true,
    },
    mode: {
      handler(newVal) {
        this.modeValue = newVal;
      },
      immediate: true,
    },
    firstTime: {
      handler(newVal) {
        this.intToTime(newVal);
      },
      immediate: true,
    },
    intervalMinutes: {
      handler(newVal) {
        this.intervalMinutesValue = newVal > 0 && newVal < 61 ? newVal : 15;
      },
      immediate: true,
    },
    extraBtn: {
      handler(newVal) {
        this.extraBtnData = newVal;
      },
    },
  },
};
</script>

<style lang="scss" scoped>
#calendar {
  &.v-calendar-daily {
    overflow-y: auto !important;
  }
}
</style>
