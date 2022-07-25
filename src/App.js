import './App.css';
import React from "react";

const debug = true;
const maxWidth = 2000;
const maxHeight = 1500;
const pi = Math.PI;
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const progressColor = '#333';
const doneColor = '#FFF';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.lastFrame = window.performance.now();
    this.lastSave = window.performance.now();
    this.canvas = React.createRef();
    this.width = 0;
    const storedState = localStorage.getItem("heartosisIGJ5Save");
    if (storedState) {
      this.state = JSON.parse(storedState);
    } else {
      this.state = this.getInitState();
    }
    this.resetLocalVars();
  }

  resetLocalVars = () => {
    this.prevX = 0;
    this.prevY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseClicked = false;
  };

  getInitState = () => {
    let tmCircle = {
      components: [{
        type: 'circle',
        radiusPercent: 80,
        progress: {
          arcs: [[0, 0]],
          done: false,
        }
      }],
    };
    let state = {
      paused: false,
      tmCircle: tmCircle,
    }
    this.prevInComponent = [false];
    return state;
  }

  reset = () => {
    this.confirmingReset = false;
    let state = this.getInitState();
    this.setState(state, this.resizeCanvas);
  }

  render() {
    let s = this.state;


    const canvas = this.canvas.current;

    if (canvas !== null) {
      this.drawCanvas(
        canvas, s.tmCircle,
      );
    }

    return (
      <div id="verticalFlex">
        <div className="header">
          <div className="headerTabs">
          </div>
          <div className="headerButtons">

          </div>
        </div>
        <div id="flex">
          <div className="panel" id="leftPanel">
          </div>
          <div className="panel" id="mainPanel">
            <canvas
              ref={this.canvas}
              onMouseMove={this.mouseMove}
              onMouseDown={this.mouseMove}
              onMouseUp={this.mouseMove}
              onMouseLeave={this.mouseMove}
              onTouchStart={this.touchMove}
              onTouchMove={this.touchMove}
              onTouchEnd={this.touchMove}
              onTouchCancel={this.touchMove}
            ></canvas>
          </div>
        </div>
      </div>
    );
  }

  drawCanvas = (canvas, tmCircle) => {
    const w = canvas.width;
    const h = canvas.height;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY);
    const ctx = this.canvas.current.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    tmCircle.components.forEach((component, index) => {
      let planPath = new Path2D();
      let donePaths = [];
      if (component.type === 'circle') {
        ctx.lineWidth = 2;
        planPath.arc(centerX, centerY, component.radiusPercent * radius / 100, 0, 2 * pi);
        for (const arc of component.progress.arcs) {
          let donePath = new Path2D();
          donePath.arc(centerX, centerY, component.radiusPercent * radius / 100, percentToRadians(arc[0]), percentToRadians(arc[1]));
          donePaths.push(donePath);
        }
      }
      ctx.strokeStyle = progressColor;
      ctx.stroke(planPath);
      ctx.strokeStyle = doneColor;
      for (const donePath of donePaths) {
        ctx.stroke(donePath);
      }

    });
  }

  mouseMove = (e) => {
    if (!this.canvas.current) {
      return;
    }
    if (e.type === "mouseleave") {
      this.mouseClicked = false;
      return;
    }
    if ((e.buttons & 1) === 1) {
      var rect = this.canvas.current.getBoundingClientRect();
      if (this.mouseClicked) {
        this.prevX = this.mouseX;
        this.prevY = this.mouseY;
      }
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      if (!this.mouseClicked) {
        this.prevX = this.mouseX;
        this.prevY = this.mouseY;
      }
      this.mouseClicked = true;
    } else {
      this.mouseClicked = false;
    }
  };

  touchMove = (e) => {
    if (!this.canvas.current) {
      return;
    }

    if (e.type === "touchcancel" || e.type === "touchend") {
      this.mouseClicked = false;
      return;
    }
    if (e.touches.length > 0) {
      var rect = this.canvas.current.getBoundingClientRect();
      if (this.mouseClicked) {
        this.prevX = this.mouseX;
        this.prevY = this.mouseY;
      }
      this.mouseX =
        e.touches[0].clientX - rect.left;
      this.mouseY =
        e.touches[0].clientY - rect.top;
      if (!this.mouseClicked) {
        this.prevX = this.mouseX;
        this.prevY = this.mouseY;
      }
      this.mouseClicked = true;
    } else {
      this.mouseClicked = false;
    }
  };

  resizeCanvas = () => {
    if (this.canvas.current !== null) {
      this.canvas.current.style.width = "100%";
      this.canvas.current.style.height = "100%";
      if (this.canvas.current.offsetWidth > maxWidth) {
        this.canvas.current.width = maxWidth;
        this.canvas.current.style.width = maxWidth + "px";
      } else {
        this.canvas.current.width = this.canvas.current.offsetWidth;
      }
      if (this.canvas.current.offsetHeight > maxHeight) {
        this.canvas.current.height = maxHeight;
        this.canvas.current.style.height = maxHeight + "px";
      } else {
        this.canvas.current.height = this.canvas.current.offsetHeight;
      }
      this.width = this.canvas.current.width;
    }

    if (this.state.paused) {
      this.forceUpdate();
    }
  };

  componentDidMount() {
    window.addEventListener("beforeunload", this.save);
    window.addEventListener("resize", this.resizeCanvas);
    this.resizeCanvas();
    if (debug) {
      this.reset();
    }
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.save);
    window.cancelAnimationFrame(this.renderID);
  }

  gameLoop = (tFrame) => {
    if (tFrame > this.lastSave + 10000) {
      this.save();
      this.lastSave = tFrame;
    }
    let delta = tFrame - this.lastFrame;
    if (delta > 1000) {
      if (debug) {
        console.log("delta too large: " + delta);
      }
      delta = 1000;
    }

    let minDelta = 1000 / 60;
    let debugFrame = false;
    if (tFrame % 1000 < minDelta) {
      debugFrame = true;
    }
    let loopCount = 0;
    while (delta > minDelta) {
      delta -= minDelta;
      if (this.state.paused) {
        continue;
      }
      loopCount += 1;
      this.update(minDelta, debugFrame);
      debugFrame = false;
    }
    if (debug && loopCount > 1) {
      //console.log("loops", loopCount);
    }
    this.lastFrame = tFrame - delta;
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  };

  update = (delta, debugFrame) => {
    let s = this.state;
    let relDelta = delta / 1000;
    let updates = {};
    const centerX = this.canvas.current.width / 2;
    const centerY = this.canvas.current.height / 2;
    const radius = Math.min(centerX, centerY);
    const ctx = this.canvas.current.getContext('2d');
    for (const [index, component] of s.tmCircle.components.entries()) {
      if (component.progress.done) {
        continue;
      }
      if (component.type === 'circle') {
        let arcs = component.progress.arcs;
        if (this.mouseClicked && circleContains(component.radiusPercent * radius / 100, this.mouseX - centerX, this.mouseY - centerY)) {
          let curRadians = Math.atan2(this.mouseY - centerY, this.mouseX - centerX);
          let curPercent = radiansToPercent(curRadians);
          if (!this.prevInComponent[index]) {
            // (change based on size??)
            addArc(arcs, [curPercent, curPercent + .25]);
          } else {
            let prevPercent = radiansToPercent(Math.atan2(this.prevY - centerY, this.prevX - centerX));
            let start = Math.min(prevPercent, curPercent);
            let end = Math.max(prevPercent, curPercent);
            if (end > 75 && start < 25) {
              addArc(arcs, [0, start]);
              addArc(arcs, [end, 100]);
            } else {
              addArc(arcs, [start, end]);
            }
          }
          this.prevInComponent[index] = true;
        } else {
          this.prevInComponent[index] = false;
        }

        arcs[0][1] += relDelta * 2;
        mergeArcs(arcs, 0);
        if (arcs[0][1] >= 100) {
          arcs[0][1] = 100;
          component.progress.arcs = [arcs[0]];
          component.progress.done = true;
        }
      }
      updates.tmCircle = s.tmCircle;
      break;
    }

    let forceResize = false;
    let callback = forceResize ? this.resizeCanvas : () => { };
    this.setState(updates, callback);

  }


  togglePause = () => {
    this.setState({ paused: !this.state.paused });
  };

  save = () => {
    localStorage.setItem("heartosisIGJ5Save", JSON.stringify(this.state));
  };

}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// Turn a percent of progress (starting at x=0,y=-1) into number of radians (starting at x=1,y=0)
function percentToRadians(percent) {
  return pi * percent / 50 - pi / 2;
}

