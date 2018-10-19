<template>
    <div>

        <p>There is currently a <a href="https://edition.cnn.com/2018/08/31/europe/eu-abolish-daylight-saving-time-intl/index.html">discussion in the EU</a> whether to abolish "daylight savings time" where the clocks
            are put forward one hour in March and back again in October.
            The rationale behind "DST" is that you get as much sunlight during your <em>work hours</em>
            as possible.
            </p>
        <p>With this app you can check whether daylight savings time makes sense for you.
             It calculates how many hours of sunlight you get during your usual work hours based
            on the location selected below.
        </p>
        <div id="spinner" v-show="status!='Done' && status!='GelocationFailed'"><p>Attempting to determine your location... <Spinner style="vertical-align: middle"> </Spinner></p>
        </div>
        <p v-show="status=='GelocationFailed'"><b>⚠️ Automatic location of your device failed. Select
            your location manually:</b></p>
        <div id="results" v-show="status=='Done'">
            <h2><span v-if="Math.round(savedHours)>0     ">Yes, it does.</span>
            <span v-else>Nope.</span>
            </h2>
        <p>Daylight savings time where the clocks are moved by {{config.dstOffset}} hour in summer will
            <span v-if="Math.round(savedHours)>0">
            get you <strong>{{Math.round(savedHours)}}</strong>
            additional hours of daylight. For you, daylight savings time <strong>does</strong> make sense.
            </span>
            <span v-if="Math.round(savedHours)==0">
                not give you more hours of sunlight. For you, daylight savings time does <strong>not</strong> make sense.
            </span>
            <span v-if="Math.round(savedHours)<0">
            deprive you from <strong>{{Math.round(-savedHours)}}</strong>
                hours of sunlight. For yo,u daylight savings time does <strong>not</strong> make sense.
            </span>
                </p>
        <p>Your work hours are assumed to be between <strong>{{Math.round(config.workday.startHour)}}:00 and
            {{Math.round(config.workday.endHour)}}:00</strong> and are
        visualized in gray/blue in the graph below. Drag the edges of the gray box below to change those settings.</p>
        <p>To calculate this, the sunrise and sunset times for <strong>{{this.location.name}}</strong> have been
        used. To change this, use the field below.</p>
        </div>

        <form>
          <div class="form-group row" id="googleautocomplete">
            <label  class="col-sm-2 col-form-label">Location</label>
               <div class="col-sm-6">
                <vue-google-autocomplete
                        ref="googleautocomplete"
                    id="map"
                    classname="form-control"
                    placeholder="Your location"
                    types="(cities)"
                    :enable-geolocation="true"
                    v-on:placechanged="addressDropdownSelect"
                >
                </vue-google-autocomplete>
               </div>
              <div class="col-sm-4 form-group">
                  <div class="form-check form-check-inline">
                      <input type="checkbox" class="form-check-input" id="advanced-settings-control"
                             v-model="advancedSettings">
                      <label class="form-check-label" for="advanced-settings-control">Advanced settings</label>
                  </div>
              </div>
          </div>
        </form>

        <div v-show="advancedSettings">
            <h2>Advanced settings</h2>
            <table id="advanced-settings">
                <tr>
                    <td>Status:</td>
                    <td class="result"> {{status}}</td><td></td>
                </tr>
                <tr>
                    <td>Timezone offset:</td>
                    <td><input name="timezoneOffset" type="number" v-model="config.timezoneOffset"></td><td> hours</td>
                </tr>
                <tr>
                    <td>DST offset:</td>
                    <td><input type="number" v-model="config.dstOffset"></td><td> hours</td>
                </tr>
                <tr>
                    <td>Work day start:</td>
                    <td><input type="number" v-model="config.workday.startHour"></td><td>:00</td>
                </tr>
                <tr>
                    <td>Work day end:</td>
                    <td><input type="number" v-model="config.workday.endHour"></td><td>:00</td>
                </tr>
                <tr>
                    <td>Lat:</td>
                    <td><input type="number" v-model="location.lat"></td><td></td>
                </tr>
                <tr>
                    <td>Lng:</td>
                    <td><input type="number" v-model="location.lng"></td><td></td>
                </tr>
                <tr>
                    <td>Hours total:</td>
                    <td class="result"> {{Math.round(stats.totalHours)}}</td><td> hours</td>
                </tr>
                <tr>
                    <td>Hours with daylight:</td>
                    <td class="result"> {{Math.round(stats.brightHours)}}</td><td> hours</td>
                </tr>
                <tr>
                    <td>Hours with daylight without DST:</td>
                    <td class="result"> {{Math.round(stats.brightHoursWithoutDST)}}</td><td> hours</td>
                </tr>
                <tr>
                    <td>Rate of hours with daylight:</td>
                    <td class="result">{{Math.round(stats.brightHours/stats.totalHours*100)}}%</td><td></td>
                </tr>
                <tr>
                    <td>Hours won vs. normal settings:</td>
                    <td class="result">{{Math.round(-stats.brightHoursWithoutDST + stats.brightHours)}} hours</td>
                </tr>
            </table>
        </div>
        <div id="svg"></div>
    </div>
