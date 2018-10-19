import SolarCalc from "solar-calc";

class DSTCalculator {
  constructor() {}
  setLocation(lat, lng) {
    this.lat = lat;
    this.lng = lng;
  }
  setConfig(config) {
    this.timezoneOffset = parseFloat(config.timezoneOffset);
    this.dstStart = config.dstStart;
    this.dstEnd = config.dstEnd;
    this.dstOffset = parseFloat(config.dstOffset);
    this.workday = {};
    this.workday.startHour = parseFloat(config.workday.startHour);
    this.workday.endHour = parseFloat(config.workday.endHour);

    console.log(config);
  }

  getData() {
    this.data = [];
    for (let i = 0; i <= 365; i++) {
      let curDate = new Date(new Date().getFullYear(), 0, i);
      let solar = new SolarCalc(curDate, this.lat, this.lng);
      let day = {
        date: curDate,
        solar: solar,
        sunsetHour: this.prepareSunHoursForGraph(
          solar,
          "sunset",
          this.dstOffset
        ),
        sunriseHour: this.prepareSunHoursForGraph(
          solar,
          "sunrise",
          this.dstOffset
        ),
        sunsetHourWithoutDst: this.prepareSunHoursForGraph(
          solar,
          "sunset",
          0,
          false
        ),
        sunriseHourWithoutDst: this.prepareSunHoursForGraph(
          solar,
          "sunrise",
          0,
          false
        ),
        sunsetHourPermanentDst: this.prepareSunHoursForGraph(
          solar,
          "sunset",
          this.dstOffset,
          true
        ),
        sunriseHourPermanentDst: this.prepareSunHoursForGraph(
          solar,
          "sunrise",
          this.dstOffset,
          true
        )
      };
      this.data.push(day);
    }
    return this.data;
  }

  prepareSunHoursForGraph(solar, type, dstOffset, permanent) {
    let result =
      (solar[type].getUTCHours() +
        this.getOffsetFromDate(solar[type], dstOffset, permanent) +
        solar[type].getUTCMinutes() / 60 +
        24) %
      24;
    return result;
  }

  /**
   * Returns the offset considering timezone + DST
   */
  getOffsetFromDate(date, dstOffsetHours, permanent) {
    return (
      this.timezoneOffset + (this.isDst(date) || permanent ? dstOffsetHours : 0)
    );
  }

  /**
   * @param date Date
   */
  isDst(date) {
    if (
      (date.getMonth() + 1) * 30 + date.getDate() >=
        this.dstStart.month * 30 + this.dstStart.day &&
      (date.getMonth() + 1) * 30 + date.getDate() <
        this.dstEnd.month * 30 + this.dstEnd.day
    ) {
      return true;
    }
    return false;
  }

  getBrightHourStat() {
    let stats = {
      totalHours: 0,
      brightHours: 0,
      brightHoursWithoutDST: 0
    };
    this.data.forEach(elem => {
      stats.totalHours += this.workday.endHour - this.workday.startHour;
      stats.brightHours += this.getBrightHoursForDay(elem, true, false);
      stats.brightHoursWithoutDST += this.getBrightHoursForDay(
        elem,
        false,
        false
      );
      stats.brightHoursPermanentDST += this.getBrightHoursForDay(
        elem,
        false,
        true
      );
    });
    return stats;
  }

  getBrightHoursForDay(day, usingDST, permanentDST) {
    let to, from;
    if (usingDST) {
      from = Math.max(day.sunriseHour, this.workday.startHour);
      to = Math.min(day.sunsetHour, this.workday.endHour);
    } else if (permanentDST) {
      from = Math.max(day.sunriseHourPermanentDst, this.workday.startHour);
      to = Math.min(day.sunsetHourPermanentDst, this.workday.endHour);
    } else {
      from = Math.max(day.sunriseHourWithoutDst, this.workday.startHour);
      to = Math.min(day.sunsetHourWithoutDst, this.workday.endHour);
    }
    return to - from;
  }
}

export default {
  DSTCalculator
};

/*



 */
