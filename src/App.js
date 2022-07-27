import './App.css';
import React from "react";

const debug = true;
const maxWidth = 4000;
const maxHeight = 4500;
const pi = Math.PI;
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const progressColor = '#333';
const doneColor = '#FFF';


class App extends React.Component {
  constructor(props) {
    super(props);
    if (debug) {
      window.game = this;
    }
    this.lastFrame = window.performance.now();
    this.lastSave = window.performance.now();
    this.canvas = React.createRef();
    this.width = 800;
    const storedState = localStorage.getItem("heartosisIGJ5Save");
    if (storedState) {
      this.state = JSON.parse(storedState);
    } else {
      this.state = this.getInitState();
    }
    this.height = 400;
    this.minAxis = 400;
    this.baseLineWidth = .01;
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
        radius: .8,
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
    ctx.resetTransform();
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(this.transform);

    tmCircle.components.forEach((component, index) => {
      let planPath = new Path2D();
      let donePaths = [];
      if (component.type === 'circle') {
        ctx.lineWidth = this.baseLineWidth;
        planPath.arc(0, 0, component.radius, 0, 2 * pi);
        for (const arc of component.progress.arcs) {
          let donePath = new Path2D();
          donePath.arc(0, 0, component.radius, normalizedToRadians(arc[0]), normalizedToRadians(arc[1]), true);
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


  update = (delta, debugFrame) => {
    let s = this.state;
    let relDelta = delta / 1000;
    let updates = {};
    for (const [index, component] of s.tmCircle.components.entries()) {
      if (component.progress.done) {
        continue;
      }
      if (component.type === 'circle') {
        let arcs = component.progress.arcs;
        if (this.mouseClicked && circleContains(component.radius, this.mouseX, this.mouseY)) {
          let curRadians = Math.atan2(this.mouseY, this.mouseX);
          let curNormalized = radiansToNormalized(curRadians);
          if (!this.prevInComponent[index]) {
            // (change based on size??)
            addArc(arcs, [curNormalized - .0025, curNormalized + .0025]);
          } else {
            let prevNormalized = radiansToNormalized(Math.atan2(this.prevY, this.prevX));
            let start = (Math.min(prevNormalized - .0025, curNormalized - .0025) + 1) % 1;
            let end = (Math.max(prevNormalized + .0025, curNormalized + .0025) + 1) % 1;
            if (start > end) {
              [start, end] = [end, start];
            }
            if (end > .75 && start < .25) {
              addArc(arcs, [0, start]);
              addArc(arcs, [end, 1]);
            } else {
              addArc(arcs, [start, end]);
            }
          }
          this.prevInComponent[index] = true;
        } else {
          this.prevInComponent[index] = false;
        }

        arcs[0][1] += relDelta / 50;
        mergeArcs(arcs, 0);
        if (arcs[0][1] >= 1) {
          arcs[0][1] = 1;
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


  
  mouseMove = (e) => {

    if (!this.canvas.current) {
      return;
    }
    if (e.type === "mouseleave") {
      this.mouseClicked = false;
      return;
    }
    if ((e.buttons & 1) === 1 || true) {
      var rect = this.canvas.current.getBoundingClientRect();
      //if (this.mouseClicked) {
        this.prevX = this.mouseX;
        this.prevY = this.mouseY;
      //}
      let point = this.inverseTransform.transformPoint(new DOMPoint(e.clientX - rect.left, e.clientY - rect.top));
      this.mouseX = point.x;
      this.mouseY = point.y;
      if (!this.mouseClicked && false) {
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
    // TODO fix for touch/multitouch (hm)
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
      let point = new DOMPoint(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      point = this.inverseTransform.transformPoint(point);
      this.mouseX = point.x;
      this.mouseY = point.y;
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
      this.height = this.canvas.current.height;
      this.fullMinAxis = Math.min(this.width, this.height);
      this.minAxis = this.fullMinAxis * 0.9;
      let context = this.canvas.current.getContext('2d');
      this.transform = new DOMMatrix().translate(this.width/2, this.height/2).scale(this.minAxis/2, -this.minAxis/2);
      this.inverseTransform = this.transform.inverse();
      context.setTransform(this.transform);
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

// Turn 0-1 (starting at x=0,y=1) into number of radians (starting at x=1,y=0)
function normalizedToRadians(normalized) {
  return - pi * normalized * 2 + pi / 2;
}

// Reverse previous function
function radiansToNormalized(radians) {
  let normalized = (radians - pi / 2) / -2 / pi;
  return ((normalized % 1) + 1) % 1;
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
  let slop = Math.min(.05, radius / 20);
  return sq >= (radius - slop) ** 2 && sq <= (radius + slop) ** 2;
}

export default App;
