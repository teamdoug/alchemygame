import './App.css';
import React from "react";

const debug = true;
const maxWidth = 4000;
const maxHeight = 4500;
const pi = Math.PI;
const progressColor = '#333';
const doneColor = '#FFF';
const completedSize = 100;
const resources = {
  idea: {
    color: '#7008a8',
    ideaEfficiency: 1,
  }, earth: {
    color: '#5c4219',
    ideaEfficiency: .01,
    level: 1,
  }, water: {
    color: '#1144bd',
    ideaEfficiency: .02,
    level: 2,
  }, plants: {
    color: '#119915',
    ideaEfficiency: .03,
    level: 3,
  }, animals: {
    color: '#a38f79',
    ideaEfficiency: .05,
    level: 4,
  }, dogs: {
    color: '#75716d',
    ideaEfficiency: .1,
    level: 5,
  }, heaven: {
    color: '#FFD700',
    ideaEfficiency: .02,
    level: 1,
  }, light: {
    color: '#fff069',
    ideaEfficiency: .03,
    level: 2,
  }, air: {
    color: '#87bbe6',
    ideaEfficiency: .05,
    level: 3,
  }, clouds: {
    color: '#bec1c2',
    ideaEfficiency: .08,
    level: 4,
  }, stars: {
    color: '#ffffff',
    ideaEfficiency: .13,
    level: 5,
  }
}

function Resource(props) {
  return <div className="resource">
    <div
      style={{
        width: props.percent + "%",
        postition: "absolute",
        top: 0,
        left: 0,
        height: '100%',
        backgroundColor: props.color,
      }}
    ></div></div>
}

class App extends React.Component {
  constructor(props) {
    super(props);
    if (debug) {
      window.game = this;
    }
    this.lastFrame = window.performance.now();
    this.lastSave = window.performance.now();
    this.canvas = React.createRef();
    this.previewCanvas = React.createRef();
    this.width = 800;
    this.height = 400;
    this.minAxis = 400;
    this.baseLineWidth = .01;
    this.resetLocalVars();
    const storedState = localStorage.getItem("heartosisIGJ5Save");
    if (storedState && !debug) {
      this.state = JSON.parse(storedState);
    } else {
      this.state = this.getInitState();
      this.reset();
    }
  }

  resetLocalVars = () => {
    this.prevX = 0;
    this.prevY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseClicked = false;
    this.completedCanvases = {};
    this.undrawnCompleted = new Map();
    this.forceRedraw = true;
    this.completedTransform = new DOMMatrix().translate(completedSize / 2, completedSize / 2).scale(completedSize * .9 / 2, -completedSize * .9 / 2);
  };

  getInitState = () => {
    let tmCircle = {
      segments: [{
        type: 'arc',
        done: false,
        center: [0, 0],
        radius: 1,
        start: 0,
        end: 1,
        len: 2 * pi,
        lineWidth: 1,
        progress: [[0, 0]],
      }, {
        type: 'arc',
        done: false,
        center: [0, 0],
        radius: 2 / 3,
        start: 0,
        end: .5,
        len: 2 * pi * 2 / 3 * .5,
        lineWidth: 1,
        progress: [[0, 0]],
      }, {
        type: 'arc',
        done: false,
        center: [0, 0],
        radius: 1 / 3,
        start: .5,
        end: 1,
        len: 2 * pi * 1 / 3 * .5,
        lineWidth: 1,
        progress: [[0, 0]],
      }, {
        type: 'arc',
        done: false,
        center: [0, 0],
        radius: 3 / 4,
        start: .75,
        end: 1,
        len: 2 * pi * 3 / 4 * .25,
        lineWidth: 1,
        progress: [[0, 0]],
      }, {
        type: 'arc',
        done: false,
        center: [0, 0],
        radius: 3 / 4,
        start: 0,
        end: .25,
        len: 2 * pi * 3 / 4 * .25,
        lineWidth: 1,
        progress: [[0, 0]],
      }, {
        type: 'arc',
        done: false,
        center: [0, 0],
        radius: 2 / 4,
        start: .25,
        end: .75,
        len: 2 * pi * 2 / 4 * .5,
        lineWidth: 1,
        progress: [[0, 0]],
      }, {
        type: 'line',
        done: false,
        start: [0, 0],
        end: [0.5, 0],
        lenSq: 0.5 ** 2,
        len: 0.5,
        lineWidth: 1,
        progress: [[0, 0]],
      }, {
        type: 'line',
        done: false,
        start: [0, 0],
        end: [0, 2 / 3],
        lenSq: (2 / 3) ** 2,
        len: (2 / 3),
        lineWidth: 1,
        progress: [[0, 0]],
      }, {
        type: 'line',
        done: false,
        start: [0, 1],
        end: [1, 0],
        lenSq: 1 + 1,
        len: Math.sqrt(2),
        lineWidth: 1,
        progress: [[0, 0]],
      }],
    };
    let state = {
      paused: false,
      tmCircle: tmCircle,
      previewCircle: null,
      builderOuterAnchors: 0,
      builderInnerAnchors: 0,
      drawSpeed: .01 * 1000,
      completedCircles: [],
      circleIndex: 0,
      showBuilder: true,
      res: {
        idea: 0,
        earth: 0,
        water: 0,
        plants: 0,
        animals: 0,
        dogs: 0,
        heaven: 0,
        light: 0,
        air: 0,
        clouds: 0,
        stars: 0,
      },
    }
    // Temp for testing...
    state = this.completeCircle(state, this.createCircle(state, true));
    this.newSegments = tmCircle.segments.map(() => []);
    this.forceRedraw = true;
    return state;
  }

