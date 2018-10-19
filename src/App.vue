<template>
    <div id="app" class="container">
        <div class="row">
            <div class="col ">
                <h1 style="margin-top: 1rem">Does Daylight Savings Time save your daylight?</h1>
                <DSTViewer :tooltip-enabled="true"/>

                <p><a href="https://mühlemann.ch">Silvan Mühlemann</a>, 17. October 2018.</p>
            </div>
        </div>
    </div>
</template>

<script>
import DSTViewer from "./components/DSTViewer";

export default {
  name: "app",
  components: {
    DSTViewer
  }
};
</script>

<style lang="scss">
#app {
}
</style>
