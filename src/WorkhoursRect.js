/* Handles the drawing and modification of the workhour rectangle */
import d3 from "@/assets/d3";
import { event as currentEvent } from "d3";

export default class WorkhoursRect {
  state = "idle";

  constructor(chart, margin, workday, yScale) {
    this.chart = chart;
    this.margin = margin;
    this.workday = workday;
    this.yScale = yScale;
    this.chart
      .append("svg:rect")
      .attr("class", "workhours")
      .attr("opacity", 0.5)
      .attr("fill", "#00f");

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