  completeCircle = (state, circle) => {
    circle.index = state.circleIndex++
    circle.done = true;
    state.completedCircles.push(circle);
    this.completedCanvases[circle.index] = React.createRef();
    this.undrawnCompleted.set(circle.index, circle);

    return state;
  }

  reset = () => {
    this.confirmingReset = false;
    this.resetLocalVars();
    let state = this.getInitState();
    this.setState(state, this.resizeCanvas);
  }

  componentDidUpdate = () => {
    let s = this.state;
    if (this.canvas.current !== null) {
      this.drawCanvas(
        this.canvas, s.tmCircle, this.transform, this.forceRedraw
      );
    }

    for (const [index, circle] of this.undrawnCompleted) {
      console.log('index', index)
      this.completedCanvases[index].current.width = completedSize
      this.completedCanvases[index].current.height = completedSize
      this.drawCanvas(this.completedCanvases[index], circle, this.completedTransform, true)
    };
    this.undrawnCompleted = new Map();

    this.forceRedraw = false;
    this.newSegments = s.tmCircle.segments.map(() => []);
  }

  startDraw = () => {
    let tmCircle = this.clearCircle(this.state.previewCircle);
    this.setState({ tmCircle, showBuilder: false })
    this.forceRedraw = true;
    this.newSegments = tmCircle.segments.map(() => []);
  }

  clearCircle = (circle) => {
    let segs = [];
    circle.segments.forEach((s) => {
      segs.push({
        ...s,
        done: false,
        progress: [[0, 0]],
        center: [s.center[0], s.center[1]],
      });
    });
    return { segments: segs }
  }

