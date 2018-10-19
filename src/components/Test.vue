<template>
    <div>
        <p>Test</p>
        <ul class="fruits"></ul>
    </div>
</template>

<script>
import d3 from "@/assets/d3";

export default {
  name: "Test",
  data() {
    return {};
  },
  mounted() {
    let data = ["apple", "pears", "oranges"];
    d3.selectAll(".fruits")
      .data(data)
      .enter()
      .append("li")
      .text(function(d) {
        return d;
      });
  }
};
</script>
