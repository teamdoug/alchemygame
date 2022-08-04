import './App.css';
import React from "react";

const debug = true;
const forceReset = false;
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
    color: '#947e66',
    ideaEfficiency: 5,
    level: 1,
  }, water: {
    color: '#1144bd',
    ideaEfficiency: 15,
    level: 2,
  }, plants: {
    color: '#119915',
    ideaEfficiency: 45,
    level: 3,
  }, animals: {
    color: '#ffffff',
    ideaEfficiency: 120,
    level: 4,
  }, dogs: {
    color: '#cf1b1b',
    ideaEfficiency: 500,
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

const PROG = {
  'dest': [{
    ideaCost: .5,
    triggerResource: 'ideas',
    unlockSlider: ['dest', 1],
  }, {
    ideaCost: 1.5,
    unlockSlider: ['dest', 2],
  }, {
    ideaCost: 2,
    triggerResource: 'water',
    unlockSlider: ['dest', 3],
  }, {
    ideaCost: 4,
    triggerResource: 'plants',
    unlockSlider: ['dest', 4],
  }, {
    ideaCost: 8,
    triggerResource: 'animals',
    unlockSlider: ['dest', 5],
  }, {
    triggerResource: 'end',
  }],
  'source': [{
    triggerResource: 'water',
    unlockSlider: ['source', 2],
  }, {
    triggerResource: 'plants',
    unlockSlider: ['source', 3],
  }, {
    triggerResource: 'animals',
    unlockSlider: ['source', 4],
  }, {
    triggerResource: 'dogs',
    unlockSlider: ['source', 5],
  }, {
    triggerResource: 'end',
  }],
  'efficiency': [{
    ideaCost: 4,
    triggerResource: 'water',
    unlockSlider: ['efficiency', 1],
  }, {
    ideaCost: 6,
    triggerResource: 'plants',
    unlockSlider: ['efficiency', 2],
  }, {
    ideaCost: 8,
    triggerResource: 'animals',
    unlockSlider: ['efficiency', 3],
  }, {
    ideaCost: 12,
    triggerResource: 'dogs',
    unlockSlider: ['efficiency', 4],
  }, {
    triggerResource: 'end',
  }],
  'pressure': [{
    ideaCost: 6,
    triggerResource: 'plants',
    unlockSlider: ['pressure', 1],
  }, {
    ideaCost: 8,
    triggerResource: 'animals',
    unlockSlider: ['pressure', 2],
  }, {
    ideaCost: 16,
    triggerResource: 'dogs',
    unlockSlider: ['pressure', 3],
  }, {
    ideaCost: 20,
    unlockSlider: ['pressure', 4],
  }, {
    triggerResource: 'end',
  }],
}
const maxSource = 5
const maxDest = 5
const maxEfficiency = 4
const maxPressure = 4
const maxCircles = 12

const drawFactor = 1
const efficiencyFactor = 1
const distFudge = .05
const lineDistFudge = .001
const onArcSlop = .001
const onLineSlop = .0001


function Resource(props) {
  return <div className={'resource ' + (props.shiny ? 'shiny' : '')}>
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

function ResourceDiff(props) {
  let amount = -1
  let direction = " up hidden "
  if (props.gainFrac > -1) {
    direction = " up ";
    amount = props.gainFrac;
  }
  if (props.lossFrac > -1) {
    direction = " down ";
    amount = props.lossFrac;
  }
  if (amount === 0) {
    direction = " neutral "
  }
  amount = (Math.abs(amount) > .5) ? 3 : ((Math.abs(amount) > .1) ? 2 : 1)
  return <div className="resourceDiff">
    <div className={direction + " top " + (amount < 3 ? "hidden" : "")}></div>
    <div className={direction + " mid "}></div>
    <div className={direction + " bot " + (amount < 2 ? "hidden" : "")}></div>
  </div>
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
    if (storedState && !forceReset) {
      this.state = JSON.parse(storedState);
    } else {
      this.state = this.getInitState();
    }
    setTimeout(this.initCompletedCanvases, 0);
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
    this.resourceGainLoss = Object.keys(resources).reduce((result, r) => {
      result[r] = { gainFrac: -1, lossFrac: -1, gain: -1, loss: -1 }
      return result
    }, {})
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
      sliderUnlocks: {
        source: 1,
        dest: 0,
        efficiency: 0,
        pressure: 0,
      },
      curResearch: null,
      researchComplete: false,
      researchOpts: {},
      gameDone: false,
      prog: {
        'dest': 0,
        'source': 0,
        'efficiency': 0,
        'pressure': 0,
      },
      drawSpeed: .01,
      completedCircles: [],
      drawnCircles: Object.keys(resources).reduce((result, r) => {
        result[r] = {}
        return result
      }, {}),
      drawnDestTotals: Object.keys(resources).reduce((result, r) => {
        result[r] = 0
        return result
      }, {}),
      drawnTotal: 0,
      circleIndex: 0,
      showSelector: false,
      showBuilder: false,
      res: Object.keys(resources).reduce((result, r) => {
        result[r] = {
          amount: 0,
          visible: false,
          name: r,
          cap: 1,
          gain: 0,
          loss: 0,
        }
        return result
      }, {}),
      selectToDelete: false,
      selectedCirclesDelete: [],
    }
    state.res.earth.visible = true
    // Used to end prog chains by never being visible
    state.res.end = { visible: false }
    state.tmCircle = null; //this.createCircle(state, false);
    this.newSegments = []; //state.tmCircle.segments.map(() => []);
    state.buildCost = this.getBuildCost(state.builder);
    this.forceRedraw = true;
    return state;
  }

  initCompletedCanvases = () => {
    for (const circle of Object.values(this.state.completedCircles)) {
      this.completedCanvases[circle.index] = React.createRef();
      this.undrawnCompleted.set(circle.index, circle);
    }
  }

  completeCircle = (state, circle) => {
    circle.index = state.circleIndex++
    circle.done = true;
    let destName = destRes(circle)
    for (const seg of Object.values(circle.segments)) {
      seg.done = true
      seg.progress = [[0, 1]]
    }
    if (circle.key in state.drawnCircles[destName]) {
      state.drawnCircles[destName][circle.key] += 1
    } else {
      state.drawnCircles[destName][circle.key] = 1
    }
    state.drawnDestTotals[destName]++
    state.drawnTotal++
    state.completedCircles.push(circle);
    this.completedCanvases[circle.index] = React.createRef();
    this.undrawnCompleted.set(circle.index, circle);

    return state;
  }




  reset = () => {
    this.confirmingReset = false;
    this.resetLocalVars();
    let state = this.getInitState();
    this.setState(state, this.resizeCanvas());

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
    if (s.tmCircle !== null) {
      this.newSegments = s.tmCircle.segments.map(() => []);
    }
  }

  haveCost = () => {
    return Object.entries(this.state.buildCost).every(([name, cost]) => {
      if (this.state.res[name].amount < cost) {
        return false
      }
      return true
    })
  }

  startDraw = (pay) => {
    if (pay && !this.haveCost()) {
      return
    }
    if (pay) {
      Object.entries(this.state.buildCost).forEach(([name, cost]) => {
        this.state.res[name].amount -= cost;
      })
    }
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
    return { segments: segs, params: circle.params, insideStart: circle.insideStart, key: circle.key }
  }

  render() {
    let s = this.state;

    return (
      <div id="verticalFlex">
        <div id="flex">
          <div className="panel leftPanel">
            <div style={{ display: "flex" }}>
              <div style={{ flexGrow: 1 }}>
                {s.gameDone && <span>You win!</span>}
                <button style={/*spacer*/{ visibility: 'hidden' }}>S</button>
                {s.researchComplete &&
                  <button onClick={() => {
                    this.setState((s) => { this.completeResearch(s) });
                  }}>Complete Research</button>}
                {'source' in s.researchOpts && <button onClick={() => {
                  this.setState((s) => { this.startResearch(s, 'source') })
                }}>Source</button>}
                {'dest' in s.researchOpts && <button onClick={() => {
                  this.setState((s) => { this.startResearch(s, 'dest') })
                }}>Dest</button>}
                {'efficiency' in s.researchOpts && <button onClick={() => {
                  this.setState((s) => { this.startResearch(s, 'efficiency') })
                }}>Efficiency</button>}
                {'pressure' in s.researchOpts && <button onClick={() => {
                  this.setState((s) => { this.startResearch(s, 'pressure') })
                }}>Pressure</button>}
              </div>
              <div style={{ textAlign: 'right' }}>
                {debug &&
                  <button disabled={s.tmCircle === null} onClick={() => {
                    this.completeCircle(s, s.tmCircle);
                    this.drawCanvas(this.canvas, s.tmCircle, this.transform, true)
                  }}>Cheat Circle</button>}
                <button>Pause</button>
                <button onClick={this.reset}>Reset</button>
              </div>
            </div>
            <table>
              <tbody>
                {Object.keys(resources).filter((name) => {
                  return s.res[name].visible
                }).map((name) => {
                  let gl = this.resourceGainLoss[name];
                  return (<tr key={name}>
                    <td>{name.charAt(0).toUpperCase() + name.slice(1)}</td>
                    <td style={{ width: '100%' }}>
                      <Resource name={name} percent={100 * s.res[name].amount / s.res[name].cap} shiny={s.res[name].amount == s.res[name].cap}></Resource>
                    </td>
                    <td><ResourceDiff
                      gainFrac={gl.gainFrac}
                      lossFrac={gl.lossFrac}></ResourceDiff></td>
                    <td><button onClick={() => s.res[name].amount += .1}>+.1</button>
                      <button onClick={() => s.res[name].amount -= .1}>-.1</button></td>
                    <td>+{(gl.gain > -1 ? gl.gain : s.res[name].gain).toFixed(6)} -{(gl.loss > -1 ? gl.loss : s.res[name].loss).toFixed(6)}</td>
                  </tr>)
                })}
              </tbody>
            </table>
          </div>
          <div className="panel leftPanel narrow">
            <div className="big"><span style={s.showSelector ? { visibility: 'hidden' } : {}} onClick={() => this.setState({ showSelector: true, showBuilder: false })}>Selector&nbsp;&gt;</span>
              {!s.showBuilder && <span style={{ marginLeft: '8px' }} onClick={() => this.setState({ showBuilder: true, showSelector: false }, () => { this.resizePreview(); this.createPreview() })}>Builder&nbsp;&gt;</span>}</div>
            <div id="#selector">
              <div>
                {s.completedCircles.map((c) => {
                  return <canvas
                    onMouseEnter={() => { this.completedMouseEnter(c) }}
                    onMouseLeave={() => { this.completedMouseLeave(c) }}
                    ref={this.completedCanvases[c.index]} key={c.index}
                    className={"completedCircle " + (s.selectedCirclesDelete[c.index] ? 'destroySelect' : '')}
                    onClick={s.selectToDelete ? (
                      () => this.setState({
                        selectedCirclesDelete: { ...s.selectedCirclesDelete, [c.index]: !s.selectedCirclesDelete[c.index] }
                      })) : () => { }}
                  ></canvas>
                }, this)}
              </div>
            </div>
          </div>
          <div className="panel" id="mainPanel">
            {s.showBuilder && <div id="builderPanel">
              <div style={{ display: 'flex', margin: '5px', }}>
                <div onClick={(e) => { this.setState({ showBuilder: false }); e.preventDefault() }}>&lt;&nbsp;Builder</div>
                <div id="builderCost">
                  Cost: </div>
                <div style={{ flexGrow: 1, width: '100%' }}>
                  {Object.entries(s.buildCost).filter(([name, cost]) => cost > 0).
                    map(([name, cost]) => <div key={name} style={{ width: '100%' }}><Resource name={name} percent={100 * cost / s.res[name].cap} shiny={s.res[name].amount >= cost}></Resource></div>
                    )}
                </div>

              </div>
              <div id="builder">
                {/*<div>
                  Heavenly
                  </div>*/}
                {s.sliderUnlocks.source >= 2 && <div>
                  Consume
                  <input type="range" min="1" max={this.state.sliderUnlocks.source} value={this.state.builder.source}
                    onChange={(e) => {
                      this.setState((s) => {
                        let builder = { ...this.state.builder, source: parseInt(e.target.value) };
                        return { builder, buildCost: this.getBuildCost(builder) }
                      }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>}
                {s.sliderUnlocks.dest >= 1 && <div>
                  Create
                  <input type="range" min="0" max={this.state.sliderUnlocks.dest} value={this.state.builder.dest}
                    onChange={(e) => {
                      this.setState((s) => {
                        let builder = { ...this.state.builder, dest: parseInt(e.target.value) };
                        return { builder, buildCost: this.getBuildCost(builder) }
                      }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>}
                {s.sliderUnlocks.efficiency >= 1 && <div>
                  Efficiency
                  <input type="range" min="0" max={this.state.sliderUnlocks.efficiency} value={this.state.builder.efficiency}
                    onChange={(e) => {
                      this.setState((s) => {
                        let builder = { ...this.state.builder, efficiency: parseInt(e.target.value) };
                        return { builder, buildCost: this.getBuildCost(builder) }
                      }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>}
                {s.sliderUnlocks.pressure >= 1 && s.builder.dest != 0 && <div>
                  Pressure
                  <input type="range" min="0" max={this.state.sliderUnlocks.pressure} value={this.state.builder.pressure}
                    onChange={(e) => {
                      this.setState((s) => {
                        let builder = { ...this.state.builder, pressure: parseInt(e.target.value) };
                        return { builder, buildCost: this.getBuildCost(builder) }
                      }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>
                </div>}
                <div>
                  <canvas id="previewCanvas"
                    ref={this.previewCanvas}
                  ></canvas>
                </div>
                {s.completedCircles.length >= maxCircles && <span>Maximum circle count reached. Select circles to delete to draw more.</span>}
                <div style={{ display: 'flex' }}>
                  <div style={{ 'textAlign': 'left', 'flexGrow': 1 }}>
                    <button onClick={this.cancelDraw}>Cancel Drawing</button>
                  </div>
                  {debug && <div style={{ 'textAlign': 'right' }}>
                    <button
                      onClick={() => { this.startDraw(false) }}
                      disabled={s.completedCircles.length >= maxCircles || (s.tmCircle != null && !s.tmCircle.done)}
                    >Cheat Draw</button>
                  </div>}
                  <div style={{ 'textAlign': 'right' }}>
                    <button
                      onClick={() => { this.startDraw(true) }}
                      disabled={!this.haveCost() || s.completedCircles.length >= maxCircles || (s.tmCircle != null && !s.tmCircle.done)}
                    >Let's Draw It</button>
                  </div>
                </div>
              </div>
            </div>
            }
            {s.showSelector && <div id="selectorPanel">
              <div style={{ display: 'flex', margin: '5px', }}>
                <div onClick={(e) => { this.setState({ showSelector: false }); e.preventDefault() }}>&lt;&nbsp;Selector</div>
              </div>
              {/* TODO !selectToDelete && <span>Select a circle to see more info</span>*/}
              {!s.selectToDelete && <button onClick={(e) => { this.setState({ selectToDelete: true, selectedCirclesDelete: {}, }); e.preventDefault() }}>Destroy Circles</button>}
              {s.selectToDelete && <button onClick={(e) => { this.triggerDestruction(); e.preventDefault() }}>Destroy Selected Circles</button>}
              {s.selectToDelete && <button onClick={(e) => { this.setState({ selectToDelete: false, selectedCirclesDelete: {}, }); e.preventDefault() }}>Cancel Destruction</button>}

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

  triggerDestruction = () => {
    let s = this.state;
    Object.entries(s.selectedCirclesDelete).forEach(([index, val]) => {
      if (!val) {
        return
      }
      for (let i = 0; i < s.completedCircles.length; i++) {
        if (s.completedCircles[i].index == index) {
          s.completedCircles.splice(i, 1);
        }
      }
      delete this.completedCanvases[index];
    })
    s.selectedCirclesDelete = {}
    s.selectToDelete = false;
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
    if (state.builder.dest === 0) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: innerRadius,
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
    if (state.builder.pressure >= 1 && state.builder.dest != 0) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: innerRadius - innerAnchorRadius,
        start: 0,
        end: 1,
      });
    }
    if (state.builder.pressure >= 2 && state.builder.dest != 0) {
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
    if (state.builder.pressure >= 4 && state.builder.dest != 0) {
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

  cancelDraw = () => {
    this.state.tmCircle = null
    this.newSegments = [];
    this.drawCanvas(this.canvas, null, this.transform, true)
  }

  completedMouseEnter = (c) => {
    const [source, dest] = [sourceRes(c), destRes(c)]
    let gainFrac = c.gain;
    if (this.state.res[dest].gain > 0) {
      gainFrac /= this.state.res[dest].gain;
    }
    let lossFrac = c.loss;
    if (this.state.res[source].loss > 0) {
      lossFrac /= this.state.res[source].loss;
    }
    if (source === dest) {
      if (c.gain > c.loss) {
        this.resourceGainLoss[dest].gainFrac = gainFrac;
      } else {
        this.resourceGainLoss[source].lossFrac = lossFrac;
      }
    } else {
      this.resourceGainLoss[dest].gainFrac = gainFrac;
      this.resourceGainLoss[source].lossFrac = lossFrac;
    }
    this.resourceGainLoss[dest].gain = c.gain;
    this.resourceGainLoss[source].loss = c.loss;
  }

  completedMouseLeave = (c) => {
    const [source, dest] = [sourceRes(c), destRes(c)]
    this.resourceGainLoss[dest].gainFrac = -1;
    this.resourceGainLoss[source].lossFrac = -1;
    this.resourceGainLoss[dest].gain = -1;
    this.resourceGainLoss[source].loss = -1;
  }

  circleFromSegments = (segments, done, insideStart, params) => {
    if (params.dest == 0) {
      params.pressure = 0
    }
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
    return { segments, index: this.circleIndex++, done, params, insideStart, key: this.getCircleKey(params) }
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
    if (tmCircle === null) {
      return
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
            if (s === e) {
              continue
            }
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
            if (s === e) {
              continue
            }
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

  checkProg = (s) => {
    let gameDone = true;
    for (const res of Object.values(resMap[0])) {
      if (res == 'ideas') {
        continue
      }
      if (s.res[res].amount !== s.res[res].cap) {
        gameDone = false
        break
      }
    }
    if (gameDone) {
      s.gameDone = true;
    }
    if (s.curResearch) {
      if (s.res.ideas.amount >= s.curResearch.ideaCost) {
        s.researchComplete = true
      }
    }
    s.researchOpts = {}
    for (const type of Object.keys(PROG)) {
      let sProg = s.prog[type]
      let next = PROG[type][sProg]
      let ideaCost = next.ideaCost;
      if (s.res[next.triggerResource] && !s.res[next.triggerResource].visible) {
        continue
      }
      //console.log('check', type, ideaCost, s.prog[type])
      if (!ideaCost) {
        this.completeResearch(s, type)
        continue
      }
      if (ideaCost && s.curResearch === null) {
        s.researchOpts[type] = true;
      }
    }
    if (Object.keys(s.researchOpts).length == 1) {
      this.startResearch(s, Object.keys(s.researchOpts)[0])
    }
  }

  startResearch = (s, type) => {
    if (s.curResearch !== null) {
      return
    }
    let sProg = s.prog[type]
    let next = PROG[type][sProg]
    let ideaCost = next.ideaCost;
    s.curResearch = { type, ideaCost }
    s.res.ideas.cap = ideaCost;
    s.researchOpts = {}
  }

  getCircleKey = (params) => {
    return (params.source + "_" + params.dest + "_" +
      params.efficiency + "_" + params.pressure)
  }

  completeResearch = (s, type) => {
    if (!type && (!s.curResearch || (s.curResearch.ideaCost && s.res.ideas.amount < s.curResearch.ideaCost))) {
      return;
    }
    if (!type) {
      type = s.curResearch.type
    }
    let res = PROG[type][s.prog[type]]
    if (res.unlockSlider) {
      s.sliderUnlocks[res.unlockSlider[0]] = res.unlockSlider[1];
    }
    if (s.curResearch) {
      s.curResearch = null;
      s.res.ideas.amount = 0;
      s.researchComplete = false
    }
    s.prog[type] += 1;
  }

  update = (delta, debugFrame) => {
    let relDelta = delta / 1000;
    let forceResize = false;
    let callback = forceResize ? this.resizeCanvas : () => { };

    this.setState(state => {
      let s = state;
      this.updateResources(s);
      this.checkProg(s);
      let allDone = true;
      let drewSegment = false;
      if (s.tmCircle === null) {
        return {};
      }
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
          let onSegSlop = onArcSlop / seg.radius;


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
          let onSegSlop = onLineSlop / seg.len;
          if (this.mouseClicked) {
            let [relPos, distSq] = lineRelPosDistSq(this.mouseX, this.mouseY, seg);
            if (relPos >= -onSegSlop && relPos <= 1 + onSegSlop && distSq < lineDistFudge) {
              let [prevRelPos, prevDistSq] = lineRelPosDistSq(this.prevX, this.prevY, seg);
              if (prevRelPos >= -onSegSlop && prevRelPos <= 1 + onSegSlop && prevDistSq < lineDistFudge) {
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
        if (!drewSegment) {
          let deltaSize = relDelta * s.drawSpeed / seg.len * drawFactor;
          newSegs.push([progs[0][1], clamp(progs[0][1] + deltaSize)]);
          progs[0][1] += deltaSize;
          mergeArcs(progs, 0);
          drewSegment = true;
        }
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
    let baseIncome = .0001
    let baseConsumption = .00005
    for (const r of Object.keys(s.res)) {
      s.res[r].gain = 0
      s.res[r].loss = 0
    }
    let [_, gain] = this.calcResource(s, s.res.earth, baseIncome, { amount: 1, name: 'magic' }, null)
    s.res.earth.amount += gain
    s.res.earth.gain = gain
    for (const c of s.completedCircles) {
      let [sRes, dRes] = [sourceRes(c), destRes(c)];
      let [loss, gain] = this.calcResource(s, s.res[dRes], baseConsumption, s.res[sRes], c)
      if (isNaN(gain) || isNaN(loss)) {
        console.log('create ', dRes, ' +', gain, ', ', sRes, ' -', loss)
        throw new Error('nan')
      }
      s.res[sRes].loss += loss;
      s.res[dRes].gain += gain;
      c.gain = gain;
      c.loss = loss;
      s.res[dRes].amount += gain
      if (!s.res[dRes].visible) {
        s.res[dRes].visible = true
      }
      s.res[sRes].amount -= loss
    }
  }

  calcResource = (s, resource, amount, source, c) => {
    let { pressure, efficiency } = (c && c.params) || { pressure: 0, efficiency: 1 };
    if (resource.amount > .9999 * resource.cap) {
      resource.amount = resource.cap;
      return [0, 0];
    }
    let destMul = 1
    // (2-2x)^(1/3, 1/2, 1, 2, 3)
    if (resource.name != 'ideas' && resource.amount > .5) {
      let exp = [5, 3, 1, 0.5, 1 / 3][pressure];
      destMul = (2 - 2 * resource.amount) ** exp
    }
    let sourceMul = 1
    if (source.amount < .5) {
      sourceMul = 1 - Math.cos(pi * source.amount);
    }
    efficiency = [.1, .2, .3, .5, 1][efficiency] * 20
    if (resource.name == 'ideas') {
      efficiency *= resources[source.name].ideaEfficiency
    }
    if (source.name != 'magic') {
      efficiency *= Math.max(1, Math.log10(s.drawnTotal + 1) / Math.log10(20))
      efficiency *= Math.max(1, Math.log10(s.drawnDestTotals[resource.name] + 1))
      efficiency *= Math.sqrt(Object.keys(s.drawnCircles[resource.name]).length)
    }
    return [sourceMul * amount * destMul, destMul * amount * efficiency]
  }

  getBuildCost = (builder) => {
    let dest = builder.dest;
    let source = builder.source;
    let eff = builder.efficiency;
    let press = dest == 0 ? 0 : builder.pressure;
    let sourceCost = .15 + (dest / maxDest) * .35 +
      ((eff + 1) / (maxEfficiency + 1) * (press + 1) / (maxPressure + 1)) * .5
    let destCost = 0;
    if (eff > 0 || press > 0) {
      destCost = ((eff + 1) / (maxEfficiency + 1) * (press + 1) / (maxPressure + 1)) * .75;
    }
    if (dest == source) {
      return {
        [sourceRes(builder)]: Math.max(sourceCost, destCost),
      }
    }
    return {
      [sourceRes(builder)]: sourceCost,
      [destRes(builder)]: destCost,
    }
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
  return sq >= (radius - distFudge) ** 2 && sq <= (radius + distFudge) ** 2;
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

function destRes(circle) {
  let p = circle;
  if ('params' in circle) {
    p = circle.params;
  }
  return resMap[p.heavenly][p.dest]
}

function sourceRes(circle) {
  let p = circle;
  if ('params' in circle) {
    p = circle.params;
  }
  return resMap[p.heavenly][p.source]
}

export default App;