  render() {
    let s = this.state;

    return (
      <div id="verticalFlex">
        <div id="flex">
          <div className="panel leftPanel">
            <table>
              <tbody>
              {Object.entries(resources).map((kv) => {
                let [name, info] = kv;
                return <tr key={name}><td>{name.charAt(0).toUpperCase() + name.slice(1)}</td><td style={{width: '100%'}}><Resource color={info.color} percent={100*s.res[name]}></Resource></td></tr>
              })}
              </tbody>
            </table>
          </div>
          <div className="panel leftPanel narrow">
            <h3>Transmutation Circles</h3>

            <h4>Selector {!s.showBuilder && <span onClick={() => this.setState({ showBuilder: true }, () => { this.resizePreview(); this.createPreview() })}>Builder &gt;</span>}</h4>
            <div id="#selector">
              <div>
                {s.completedCircles.map((c) => {
                  return <canvas ref={this.completedCanvases[c.index]} key={c.index} className="completedCircle"></canvas>
                }, this)}
              </div>
            </div>
          </div>
          <div className="panel" id="mainPanel">
            {s.showBuilder && <div id="builderPanel">
              <div id="closeBuilder" onClick={() => { this.setState({ showBuilder: false }) }}>X</div>
              <h4>Builder</h4>
              <div id="builder">
                <div>
                  Outer Anchors
                  <input type="range" min="0" max="6" value={this.state.builderOuterAnchors}
                    onChange={(e) => {
                      this.setState({ builderOuterAnchors: e.target.value }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>
                <div>
                  Inner Anchors
                  <input type="range" min="0" max="6" value={this.state.builderInnerAnchors}
                    onChange={(e) => {
                      this.setState({ builderInnerAnchors: e.target.value }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>
                <div>
                  <canvas id="previewCanvas"
                    ref={this.previewCanvas}
                  ></canvas>
                </div>
                <div style={{ 'textAlign': 'right' }}>
                  <button
                    onClick={this.startDraw}
                  >Let's Draw It</button>
                </div>
              </div>
            </div>
            }
            <div id="drawPanel">
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
      </div>
    );
  }

  createPreview = () => {
    let s = this.state;
    let previewCircle = this.createCircle(s, true);
    const previewCanvas = this.previewCanvas;
    if (this.previewCanvas.current !== null) {
      this.drawCanvas(previewCanvas, previewCircle, this.previewTransform, true)
    }
    this.setState({ previewCircle })
  }

  createCircle = (state, done) => {
    let segments = [];
    let spacing = 1.0 / state.builderOuterAnchors;
    let mainRadius = .9;
    if (state.builderOuterAnchors == 0) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: mainRadius,
        start: 0,
        end: 1,
      });
    }
    for (let i = 0; i < state.builderOuterAnchors; i++) {
      let rad = normalizedToRadians(spacing * i);

      segments.push({
        type: 'arc',
        center: [mainRadius * Math.cos(rad), mainRadius * Math.sin(rad)],
        radius: .15,
        start: 0,
        end: 1,
      });
    }
    for (let i = 0; i < state.builderOuterAnchors; i++) {
      let curA = segments[i];
      let nextA = segments[(i + 1) % state.builderOuterAnchors];
      let tempSeg = {
        center: [0, 0],
        radius: mainRadius,
      }
      let sect0 = intersectCircles(tempSeg, curA, 'cw');
      let sect1 = intersectCircles(tempSeg, nextA, 'ccw');
      let norm0 = radiansToNormalized(Math.atan2(sect0[1], sect0[0]));
      let norm1 = radiansToNormalized(Math.atan2(sect1[1], sect1[0]));
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: mainRadius,
        start: norm0,
        end: norm1,
      })
    }
    spacing = 1.0 / state.builderInnerAnchors;
    let innerRadius = 0.4;
    for (let i = 0; i < state.builderInnerAnchors; i++) {
      let rad = normalizedToRadians(.5 + spacing * i);

      segments.push({
        type: 'arc',
        center: [innerRadius * Math.cos(rad), innerRadius * Math.sin(rad)],
        radius: .15,
        start: 0,
        end: 1,
      });
    }
    return this.circleFromSegments(segments, done);
  }

  circleFromSegments = (segments, done) => {
    segments.forEach((segment) => {
      segment.progress = [[0, (done ? 1 : 0)]];
      if (!segment.lineWidth) {
        segment.lineWidth = 1
      }
      segment.len = segment.radius * 2 * pi * (segment.end - segment.start);
      segment.done = done;
    });
    return { segments, index: this.circleIndex++, done: false }
  }

  drawCanvas = (canvas, tmCircle, transform, forceRedraw) => {
    const w = canvas.current.width;
    const h = canvas.current.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(centerX, centerY);
    const ctx = canvas.current.getContext('2d');
    if (forceRedraw) {
      ctx.resetTransform();
      ctx.clearRect(0, 0, w, h);
    }
    ctx.setTransform(transform);
    ctx.lineCap = "round";
    let planPaths = [];
    let donePaths = [];
    tmCircle.segments.forEach((seg, segIndex) => {
      if (forceRedraw) {
        ctx.lineWidth = this.baseLineWidth * seg.lineWidth;
        if (seg.type === 'arc') {
          if (!seg.done && forceRedraw) {
            let planPath = new Path2D();
            planPath.arc(seg.center[0], seg.center[1], seg.radius, normalizedToRadians(seg.start), normalizedToRadians(seg.end), true);
            planPaths.push(planPath);
          }
          for (const [s, e] of seg.progress) {
            let donePath = new Path2D();
            let diff = seg.end - seg.start;
            let arcStart = diff * s + seg.start;
            let arcEnd = diff * e + seg.start;
            let normEnd = normalizedToRadians(arcEnd);
            // Fudge so that there's not a discontinuity at the top of circles.
            if (seg.progress[0][0] === 0 && e === 1) {
              normEnd -= .001;
            }
            donePath.arc(seg.center[0], seg.center[1], seg.radius, normalizedToRadians(arcStart), normEnd, true);
            donePaths.push(donePath);
          }
        } else if (seg.type === 'line') {
          if (!seg.done) {
            let planPath = new Path2D();
            planPath.moveTo(seg.start[0], seg.start[1]);
            planPath.lineTo(seg.end[0], seg.end[1]);
            planPaths.push(planPath);
          }
          for (const [s, e] of seg.progress) {
            let donePath = new Path2D();
            let diffX = seg.end[0] - seg.start[0];
            let diffY = seg.end[1] - seg.start[1];
            let arcStart = [diffX * s + seg.start[0], diffY * s + seg.start[1]];
            let arcEnd = [diffX * e + seg.start[0], diffY * e + seg.start[1]];
            donePath.moveTo(arcStart[0], arcStart[1]);
            donePath.lineTo(arcEnd[0], arcEnd[1]);
            donePaths.push(donePath);
          }
        }
        ctx.strokeStyle = progressColor;
        for (const planPath of planPaths) {
          ctx.stroke(planPath);
        }
      } else {
        if (seg.type === 'arc') {
          this.newSegments[segIndex].forEach(([s, e]) => {
            let donePath = new Path2D();
            let diff = seg.end - seg.start;
            let arcStart = diff * s + seg.start;
            let arcEnd = diff * e + seg.start;
            let normEnd = normalizedToRadians(arcEnd);
            // Fudge so that there's not a discontinuity at the top of circles.
            if (seg.progress[0][0] === 0 && e === 1) {
              normEnd -= .001;
            }
            donePath.arc(seg.center[0], seg.center[1], seg.radius, normalizedToRadians(arcStart), normEnd, true);
            donePaths.push(donePath);
          });
        } else if (seg.type === 'line') {
          this.newSegments[segIndex].forEach(([s, e]) => {
            let donePath = new Path2D();
            let diffX = seg.end[0] - seg.start[0];
            let diffY = seg.end[1] - seg.start[1];
            let arcStart = [diffX * s + seg.start[0], diffY * s + seg.start[1]];
            let arcEnd = [diffX * e + seg.start[0], diffY * e + seg.start[1]];
            donePath.moveTo(arcStart[0], arcStart[1]);
            donePath.lineTo(arcEnd[0], arcEnd[1]);
            donePaths.push(donePath);
          });
        }
      }
      ctx.strokeStyle = doneColor;
      for (const donePath of donePaths) {
        ctx.stroke(donePath);
      }

    });
  }


  update = (delta, debugFrame) => {
    let relDelta = delta / 1000;
    let forceResize = false;
    let callback = forceResize ? this.resizeCanvas : () => { };

    this.setState(state => {
      let s = state;
      let allDone = true;
      this.updateResources(s);
      for (const [segIndex, seg] of s.tmCircle.segments.entries()) {
        if (seg.done) {
          continue;
        }
        allDone = false;
        let newSegs = [];
        let progs = seg.progress;

        if (seg.type === 'arc') {
          let relX = this.mouseX - seg.center[0];
          let relY = this.mouseY - seg.center[1];
          let circle = (seg.start === 0) && (seg.end === 1)
          let onSegSlop = .001 * seg.radius;


          if (this.mouseClicked && circleContains(seg.radius, relX, relY)) {
            let curRadians = Math.atan2(relY, relX);
            let curNormalized = radiansToNormalized(curRadians);
            let [curNormStart, curNormEnd] = normAndOrder(circle, curNormalized - onSegSlop,
              curNormalized + onSegSlop);
            if ((seg.end >= curNormEnd && curNormEnd >= seg.start) ||
              (seg.start <= curNormStart && curNormStart <= seg.end)) {
              curNormEnd = Math.min(seg.end, curNormEnd);
              curNormStart = Math.max(seg.start, curNormStart);
              let diff = seg.end - seg.start;
              let curArcStart = (curNormStart - seg.start) / diff;
              let curArcEnd = (curNormEnd - seg.start) / diff;
              let prevRelX = this.prevX - seg.center[0];
              let prevRelY = this.prevY - seg.center[1];
              let prevNormalized = radiansToNormalized(Math.atan2(prevRelY, prevRelX));
              let [prevNormStart, prevNormEnd] = normAndOrder(circle, prevNormalized - onSegSlop,
                prevNormalized + onSegSlop);
              if (circleContains(seg.radius, prevRelX, prevRelY) && ((
                seg.end >= prevNormEnd && prevNormEnd >= seg.start) ||
                (seg.start <= prevNormStart && prevNormStart <= seg.end))) {
                prevNormEnd = Math.min(seg.end, prevNormEnd);
                prevNormStart = Math.max(seg.start, prevNormStart);
                let prevArcStart = (prevNormStart - seg.start) / diff;
                let prevArcEnd = (prevNormEnd - seg.start) / diff;
                let [start, end] = normAndOrder(circle, Math.min(prevArcStart, curArcStart),
                  Math.max(prevArcEnd, curArcEnd));

                if (end > .75 && start < .25) {
                  addArc(progs, [0, start]);
                  addArc(progs, [end, 1]);
                  newSegs.push([0, start], [end, 1])
                } else {
                  if (end - start > 0.25) {
                  }
                  addArc(progs, [start, end]);
                  newSegs.push([start, end])
                }
              } else {

                if (curArcEnd > .75 && curArcStart < .25) {
                  addArc(progs, [0, curArcStart]);
                  addArc(progs, [curArcEnd, 1]);
                  newSegs.push([0, curArcStart], [curArcEnd, 1])
                } else {
                  addArc(progs, [curArcStart, curArcEnd]);
                  newSegs.push([curArcStart, curArcEnd])
                }
              }

            }
          }


        } else if (seg.type === 'line') {
          let onSegSlop = .001 * seg.len;
          if (this.mouseClicked) {
            let [relPos, distSq] = lineRelPosDistSq(this.mouseX, this.mouseY, seg);
            if (relPos >= -onSegSlop && relPos <= 1 + onSegSlop && distSq < .005) {
              let [prevRelPos, prevDistSq] = lineRelPosDistSq(this.prevX, this.prevY, seg);
              if (prevRelPos >= -onSegSlop && prevRelPos <= 1 + onSegSlop && prevDistSq < .005) {
                let startPos = clamp(Math.min(relPos, prevRelPos) - onSegSlop);
                let endPos = clamp(Math.max(relPos, prevRelPos) + onSegSlop);
                addArc(progs, [startPos, endPos]);
                newSegs.push([startPos, endPos])
              } else {
                let arc = [clamp(prevRelPos - onSegSlop), clamp(prevRelPos + onSegSlop)];
                addArc(progs, arc);
                newSegs.push(arc);
              }
            }
          }
        }
        let deltaSize = relDelta * s.drawSpeed / seg.len;
        newSegs.push([progs[0][1], clamp(progs[0][1] + deltaSize)]);
        progs[0][1] += deltaSize;
        mergeArcs(progs, 0);
        newSegs.forEach((newSeg) => {
          progs.forEach((prog) => {
            if (overlaps(newSeg, prog)) {
              this.newSegments[segIndex].push(prog)
            }
          });

        });
        if (progs[0][1] >= 1) {
          progs[0][1] = 1;
          seg.progress = [progs[0]];
          seg.done = true;
          this.forceRedraw = true;
        }

      }
      if (allDone && !s.tmCircle.done) {
        s.tmCircle.done = true
        this.completeCircle(s, s.tmCircle)
      }
      return { tmCircle: s.tmCircle };

    }, callback);

  }

  updateResources = (s) => {
    s.res.earth = this.addResource(s.res.earth, .001, 1)
  }

  addResource = (resource, amount, sourceAmount) => {
    let mul = 1
    // (2-2x)^(1/3, 1/2, 1, 2, 3)
    if (resource > .5) {
      mul = (2 - 2 * resource) ** 3
    }
    if (sourceAmount < .5) {
      mul *= 1 - Math.cos(pi * sourceAmount)
    }
    return resource + mul * amount

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
      this.transform = new DOMMatrix().translate(this.width / 2, this.height / 2).scale(this.minAxis / 2, -this.minAxis / 2);
      this.inverseTransform = this.transform.inverse();
      context.setTransform(this.transform);
    }

    this.resizePreview();

    if (this.state.paused) {
      this.forceUpdate();
    }
    this.forceRedraw = true;
    this.createPreview();
  };


