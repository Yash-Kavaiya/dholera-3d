export function createTour(stops, onStop) {
  let index = 0;
  let elapsed = 0;
  let running = false;

  function show(i) {
    index = i;
    elapsed = 0;
    onStop(stops[index]);
  }

  return {
    get running() {
      return running;
    },
    start() {
      running = true;
      show(0);
    },
    next() {
      if (!running) return;
      if (index >= stops.length - 1) {
        running = false;
        return;
      }
      show(index + 1);
    },
    stop() {
      running = false;
    },
    update(dt) {
      if (!running) return;
      elapsed += dt;
      if (elapsed > 8.4) {
        if (index >= stops.length - 1) running = false;
        else show(index + 1);
      }
    },
  };
}
