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
  ideas: {
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
    color: '#000000',
    ideaEfficiency: .1,
    level: 5,
  }, heaven: {
    color: '#FFD700',
    ideaEfficiency: .02,
    level: 1,
  }, light: {
    color: '#ffff89',
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
const resMap = {
  0: ['ideas', 'earth', 'water', 'plants', 'animals', 'dogs'],
  1: ['ideas', 'heaven', 'light', 'air', 'clouds', 'stars'],
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
        backgroundColor: resources[props.name].color,
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
    let state = {
      paused: false,
      previewCircle: null,
      builder: {
        heavenly: 0,
        source: 1,
        dest: 0,
        efficiency: 0,
        pressure: 0,
      },
      drawSpeed: .01 * 1000,
      completedCircles: [],
      circleIndex: 0,
      showBuilder: true,
      res: Object.keys(resources).reduce((result, r) => {
        result[r] = {
          amount: 0,
          visible: false,
        }
        return result
      }, {}),
    }
    state.res.earth.visible = true
    state.res.ideas.visible = true
    // Temp for testing...
    state = this.completeCircle(state, this.createCircle(state, true));
    state.tmCircle = this.createCircle(state, false);
    this.newSegments = state.tmCircle.segments.map(() => []);
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
      let typeDetails = s.type == 'arc' ?
        { center: [s.center[0], s.center[1]] } :
        {
          start: [s.start[0], s.start[1]],
          end: [s.end[0], s.end[1]],
        };
      segs.push({
        ...s,
        done: false,
        progress: [[0, 0]],
        ...typeDetails,
      });
    });
    return { segments: segs, params: circle.params, insideStart: circle.insideStart }
  }

  render() {
    let s = this.state;

    return (
      <div id="verticalFlex">
        <div id="flex">
          <div className="panel leftPanel">
            <table>
              <tbody>
                {Object.keys(resources).filter((name) => {
                  return s.res[name].visible
                }).map((name) => {
                  return <tr key={name}><td>{name.charAt(0).toUpperCase() + name.slice(1)}</td><td style={{ width: '100%' }}><Resource name={name} percent={100 * s.res[name].amount}></Resource></td></tr>
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
                  Heavenly
                  <input type="range" min="0" max="1" value={this.state.builder.heavenly}
                    onChange={(e) => {
                      this.setState({ builder: { ...this.state.builder, heavenly: parseInt(e.target.value) } }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>
                <div>
                  Consume
                  <input type="range" min="1" max="5" value={this.state.builder.source}
                    onChange={(e) => {
                      this.setState({ builder: { ...this.state.builder, source: parseInt(e.target.value) } }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>
                <div>
                  Create
                  <input type="range" min="0" max="5" value={this.state.builder.dest}
                    onChange={(e) => {
                      this.setState({ builder: { ...this.state.builder, dest: parseInt(e.target.value) } }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>
                <div>
                  Efficiency
                  <input type="range" min="0" max="4" value={this.state.builder.efficiency}
                    onChange={(e) => {
                      this.setState({ builder: { ...this.state.builder, efficiency: parseInt(e.target.value) } }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>
                <div>
                  Pressure
                  <input type="range" min="0" max="4" value={this.state.builder.pressure}
                    onChange={(e) => {
                      this.setState({ builder: { ...this.state.builder, pressure: parseInt(e.target.value) } }, this.createPreview);
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
    let spacing = 1.0 / state.builder.source;
    let outerAnchorRadius = state.builder.efficiency >= 3 ? .12 : .08;
    let innerAnchorRadius = state.builder.pressure >= 3 ? .12 : .08;
    let mainRadius = 1 - outerAnchorRadius;
    let enlargedAnchorRadius = outerAnchorRadius + .06;
    if (state.builder.heavenly == 1) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: 1,
        start: 0,
        end: 1,
      });
    }
    // dead code
    if (state.builder.source === 0) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: mainRadius,
        start: 0,
        end: 1,
      });
    }
    let outerAnchors = [];
    let enlargedOuterAnchors = [];
    for (let i = 0; i < state.builder.source; i++) {
      let rad = normalizedToRadians(spacing * i);

      outerAnchors.push({
        type: 'arc',
        center: [mainRadius * Math.cos(rad), mainRadius * Math.sin(rad)],
        radius: outerAnchorRadius,
        start: 0,
        end: 1,
      });
      enlargedOuterAnchors.push({
        type: 'arc',
        center: [mainRadius * Math.cos(rad), mainRadius * Math.sin(rad)],
        radius: enlargedAnchorRadius,
        start: 0,
        end: 1,
      });
    }
    segments.push(...outerAnchors);
    for (let i = 0; i < state.builder.source; i++) {
      let curA = outerAnchors[i];
      let nextA = outerAnchors[(i + 1) % state.builder.source];
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
    if (state.builder.efficiency >= 2) {
      for (let i = 0; i < state.builder.source; i++) {

        let curA = enlargedOuterAnchors[i];
        let tempSeg = {
          center: [0, 0],
          radius: mainRadius,
        }
        let sect0 = intersectCircles(tempSeg, curA, 'cw');
        let sect1 = intersectCircles(tempSeg, curA, 'ccw');
        sect0 = [sect0[0] - curA.center[0], sect0[1] - curA.center[1]];
        sect1 = [sect1[0] - curA.center[0], sect1[1] - curA.center[1]];
        let norm0 = radiansToNormalized(Math.atan2(sect0[1], sect0[0]));
        let norm1 = radiansToNormalized(Math.atan2(sect1[1], sect1[0]));
        if (norm0 < norm1) {
          segments.push({
            type: 'arc',
            center: curA.center,
            radius: enlargedAnchorRadius,
            start: norm0,
            end: norm1,
          })
        } else {
          segments.push({
            type: 'arc',
            center: curA.center,
            radius: enlargedAnchorRadius,
            start: norm0,
            end: 1,
          })
          segments.push({
            type: 'arc',
            center: curA.center,
            radius: enlargedAnchorRadius,
            start: 0,
            end: norm1,
          })
        }

      }
    }
    if (state.builder.efficiency >= 1) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: mainRadius - outerAnchorRadius,
        start: 0,
        end: 1,
      });
    }
    if (state.builder.efficiency >= 4) {
      for (let i = 0; i < state.builder.source; i++) {
        segments.push({
          type: 'arc',
          center: outerAnchors[i].center,
          radius: outerAnchorRadius / 2,
          start: 0,
          end: 1,
        });
      }
    }

    let insideStart = segments.length;
    let innerRadius = 0.4;
    if (state.builder.heavenly == 1) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: innerRadius + innerAnchorRadius,
        start: 0,
        end: 1,
      });
    }
    let innerAnchors = [];
    spacing = 1.0 / state.builder.dest;
    for (let i = 0; i < state.builder.dest; i++) {
      let rad = normalizedToRadians(.5 + spacing * i);

      innerAnchors.push({
        type: 'arc',
        center: [innerRadius * Math.cos(rad), innerRadius * Math.sin(rad)],
        radius: innerAnchorRadius,
        start: 0,
        end: 1,
      });
    }
    segments.push(...innerAnchors);
    for (let i = 0; i < state.builder.dest; i++) {
      let curA = innerAnchors[i];
      let nextA = innerAnchors[(i + 1) % state.builder.dest];
      let tempSeg = {
        center: [0, 0],
        radius: innerRadius,
      }
      let sect0 = intersectCircles(tempSeg, curA, 'cw');
      let sect1 = intersectCircles(tempSeg, nextA, 'ccw');
      let norm0 = radiansToNormalized(Math.atan2(sect0[1], sect0[0]));
      let norm1 = radiansToNormalized(Math.atan2(sect1[1], sect1[0]));
      if (norm0 < norm1) {
        segments.push({
          type: 'arc',
          center: [0, 0],
          radius: innerRadius,
          start: norm0,
          end: norm1,
        })
      } else {
        segments.push({
          type: 'arc',
          center: [0, 0],
          radius: innerRadius,
          start: norm0,
          end: 1,
        })
        segments.push({
          type: 'arc',
          center: [0, 0],
          radius: innerRadius,
          start: 0,
          end: norm1,
        })
      }
    }
    if (state.builder.pressure >= 1) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: innerRadius - innerAnchorRadius,
        start: 0,
        end: 1,
      });
    }
    if (state.builder.pressure >= 2) {
      for (let i = 0; i < state.builder.dest; i++) {
        let curCirc = innerAnchors[i];
        let tempLine = {
          start: [curCirc.center[0], curCirc.center[1]],
          end: [0, 0],
        };
        let end = [0, 0];
        let start = intersectLineCircle(tempLine, curCirc);
        if (state.builder.dest == 1) {
          end = [0, innerRadius - innerAnchorRadius];
        }
        let lenSq = (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2;
        segments.push({
          type: 'line',
          start,
          end,
          lenSq,
          len: Math.sqrt(lenSq),
        })
      }
    }
    if (state.builder.pressure >= 4) {
      for (let i = 0; i < state.builder.dest; i++) {
        segments.push({
          type: 'arc',
          center: innerAnchors[i].center,
          radius: innerAnchorRadius / 2,
          start: 0,
          end: 1,
        });
      }
    }


    return this.circleFromSegments(segments, done, insideStart, { ...state.builder });
  }

  circleFromSegments = (segments, done, insideStart, params) => {
    segments.forEach((segment) => {
      segment.progress = [[0, (done ? 1 : 0)]];
      if (!segment.lineWidth) {
        segment.lineWidth = 1
      }
      if (segment.type == 'arc') {
        segment.len = segment.radius * 2 * pi * (segment.end - segment.start);
      }
      segment.done = done;
    });
    return { segments, index: this.circleIndex++, done, params, insideStart }
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
    let insideDonePaths = [];
    let outsideDonePaths = [];
    tmCircle.segments.forEach((seg, segIndex) => {
      let donePaths = [];
      if (segIndex < tmCircle.insideStart) {
        donePaths = outsideDonePaths;
      } else {
        donePaths = insideDonePaths;
      }
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
      ctx.strokeStyle = ctx.strokeStyle = resources[resMap[tmCircle.params.heavenly][tmCircle.params.source]].color;
      for (const donePath of outsideDonePaths) {
        ctx.stroke(donePath);
      }
      ctx.strokeStyle = ctx.strokeStyle = resources[resMap[tmCircle.params.heavenly][tmCircle.params.dest]].color;
      for (const donePath of insideDonePaths) {
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
    s.res.earth.amount = this.addResource(s.res.earth, .001, 1)
  }

  addResource = (resource, amount, sourceAmount) => {
    let mul = 1
    // (2-2x)^(1/3, 1/2, 1, 2, 3)
    if (resource.amount > .5) {
      mul = (2 - 2 * resource.amount) ** 3
    }
    if (sourceAmount < .5) {
      mul *= 1 - Math.cos(pi * sourceAmount)
    }
    return resource.amount + mul * amount

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

function sign(x) {
  return x === 0 ? 1 : Math.sign(x);
}

// Finds the point on the line intersecting with the circle closest to the origin
function intersectLineCircle(line, circle) {
  let [x1, x2] = [line.start[0] - circle.center[0], line.end[0] - circle.center[0]];
  let [y1, y2] = [line.start[1] - circle.center[1], line.end[1] - circle.center[1]];
  let [dx, dy] = [x2 - x1, y2 - y1];
  let dr = Math.sqrt(dx * dx + dy * dy)
  let D = x1 * y2 - x2 * y1;
  let r = circle.radius;
  let DR = Math.sqrt(r * r * dr * dr - D * D) / (dr * dr);
  let xa = D * dy + sign(dy) * dx * DR + circle.center[0]
  let xb = D * dy - sign(dy) * dx * DR + circle.center[0]
  let ya = -D * dx + Math.abs(dy) * DR + circle.center[1]
  let yb = -D * dx - Math.abs(dy) * DR + circle.center[1]
  if (Math.abs(xa) < Math.abs(xb)) {
    return [xa, ya]
  }
  if (Math.abs(xb) < Math.abs(xa)) {
    return [xb, yb]
  }
  if (Math.abs(ya) < Math.abs(yb)) {
    return [xa, ya]
  }
  if (Math.abs(yb) < Math.abs(ya)) {
    return [xb, yb]
  }
  throw new Error("math is hard " + [xa, xb, ya, yb])
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