  resizePreview = () => {
    if (this.previewCanvas.current !== null) {
      let width = this.previewCanvas.current.getBoundingClientRect().width;
      this.previewCanvas.current.style.height = width + 'px';
      this.previewCanvas.current.width = this.previewCanvas.current.offsetWidth;
      this.previewCanvas.current.height = this.previewCanvas.current.offsetHeight;
      this.previewWidth = this.previewCanvas.current.width;
      this.previewHeight = this.previewCanvas.current.height;
      let context = this.previewCanvas.current.getContext('2d');
      this.previewTransform = new DOMMatrix().translate(this.previewWidth / 2, this.previewWidth / 2).scale(this.previewWidth / 2 * .9, -this.previewWidth / 2 * .9);
      this.previewInverseTransform = this.previewTransform.inverse();
      context.setTransform(this.previewTransform);
    }
  }
  componentDidMount() {
    window.addEventListener("beforeunload", this.save);
    window.addEventListener("resize", this.resizeCanvas);
    this.resizeCanvas();
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

// Force into [0, 1]
function norm(x) { return ((x % 1) + 1) % 1 }

function clamp(x) { return Math.min(1, Math.max(0, x)) }

function normAndOrder(circle, x, y) {
  let n = norm;
  if (!circle) {
    n = clamp;
  }
  let [nx, ny] = [n(x), n(y)];
  return [Math.min(nx, ny), Math.max(nx, ny)];
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
  let slop = .02
  return sq >= (radius - slop) ** 2 && sq <= (radius + slop) ** 2;
}

// [relative position along line segment, distance squared]
function lineRelPosDistSq(x, y, seg) {
  let [s, e] = [seg.start, seg.end];
  let distSq = ((e[0] - s[0]) * (s[1] - y) - (s[0] - x) * (e[1] - s[1])) ** 2 / seg.lenSq;
  let relPos = ((x - s[0]) * (e[0] - s[0]) + (y - s[1]) * (e[1] - s[1])) / seg.lenSq;
  return [relPos, distSq];
}

function intersectCircles(segMain, segAlt, dir) {
  if (segMain.center[0] != 0 || segMain.center[1] != 0) {
    throw new Error("segMain must be centered at 0. idk")
  }
  let [ax, ay] = segAlt.center;
  let [mr, ar] = [segMain.radius, segAlt.radius];
  if (Math.abs(ax) < 0.00001) {
    let y = (ar * ar - mr * mr - ay * ay) / (-2 * ay);
    let x = Math.sqrt(mr * mr - y * y);
    let mul = (dir == 'cw' ? 1 : -1);
    return [mul * (y > 0 ? x : -x), y];
  }
  if (Math.abs(ay) < 0.00001) {
    let x = (ar * ar - mr * mr - ax * ax) / (-2 * ax);
    let y = Math.sqrt(mr * mr - x * x);
    let mul = (dir == 'ccw' ? 1 : -1);
    return [x, mul * (x > 0 ? y : -y)];
  }
  let ycoeff = - ay / ax;
  let ycons = (ar * ar - mr * mr - ay * ay - ax * ax) / (-2 * ax);
  let a = ycoeff * ycoeff + 1
  let b = 2 * ycons * ycoeff
  let c = ycons * ycons - mr * mr;
  let radical = Math.sqrt(b * b - 4 * a * c);
  let y1 = (- b + radical) / (2 * a);
  let y2 = (- b - radical) / (2 * a);
  let xf = (y) => { return (ar * ar - mr * mr - ay * ay + 2 * ay * y - ax * ax) / (-2 * ax) }
  let [x1, x2] = [xf(y1), xf(y2)];
  if (Math.sign(x1) === Math.sign(x2)) {
    let mul = (Boolean(Math.sign(x1) > 0) !== (dir === 'cw') ? -1 : 1);
    return mul * y1 < mul * y2 ? [x1, y1] : [x2, y2];
  }
  if (Math.sign(y1) === Math.sign(y2)) {
    let mul = (Boolean(Math.sign(y1) > 0) !== (dir === 'cw') ? -1 : 1);
    return mul * x1 < mul * x2 ? [x1, y1] : [x2, y2];
  }
  throw new Error('too far' + [x1, y1, x2, y2])
}

function overlaps(s, t) {
  if (s[0] >= t[0] && s[0] <= t[1]) {
    return true;
  }
  if (s[1] >= t[0] && s[1] <= t[1]) {
    return true;
  }
  if (s[0] <= t[0] && s[1] >= t[1]) {
    return true;
  }
  return false;
}

export default App;
