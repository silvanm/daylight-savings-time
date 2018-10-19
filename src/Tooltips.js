/* Handles the display of sunrise and sunset */

import d3 from "@/assets/d3";
import { event as currentEvent } from "d3";
import moment from "moment";

export default class Tooltips {
  tooltip = null;

  constructor(chart, data, xScale, yScale, height, margin) {
    this.chart = chart;
    this.data = data;
    this.xScale = xScale;
    this.yScale = yScale;
    this.height = height;
    this.margin = margin;
  }

  /**
   * Add a mouse-over tooltip
   */
  addTooltipFunction() {
    this.chart
      .append("svg:line")
      .attr("id", "tooltip-line")
      .attr("opacity", 0)
      .attr("stroke", "black")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 100)
      .attr("y2", 100);

    this.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    this.chart.on("mousemove", () => {
      let svgYOffset =
        document.getElementById("chart").getBoundingClientRect().y -
        window.scrollY;

      let svgXOffset =
        document.getElementById("chart").getBoundingClientRect().x -
        window.scrollX;

      let focusedDate = this.xScale.invert(currentEvent.x - svgXOffset);
      let focusedRecord = this.data.find(e => {
        return e.date.setHours(0, 0, 0) === focusedDate.setHours(0, 0, 0);
      });
      if (typeof focusedRecord !== "undefined") {
        this.chart
          .select("#tooltip-line")
          .attr("x1", currentEvent.x - svgXOffset)
          .attr("y1", this.yScale(focusedRecord["sunriseHour"]) + 5)
          .attr("x2", currentEvent.x - svgXOffset)
          .attr("y2", this.height - this.margin - 40)
          .attr("opacity", 0.5);

        this.tooltip
          .style("opacity", 1)
          .style("left", currentEvent.x + "px")
          .style("top", this.height - this.margin - 40 + svgYOffset + "px")
          .html(
            "Sunrise: " +
              moment(focusedRecord.solar["sunrise"]).format("kk:mm") +
              ", Sunset: " +
              moment(focusedRecord.solar["sunset"]).format("kk:mm")
          );
      } else {
        this.chart.select("#tooltip-line").attr("opacity", 0);
        this.tooltip.style("opacity", 0);
      }
    });
  }
}