// Reverse previous function
function radiansToPercent(radians) {
  let percent = (radians + pi / 2) * 50 / pi;
  return Math.round(4 * (((percent % 100) + 100) % 100)) / 4;
}

export function addArc(arcs, newArc) {
  for (const [index, arc] of arcs.entries()) {
    // start of newArc is in old arc
    if (newArc[0] >= arc[0] && newArc[0] <= arc[1]) {
      if (newArc[1] > arc[1]) {
        arc[1] = newArc[1];
        mergeArcs(arcs, index);
      }
      return;
    }
    // end of newArc is in old arc
    if (newArc[1] >= arc[0] && newArc[1] <= arc[1]) {
      if (newArc[0] < arc[0]) {
        arc[0] = newArc[0];
        mergeArcs(arcs, index);
      }
      return;
    }
    // new arc completely contains old arc
    if (newArc[0] <= arc[0] && newArc[1] >= arc[1]) {
      arc[0] = newArc[0];
      arc[1] = newArc[1];
      mergeArcs(arcs, index);
      return;
    }
    // we've gone past where we should be without overlap
    if (arc[0] > newArc[1]) {
      arcs.splice(index, 0, newArc);
      return;
    }
  }
  // new arc is past end of last arc
  arcs.push(newArc);
}

export function mergeArcs(arcs, index) {
  while (arcs.length > index + 1 && arcs[index][1] > arcs[index + 1][0]) {
    arcs[index][1] = Math.max(arcs[index + 1][1], arcs[index][1]);
    arcs.splice(index + 1, 1);
  }
  while (index > 0 && arcs.length > 1 && arcs[index][0] < arcs[index - 1][1]) {
    arcs[index - 1][0] = Math.min(arcs[index - 1][0], arcs[index][0]);
    arcs.splice(index, 1);
  }
}

function circleContains(radius, x, y) {
  let sq = x * x + y * y;
  let slop = Math.min(10, radius / 10);
  return sq >= (radius - slop) ** 2 && sq <= (radius + slop) ** 2;
}

export default App;
