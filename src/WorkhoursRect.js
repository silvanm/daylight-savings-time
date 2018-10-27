/* Handles the drawing and modification of the workhour rectangle */
import d3 from "@/assets/d3";
import { event as currentEvent } from "d3";

export default class WorkhoursRect {
  state = "idle";

  constructor(chart, margin, width, workday, yScale) {
    this.chart = chart;
    this.margin = margin;
    this.width = width;
    this.workday = workday;
    this.yScale = yScale;
    this.chart
      .append("svg:rect")
      .attr("class", "workhours")
      .attr("opacity", 0.5)
      .attr("fill", "#00f");

    this.chart
      .append("svg:line")
      .attr("x1", this.width / 2 - 5)
      .attr("x2", this.width / 2 + 5)
      .attr("y1", this.yScale(this.workday.endHour) + 5)
      .attr("y2", this.yScale(this.workday.endHour) + 5)
      .attr("class", "draghandle-endhour")
      .attr("stroke", "#000");

    this.chart
      .append("svg:line")
      .attr("x1", this.width / 2 - 5)
      .attr("x2", this.width / 2 + 5)
      .attr("y1", this.yScale(this.workday.startHour) - 5)
      .attr("y2", this.yScale(this.workday.startHour) - 5)
      .attr("class", "draghandle-starthour")
      .attr("stroke", "#000");

    this.chart.call(
      d3
        .drag()
        .on("start", (d, i) => this.dragstarted(d, i))
        .on("drag", (d, i) => this.dragged(d, i))
        .on("end", (d, i) => this.dragended(d, i))
    );
  }
  update(x, y, width) {
    this.chart
      .select(".workhours")
      .attr("x", this.margin)
      .attr("width", width)
      .attr("y", this.yScale(this.workday.endHour))
      .attr(
        "height",
        this.yScale(this.workday.startHour) - this.yScale(this.workday.endHour)
      );
    this.chart
      .select(".draghandle-endhour")
      .attr("y1", this.yScale(this.workday.endHour) + 5)
      .attr("y2", this.yScale(this.workday.endHour) + 5);
    this.chart
      .select(".draghandle-starthour")
      .attr("y1", this.yScale(this.workday.startHour) - 5)
      .attr("y2", this.yScale(this.workday.startHour) - 5);
  }

  /**
   * Returns the kind of dragging
   */
  getDragHourPos() {
    console.log(currentEvent.y);
    return this.yScale.invert(currentEvent.y);
  }
  dragstarted() {
    document.body.style.cursor = "row-resize";
    console.log("dragstarted");
    // check which line we want to drag
    if (
      Math.abs(this.getDragHourPos() - this.workday.endHour) <
      Math.abs(this.getDragHourPos() - this.workday.startHour)
    ) {
      this.state = "dragEndHour";
    } else {
      this.state = "dragStartHour";
    }
  }
  dragged() {
    console.log("dragged");
    let newHour = this.getDragHourPos();
    if (this.state == "dragEndHour") {
      if (newHour < 24 && newHour > this.workday.startHour) {
        this.workday.endHour = newHour;
      }
    }
    if (this.state == "dragStartHour") {
      if (newHour > 0 && newHour < this.workday.endHour) {
        this.workday.startHour = newHour;
      }
    }
  }
  dragended() {
    document.body.style.cursor = "auto";
    console.log("dragended");
    this.state = "idle";
  }
}