</template>

<script>
import config from "@/config";
import d3 from "@/assets/d3";
import DSTCalculator from "../DSTCalculator";
import moment from "moment";
import "moment-timezone";
import VueGoogleAutocomplete from "vue-google-autocomplete";
import axios from "axios";
import Tooltips from "../Tooltips";
import WorkhoursRect from "../WorkhoursRect";
import { Circle as Spinner } from "vue-loading-spinner";

const HEIGHT = 400;
const MARGIN = 20;

export default {
  name: "DSTViewer",
  components: {
    VueGoogleAutocomplete,
    Spinner
  },
  props: {
    tooltipEnabled: true
  },
  data() {
    return {
      config: {
        timezoneOffset: 1,
        dstOffset: 1,
        dstStart: {
          month: 4,
          day: 22
        },
        dstEnd: {
          month: 10,
          day: 22
        },
        workday: {
          startHour: 8,
          endHour: 18
        }
      },
      location: {
        lat: null,
        lng: null,
        name: ""
      },
      calculator: new DSTCalculator.DSTCalculator(),
      chart: null,
      stats: {
        totalHours: 0,
        brightHours: 0,
        brightHoursWithoutDST: 0,
        brightHoursPermanentDST: 0,
        initialHours: null
      },
      status: "",
      advancedSettings: false,
      graphInited: false
    };
  },

  mounted() {
    this.WIDTH = document.getElementById("app").clientWidth;
    this.setDefaults();
  },
  watch: {
    "config.dstOffset": function() {
      this.update();
    },
    "config.workday.startHour": function() {
      this.update();
    },
    "config.workday.endHour": function() {
      this.update();
    }
  },
  computed: {
    savedHours() {
      return this.stats.brightHours - this.stats.brightHoursWithoutDST;
    },
    savedHoursPermanentDST() {
      return this.stats.brightHours - this.stats.brightHoursPermanentDST;
    }
  },
  methods: {
    setDefaults: function() {
      this.status = "Geolocating";
      navigator.geolocation.getCurrentPosition(
        async position => {
          this.location.lat = position.coords.latitude;
          this.location.lng = position.coords.longitude;

          this.status = "Geocoding";

          // Fill in the dropdown
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${
              this.location.lat
            },${this.location.lng}&result_type=locality&key=${config.apikey}`
          );

          this.status = "Done";

          try {
            this.$refs.googleautocomplete.autocompleteText = this.location.name =
              response.data.results[0].formatted_address;
          } catch (e) {
            this.$refs.googleautocomplete.autocompleteText = this.location.name =
              "Untitled location";
            // catch the TypeError that is thrown when no city can be found
          }

          // Get the offset of the current timezone without considering DST.
          let offset = moment.tz
            .zone(moment.tz.guess())
            .utcOffset(new Date(2018, 0, 1));
          this.config.timezoneOffset = -offset / 60;
          this.calculator.setConfig(this.config);
          this.calculator.setLocation(this.location.lat, this.location.lng);
          this.initGraph();
        },
        () => {
          console.log("offline");
          this.status = "GelocationFailed";
          let offset = moment.tz
            .zone(moment.tz.guess())
            .utcOffset(new Date(2018, 0, 1));
          this.config.timezoneOffset = -offset / 60;
          this.calculator.setConfig(this.config);
        }
      );
    },
    /**
     * Initializes the graph
     */
    initGraph() {
      this.data = this.calculator.getData();

      this.chart = d3
        .select("#svg")
        .append("svg:svg")
        .attr("id", "chart")
        .attr("width", this.WIDTH)
        .attr("height", HEIGHT);

      this.xScale = d3
        .scaleTime()
        .domain(this.getDateRange())
        .range([MARGIN, this.WIDTH - 2 * MARGIN]);

      let xAxis = d3.axisBottom(this.xScale);

      this.yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([HEIGHT - 2 * MARGIN, MARGIN]);

      let yAxis = d3.axisLeft(this.yScale);

      this.chart
        .append("g")
        .attr("transform", "translate(0, " + (HEIGHT - 2 * MARGIN) + ")")
        .call(xAxis);

      if (this.WIDTH < 400) {
        // Rotate x-axis labels by 90° on small devices
        this.chart
          .selectAll("text")
          .attr("y", 0)
          .attr("x", 9)
          .attr("dy", ".35em")
          .attr("transform", "rotate(90)")
          .style("text-anchor", "start");
      }

      this.chart
        .append("g")
        .attr("transform", "translate(" + MARGIN + ", 0)")
        .call(yAxis);

      // Tooltips
      this.tooltips = new Tooltips(
        this.chart,
        this.data,
        this.xScale,
        this.yScale,
        HEIGHT,
        MARGIN
      );

      if (this.tooltipEnabled) {
        this.tooltips.addTooltipFunction();
      }

      let self = this;

      this.lineSunriseFunc = d3
        .area()
        .x(function(d) {
          return self.xScale(d.date);
        })
        .y0(function(d) {
          return self.yScale(d.sunriseHour);
        })
        .y1(function(d) {
          return self.yScale(d.sunsetHour);
        });

      this.path = this.chart.append("path").attr("class", "line-sunrise");

      // Workhours box
      this.workhoursRect = new WorkhoursRect(
        this.chart,
        MARGIN,
        this.config.workday,
        this.yScale
      );

      this.addLegend();

      this.graphInited = true;

      this.update();
    },
    /**
     * Adds add
     */
    addLegend() {
      this.chart
        .append("svg:rect")
        .attr("class", "workhours")
        .attr("opacity", 0.5)
        .attr("fill", "#00f")
        .attr("x", MARGIN + 5)
        .attr("y", MARGIN)
        .attr("width", 10)
        .attr("height", 10);

      this.chart
        .append("svg:text")
        .attr("class", "legend")
        .attr("x", MARGIN + 20)
        .attr("y", MARGIN + 10)
        .text("Workhours");

      this.chart
        .append("svg:rect")
        .attr("class", "sun-color")
        .attr("opacity", 0.5)
        .attr("x", MARGIN + 85)
        .attr("y", MARGIN)
        .attr("width", 10)
        .attr("height", 10);

      this.chart
        .append("svg:text")
        .attr("class", "legend")
        .attr("x", MARGIN + 20 + 80)
        .attr("y", MARGIN + 10)
        .text("Hours with sunlight");
    },

    /**
     * Updates the graph
     */
    update() {
      console.log("update");
      this.calculator.setConfig(this.config);
      this.calculator.setLocation(this.location.lat, this.location.lng);
      this.data = this.calculator.getData();
      let stats = this.calculator.getBrightHourStat();
      this.stats.brightHours = stats.brightHours;
      this.stats.brightHoursWithoutDST = stats.brightHoursWithoutDST;
      this.stats.brightHoursPermanentDST = stats.brightHoursPermanentDST;
      this.stats.totalHours = stats.totalHours;

      // Select the section we want to apply our changes to
      let svg = d3.select("body").transition();

      // Make the changes
      svg
        .select(".line-sunrise") // change the line
        .attr("d", this.lineSunriseFunc(this.data));

      this.workhoursRect.update(
        MARGIN,
        this.yScale(this.config.workday.endHour),
        this.xScale(this.getDateRange()[1]) -
          this.xScale(this.getDateRange()[0])
      );
    },
    /**
     * Returns the min and max date of the x-scale
     */
    getDateRange() {
      return [this.data[0].date, this.data[this.data.length - 1].date];
    },
    /**
     * Called when an address is chosen in the dropdown
     */
    async addressDropdownSelect(addressData, placeResultData) {
      this.location.lat = placeResultData.geometry.location.lat();
      this.location.lng = placeResultData.geometry.location.lng();

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/timezone/json?location=${
          this.location.lat
        },${this.location.lng}&timestamp=${Date.now() / 1000}&key=${
          config.apikey
        }`
      );

      this.config.timezoneOffset = response.data.rawOffset / 3600;

      if (!this.graphInited) {
        this.calculator.setLocation(this.location.lat, this.location.lng);
        this.initGraph();
      }
      this.update();
      this.status = "Done";
    }
  }
};
</script>

<style lang="scss">
.line-sunrise,
.sun-color {
  fill: #ffde04;
  opacity: 0.5;
}
.workhours {
  cursor: row-resize;
}
table#advanced-settings input,
.result {
  text-align: right;
}
svg {
  font-size: 12px;
}

.tooltip {
  position: absolute;
  font-size: 10px;
}
</style>
