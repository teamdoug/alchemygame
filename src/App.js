import './App.css';
import React from "react";
import { ReactComponent as Lily } from './lily_crop.svg';
import { ReactComponent as Pause } from './pause.svg';
import { ReactComponent as Play } from './play.svg';
import { ReactComponent as Gear } from './gear.svg';
import { toHaveFormValues } from '@testing-library/jest-dom/dist/matchers';


const gameDebug = true;
const debug = false;
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
    level: 0,
  }, earth: {
    color: '#947e66',
    ideaEfficiency: 5,
    level: 1,
  }, water: {
    color: '#1144bd',
    ideaEfficiency: 25,
    level: 2,
  }, plants: {
    color: '#119915',
    ideaEfficiency: 100,
    level: 3,
  }, animals: {
    color: '#ffffff',
    ideaEfficiency: 300,
    level: 4,
  }, dogs: {
    color: '#cf1b1b',
    ideaEfficiency: 800,
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
  }, magic: {
    level: 1,
  }
}
const resMap = {
  0: ['ideas', 'earth', 'water', 'plants', 'animals', 'dogs'],
  1: ['ideas', 'heaven', 'light', 'air', 'clouds', 'stars'],
}

const initStory = 'Woof! In the beginning God created the heavens and the earth. ' +
  '6 days later, Dog was playing with a frisbee while God rested when she realized it ' +
  'wasn\'t actually a frisbee. It was a transmutation circle God had used ' +
  'to create the world. Dog thought she could make a better world, so she decided ' +
  'to take some of the earth God had created to build her own transmutation circles. ' +
  'She was going to make her own Doggy Dog World, but everything will go a little better with Dog\'s best friend, Human.';

const story = [
  [{ dest: 0 }, {}, 'Hi! I\'m Dog. I\'m so excited to build a world with you.', {confirm: "Hello, Dog"}],
  
  [{}, {}, 'With some of this earth, we can build a template for a circle. Once we draw ' +
    'the circle, it will give me inspiration for new patterns.', { confirm: 'Let\'s do this' }],

  [{ dest: 0 }, { startedDrawing: true }, 'I\'ll start drawing the circle. It\'ll be finished in no time.',
  { confirm: 'I believe in you', delay: (debug ? 0 : 4) }],

  [{ dest: 0 }, { startedDrawing: true }, 'Turns out drawing with my paws is really slow. I\'ll get better ' +
    'with practice, but do you think you can help me a little, Human?',
  { state: { canDraw: true }, confirm: 'I love drawing' }],

  [{ dest: 0 }, { canDraw: true }, 'Thanks! I bet you\'ll be great at drawing.', { noConfirm: true }],

  [{ dest: 0 }, { drawnTotal: 1 }, 'That\'s a nice circle. It\'s starting to give me some inspiration already. ' +
    'Once my Inspiration Hat fills up, I\'ll have a great idea, and you can ask me to share it.', { confirm: 'I can\'t wait!', state: { unlockedSelector: true } }],

  [{}, { unlockedSelector: true }, 'If you ever decide you don\'t like a circle, you can delete it with the Destructor',
  { confirm: 'Yikes, I\'ll keep that in mind' }],

  [{}, { drawnTotal: 12, unlockedSelector: true }, 'By the way, we can\'t have more than 12 circles without destabilizing ' +
    'the world. You can use the Destructor to delete some existing ones to make more better circles.', { confirm: 'Oof, seems worth it.' }],

  [{ dest: 0 }, { researchConfirmed: true }, 'Ok, what if we take this earth, and use it to make...', { confirm: 'Make what?' }],

  [{ dest: 0 }, { researchConfirmed: true }, 'MORE EARTH!', { confirm: 'NO  WAY!' }],

  // Complete research after this?
  [{ dest: 0 }, { researchConfirmed: true }, 'I amaze myself sometimes. You can use the builder to change what the circle will ' +
    'create now. We could make more earth, or we can make some more inspiration. ' +
    'I think I\'ll need a lot more inspiration for my next idea, though.', { noConfirm: true, completeResearch: true }],

  [{ dest: 1 }, { researchConfirmed: true }, 'I\'ve been thinking hard, and what if we made something new? What if we took ' +
    'this earth and transformed it into water? Pretty neat, right?', { confirm: 'Pretty neat' }],

  [{ dest: 1 }, { researchConfirmed: true }, 'Also, I\'ve noticed that we\'ve been hard at work making earth and more earth, but we\'re not filling the world with as much earth ' +
    'as I was expecting. It seems the void is pushing back on the transmutation when there\'s ' +
    'too much earth. This seems like a future problem for now, but I\'ll start thinking about ways to push harder.',
  { confirm: 'Push it' }],

  // Complete research
  [{ dest: 1 }, { researchConfirmed: true }, 'In the meantime, we\'re going to need some water before I can come up with my next idea.',
  { completeResearch: true, confirm: 'Let\'s make some water' }],

  [{}, { madewater: true }, 'This water is great for swimming in! Less good for bathing in. We can use this water to make ' +
    'more inspiration, more earth, or even more water. I\'ll let you decide which.', { confirm: 'So many options!' }],

  // Present research decision
  [{}, { madewater: true }, 'There are two things I\'m thinking of right now. One will give us a new resource, and ' +
    'one will help us make things faster. Which do you think I should work on?', { noConfirm: true }],

  [{ dest: 2, efficiency: 0 }, { curResearch: 'dest' }, 'I love new things!', { confirm: "Let\'s do it", delay: (debug ? 0 : 5) }],

  [{ dest: 2, efficiency: 0 }, { curResearch: 'dest' },
    'Hm, this research could be going faster. I bet water will generate a lot more inspiration than earth.', { noConfirm: true }],

  [{ dest: 2, efficiency: 1 }, { curResearch: 'dest' }, 'I love new things!', { noConfirm: true }],

  [{ dest: 2 }, { curResearch: 'efficiency' }, 'Faster it is!', { confirm: true, delay: (debug ? 0 : 5) }],

  [{ dest: 2 }, { curResearch: 'efficiency' },
    'Hm, this research could be going faster. I bet water will generate a lot more inspiration than earth.', { noConfirm: true }],

  [{}, { curResearch: 'efficiency', researchConfirmed: true },
  'If we change our outer circle some, I think we can make our transmutations more ' +
  'efficient. The circles will cost more, but they\'ll generate more for the same input.', { completeResearch: true, confirm: 'Hm, tradeoffs' }],

  [{ efficiency: 1 }, {},
  'As we make more circles, our previous circles become more powerful. ' +
  'Each circle we create powers up circles that make the same thing, especially if it\'s a new circle.', { confirm: 'More powerful circles are great!' }],

  [{ efficiency: 1, dest: 2 }, {}, 'Only one thing left to think about! I\'ll figure out what resource to make next.', { noConfirm: true }],

  [{ dest: 2 }, { curResearch: 'dest', researchConfirmed: true },
  'Oh boy! We can make plants now! Grass is my favorite plant! It\'s great for eating ' +
  'and for pooping in. Maybe not at the same time...', { confirm: 'Please not at the same time' }],

  [{ dest: 2 }, { curResearch: 'dest', researchConfirmed: true },
    'Earth won\'t make plants very efficiently. Water would be better, but plants themselves are best.', { confirm: 'Got it' }],

  [{ dest: 2, efficiency: 0 }, { curResearch: 'dest', researchConfirmed: true },
  'Time to research some efficiency, but we should also make some ' +
    'plants while we\'re at it.', { confirm: 'Let\'s do it', completeResearch: true }],

  [{ dest: 2, efficiency: 1 }, { curResearch: 'dest', researchConfirmed: true },
  'Once we\'ve made some grass, I\'ll start thinking of ' +
    'more things to improve.', { confirm: 'Let\'s do it', completeResearch: true, state: { warnedGrass: true } }],

  [{ dest: 3, efficiency: 1 }, { madeplants: false, warnedGrass: false }, 'Once we\'ve made some grass, I\'ll start thinking of ' +
    'more things to improve.', { noConfirm: true }],

  // Complete research + Present research decision
  [{ dest: 3, efficiency: 1 }, { madeplants: true }, 'We have lots of options for inspiration now. I even think there\'s a way to make ' +
    'our transmutation circles push harder against the void. Doggy Dog World is going to be a ' +
    'world full of things, so we\'ll need to figure that out eventually.', { noConfirm: true }],

  [{ efficiency: 1 }, { curResearch: 'efficiency', researchConfirmed: true },
    'With some decorations around our outer anchors, the circle will be more efficient.',
  { confirm: 'More work to draw', completeResearch: true }],

  [{ pressure: 0 }, { curResearch: 'pressure', researchConfirmed: true },
  'By changing our inner circle, the circle will push harder against the void, helping ' +
  'us fill the world better.', { confirm: 'Fill it up!', completeResearch: true }],

  [{ pressure: 1 }, { curResearch: 'pressure', researchConfirmed: true },
    'With stabilizing lines in our inner circle, the circle will press harder against the void.',
  { confirm: 'Fill it up!', completeResearch: true }],

  [{ efficiency: 2 }, { curResearch: 'efficiency', researchConfirmed: true },
    'With bigger anchors in our outer circle, we\'ll be able to create things more efficiently.',
  { confirm: 'More decorations!', completeResearch: true }],

  [{ pressure: 2 }, { curResearch: 'pressure', researchConfirmed: true },
    'With bigger anchors in our inner circle, we\'ll help get the world a little fuller.',
  { confirm: 'Fill it up!', completeResearch: true }],

  [{ efficiency: 3 }, { curResearch: 'efficiency', researchConfirmed: true },
  'With glyphs in our outer anchors, our circles will be as efficient as possible. Dogs ' +
  'love efficiency.',
  { confirm: 'Wait, really?' }],

  [{ efficiency: 3 }, { curResearch: 'efficiency', researchConfirmed: true },
    'Well, this dog loves efficiency.',
  { confirm: 'Me too', completeResearch: true }],

  [{ pressure: 3 }, { curResearch: 'pressure', researchConfirmed: true },
  'With glyphs in our inner anchors, our circles will press as hard against the void as ' +
  'possible. Let\'s fill the world!',
  { confirm: 'Fill the world!', completeResearch: true }],

  [{ efficiency: 2, dest: 3, pressure: 1 }, {}, 'Only one thing left to think about! I\'ll figure out what resource to make next.', { noConfirm: true }],

  [{ dest: 4 }, { madeanimals: true }, 'With all these animals to chase and bark at, I\'m getting a lot of inspiration!', { confirm: "Bark! Bark!" }],

  [{ efficiency: 2, dest: 4, pressure: 1 }, { madeanimals: false }, 'We\'re going to need some animals to chase for inspiration.', { noConfirm: true }],

  [{ efficiency: 3, dest: 4, pressure: 2 }, { madeanimals: true }, 'Only one thing left to think about! The ultimate creation!', { noConfirm: true }],

  [{ dest: 3 }, { curResearch: 'dest', researchConfirmed: true },
  'Now we can make animals! They\'re great for chasing. I think we\'re getting close to the ultimate ' +
  'creation.',
  { confirm: 'Don\'t get too distracted', completeResearch: true }],

  [{ dest: 4 }, { curResearch: 'dest', researchConfirmed: true },
  'More dogs! That\'s what the world really needs! But the world needs everything else too so the dogs can have fun. If we can fill the ' +
  'world with earth, water, plants, animals, and dogs, we\'ll have a real Doggy Dog World.',
  { confirm: 'You\'re still my favorite dog', completeResearch: true }],

  [{ efficiency: 3, dest: 5, pressure: 2 }, { madedogs: false }, 'If I\'m going to get any more inspiration, I\'m going to need some dogs to play with!',
  { noConfirm: true }],

  [{ dest: 5 }, { madedogs: true }, 'Soon there will be dogs everywhere! I\'m so excited!', { confirm: "Woof!" }],

  [{ efficiency: 4, dest: 5, pressure: 3 }, {}, 'Only one thing left to think about! Time to get maximum pressure!', { noConfirm: true }],

  [{ efficiency: 3, dest: 5, pressure: 4 }, {}, 'Only one thing left to think about! Time to get maximum efficiency!', { noConfirm: true }],

  [{ efficiency: 4, dest: 5, pressure: 4 }, {},
    'I don\'t think there\'s any more inspiration to be had. Once we use all this pressure and fill the world with everything, ' +
    'it will be a Doggy Dog World!', { noConfirm: true, state: { researchAllDone: true } }],
]

const sayings = [
  [{ dest: 1 }, 'I bet I could dig a really big hole in this earth!'],
  [{ dest: 2 }, 'Water, water everywhere, nor any drop to- hey, puddle! Spash!'],
  [{ dest: 2 }, 'Splish, splash, I was not taking a bath. Gross.'],
  [{ dest: 2 }, 'It would be great if they made some kind of thing to watch where the whole world is water and a man had gills.'],
  [{ efficiency: 1 }, 'Speaking of efficiency... How many dogs does it take to change a- hey, puddle! Splash!'],
  [{ dest: 3 }, 'Do dogs get grass stains? '],
  [{ dest: 3 }, 'You know what grass is great for? Naps.'],
  [{ pressure: 1 }, 'What do you call a circle inside a circle inside a- hey, puddle! Splash!'],
  [{ efficiency: 2 }, 'With all this time I\'m saving, I should think about taking a nap.'],
  [{ efficiency: 2 }, 'zzz... Oh man, I just thought of a great game! I can chase my own tail!'],
  [{ dest: 4 }, 'I\'m getting a little hungry. I wonder where God is with the chicken jerky. Mmm. Chicken.'],
  [{ dest: 4 }, 'Why did the chicken cross the road? What a silly question. We haven\'t made roads!'],
  [{ efficiency: 3 }, 'zzz ... zzz ... bone ... zzz ... zzz ... being efficient is hard work.'],
  [{ pressure: 2 }, 'Is it safe to go into the void? Or will that be the end of- hey, puddle! Splash!'],
  [{ pressure: 2 }, 'Void ... so dark ... perfect for zzz ... zzz ... bone ... zzz ... zzz ...'],
  [{ pressure: 3 }, 'Does this void make me look fat?'],
  [{ dest: 4 }, 'Now I understand why it\'s a circle of life!'],
  [{ dest: 5 }, 'I wonder how that dog smells.'],
  [{ dest: 5 }, 'Hey dog, don\'t pee on my tree! You keep that up, I\'ll have to- hey, puddle! Spash!'],
]


const PROG = {
  'dest': [{
    ideaCost: .6,
    triggerResource: 'ideas',
    unlockSlider: ['dest', 1],
    confirm: 'So what\'s your great idea?',
  }, {
    ideaCost: 6,
    unlockSlider: ['dest', 2],
    confirm: 'What\'s next?',
  }, {
    ideaCost: 120,
    triggerResource: 'water',
    unlockSlider: ['dest', 3],
    name: 'New things!',
  }, {
    ideaCost: 1500,
    triggerResource: 'plants',
    unlockSlider: ['dest', 4],
  }, {
    ideaCost: 5400,
    triggerResource: 'animals',
    unlockSlider: ['dest', 5],
    reqResearch: ['efficiency', 2],
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
    ideaCost: 60,
    triggerResource: 'water',
    name: 'Faster!',
    unlockSlider: ['efficiency', 1],
  }, {
    ideaCost: 1200,
    triggerResource: 'plants',
    unlockSlider: ['efficiency', 2],
  }, {
    ideaCost: 2200,
    triggerResource: 'animals',
    unlockSlider: ['efficiency', 3],
  }, {
    ideaCost: 12600,
    triggerResource: 'dogs',
    unlockSlider: ['efficiency', 4],
  }, {
    triggerResource: 'end',
  }],
  'pressure': [{
    ideaCost: 800,
    triggerResource: 'plants',
    unlockSlider: ['pressure', 1],
  }, {
    ideaCost: 2600,
    triggerResource: 'animals',
    unlockSlider: ['pressure', 2],
    reqResearch: ['efficiency', 2],
  }, {
    ideaCost: 12500,
    triggerResource: 'dogs',
    unlockSlider: ['pressure', 3],
    reqResearch: ['efficiency', 3],
  }, {
    ideaCost: 35800,
    unlockSlider: ['pressure', 4],
    reqResearch: ['efficiency', 4],
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
    if (debug || gameDebug) {
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
      if (this.state.storyDelay !== null && this.state.storyConfirm === null) {
        setTimeout(() => {
          this.state.doneStories[this.state.activeStory] = true;
          let sto = story[this.state.activeStory];
          if (sto[3].state) {
            Object.assign(this.state, sto[3].state)
          }
          this.state.activeStory = null;
          this.state.storyDelay = null;
        }, this.state.storyDelay * 1000)
      }
    } else {
      this.state = this.getInitState();
    }
    setTimeout(this.initCompletedCanvases, 0);
  }

  resetLocalVars = () => {
    this.prevX = null;
    this.prevY = null;
    this.mouseX = null;
    this.touched = false;
    this.mouseY = null;
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
      doneNotified: false,
      doneConfirmed: false,
      modalConfirm: null,
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
      seenStory: {},
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
      startedDrawing: false,
      madewater: false,
      madeplants: false,
      madeanimals: false,
      madedogs: false,
      modal: true,
      paused: false,
      showSettings: false,
      showTips: false,
      modalMessage: initStory,
      confirmCancelDraw: false,
      confirmReset: false,
      activeStory: null,
      activeMessage: null,
      storyConfirm: null,
      doneStories: {},
      noStoryConfirm: false,
      storyDelay: null,
      canDraw: false,
      researchConfirmed: false,
      unlockedSelector: false,
      warnedGrass: false,
      researchAllDone: false,
      selectedCirclesDelete: [],
    }
    state.res.earth.visible = true
    // Used to end prog chains by never being visible
    state.res.end = { visible: false }
    state.tmCircle = null; //this.createCircle(state, false);
    this.newSegments = []; //state.tmCircle.segments.map(() => []);
    state.buildCost = this.getBuildCost(state, state.builder);
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
    state[`made${destName}`] = true
    state.completedCircles.push(circle);
    this.completedCanvases[circle.index] = React.createRef();
    this.undrawnCompleted.set(circle.index, circle);
    state.tmCircle = null;
    state.buildCost = this.getBuildCost(state, state.builder);
    this.drawCanvas(this.canvas, state.tmCircle, this.transform, true, 1)
    return state;
  }




  reset = () => {
    this.resetLocalVars();
    let state = this.getInitState();
    this.setState(state, this.resizeCanvas());

  }

  componentDidUpdate = () => {
    let s = this.state;
    if (this.canvas.current !== null) {
      this.drawCanvas(
        this.canvas, s.tmCircle, this.transform, this.forceRedraw, 1
      );
    }

    for (const [index, circle] of this.undrawnCompleted) {
      this.completedCanvases[index].current.width = completedSize
      this.completedCanvases[index].current.height = completedSize
      this.drawCanvas(this.completedCanvases[index], circle, this.completedTransform, true, 2)
    };
    this.undrawnCompleted = new Map();

    this.forceRedraw = false;
    if (s.tmCircle !== null) {
      this.newSegments = s.tmCircle.segments.map(() => []);
    }
  }

  haveCost = () => {
    if (this.state.buildCost === null) {
      return true
    }
    return this.state.buildCost.every(({ name, cost }) => {
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
    if (pay && this.state.buildCost !== null) {
      let bc = this.state.buildCost;
      this.state.res[bc[0].name].amount -= bc[0].cost;
      if (bc[1].name != bc[0].name) {
        this.state.res[bc[1].name].amount -= bc[1].cost;
      }

    }
    let tmCircle = this.clearCircle(this.state.previewCircle);
    this.setState({ tmCircle, showBuilder: false, startedDrawing: true })
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

    if (document.getElementById('progress') !== null) {
      document.getElementById("progress").children[1].offset.baseVal = (s.res.ideas.cap * 1.03 - s.res.ideas.amount) / (s.res.ideas.cap * 1.03)
      document.getElementById("progress").children[2].offset.baseVal = (s.res.ideas.cap * 1.03 - s.res.ideas.amount) / (s.res.ideas.cap * 1.03)
      let visibility = 'visible'
      if (s.res.ideas.amount < s.res.ideas.cap) {
        visibility = 'hidden';
      }

      document.getElementById("layer3").children[5].style.visibility = visibility
      document.getElementById("layer3").children[6].style.visibility = visibility

    }
    if (document.getElementById('dogCaret') !== null) {
      let lily = document.getElementById('path526').getBoundingClientRect();
      document.getElementById('dogCaret').style.marginTop = lily.y + window.scrollY - 4 + 'px';
    }
    return (

      <div id="verticalFlex">
        <div id="flex">
          {(s.modal || s.confirmCancelDraw || s.confirmReset || s.showSettings || s.showTips) && <div id="modal-bg">
            <div id="modal">
            {s.showTips && <>
                <h3 className="lessThin">Here are some collected tips from Dog</h3>
                <p className="lessThin">Keep drawing circles! I'll get better at drawing for each circle we finish together,
                  and circles that make the same thing power each other up, even we destroy them later.
                </p>
                <p className="lessThin">Pressure is critical to get the strongest circles and completely fill the world.</p>
                <p className="lessThin">Mouse over circles we've made to see how much they produce relative to each other.</p>
                <button onClick={() => { this.setState({ showTips: false }) }}>OK</button>
              </>}
              {s.showSettings && !s.confirmReset && !s.showTips && <>
                <p className="thin">Welcome to Doggy Dog World</p>
                {<p><button onClick={() => { this.setState({ showTips: true }) }}>Tips</button></p>}
                <p><button onClick={() => { this.setState({ confirmReset: true }) }}>Reset</button></p>
                <button onClick={() => { this.setState({ showSettings: false }) }}>OK</button>
              </>}
              {s.confirmReset && <p>Completely reset the game and start over?</p>}
              {s.confirmCancelDraw && <p>Abort your current circle to make a different circle?</p>}
              {s.gameDone && !s.doneConfirmed && <div>
                <p>What a Doggy Dog World! Time to snoop around and have fun. Thanks for the help, Human!</p>
                <p className="thin">Game made for <a style={{ color: '#87bbe6' }} href="https://itch.io/jam/summer-incremental-game-jam-2022">Summer Incremental Game Jam 2022</a> by heartosis</p>
                <p className="thin">Dog Art by Greg</p>
                <p className="thin">Special Thanks to Wife</p>
                <p>Thank you for playing!</p>
              </div>}
              {s.modal && <p>{s.modalMessage}</p>}
              {s.confirmReset &&
                <button onClick={() => { this.reset() }}>Confirm Reset</button>}
              {s.confirmCancelDraw &&
                <button onClick={() => { this.cancelDraw(); this.setState({ confirmCancelDraw: false }) }}>Abort Drawing</button>}
              {(s.confirmReset || s.confirmCancelDraw) &&
                <button onClick={() => this.setState({ confirmReset: false, confirmCancelDraw: false })}>Cancel</button>}
              {s.modal && <button onClick={() => { this.setState({ doneConfirmed: s.gameDone, modal: false, paused: false, modalMessage: null }) }}>{s.modalConfirm || 'OK'}</button>}
            </div>
          </div>}
          <div className="panel leftPanel" id="resourcePanel">
            <div id="dogBox">
              <div id="lilyBox">
                <Lily id="lily" style={{ height: 'auto', marginLeft: '-5px' }} />
                <div style={{ position: 'absolute', left: '-2px', top: '15px' }}>
                  <ResourceDiff
                    gainFrac={this.resourceGainLoss.ideas.gainFrac}
                    lossFrac={this.resourceGainLoss.ideas.lossFrac}></ResourceDiff>
                </div>
              </div>
              {s.activeMessage !== null && <>
                <div id="dogCaret" style={{}}></div>
                <div id="dogSays"><span id="dogWords">{s.activeMessage}</span></div>
              </>}
              {s.activeMessage === null && Object.keys(s.researchOpts).length > 0 && <>
                <div id="dogCaret" style={{}}></div>
                <div id="dogSays"><span id="dogWords">What should I ponder next?</span></div>
              </>}
            </div>

            <div style={{ display: "flex" }}>
              <div style={{ flexGrow: 1, textAlign: 'right' }}>
                {s.gameDone && <span>You won!</span>}
                <button style={/*spacer*/{ visibility: 'hidden' }}>S</button>
                {s.researchComplete && !s.researchConfirmed && s.storyConfirm === null &&
                  <button onClick={() => {
                    this.setState((s) => { return { researchConfirmed: true } });
                  }}>{s.curResearch.confirm ? s.curResearch.confirm : 'Tell me your new idea!'}</button>}
                {s.storyConfirm === null && <>
                  {'source' in s.researchOpts && <button onClick={() => {
                    this.setState((s) => { this.startResearch(s, 'source') })
                  }}>Source</button>}
                  {'dest' in s.researchOpts && <button onClick={() => {
                    this.setState((s) => { this.startResearch(s, 'dest') })
                  }}>{PROG.dest[s.prog.dest].name ? PROG.dest[s.prog.dest].name : 'New resource!'}</button>}
                  {'efficiency' in s.researchOpts && <button onClick={() => {
                    this.setState((s) => { this.startResearch(s, 'efficiency') })
                  }}>{PROG.efficiency[s.prog.efficiency].name ? PROG.efficiency[s.prog.efficiency].name : 'Efficiency!'}</button>}
                  {'pressure' in s.researchOpts && <button onClick={() => {
                    this.setState((s) => { this.startResearch(s, 'pressure') })
                  }}>{PROG.pressure[s.prog.pressure].name ? PROG.pressure[s.prog.pressure].name : 'Pressure!'}</button>}
                </>}
                {s.storyConfirm !== null &&
                  <button onClick={() => {
                    s.activeMessage = null;
                    s.storyConfirm = null;
                    if (s.storyDelay !== null) {
                      setTimeout(() => {
                        this.setState((s) => {
                          if (s.activeStory === null) {
                            return
                          }
                          s.doneStories[s.activeStory] = true;
                          let sto = story[s.activeStory];
                          if (sto[3].state) {
                            Object.assign(s, sto[3].state)
                          }
                          s.activeStory = null;
                          s.storyDelay = null;

                        })
                      }, s.storyDelay * 1000)
                    } else {
                      s.doneStories[s.activeStory] = true;
                      let sto = story[this.state.activeStory];
                      if (sto[3].state) {
                        Object.assign(s, sto[3].state)
                      }
                      s.activeStory = null;
                    }
                  }}>{s.storyConfirm}</button>
                }
                {debug &&
                  <button disabled={s.tmCircle === null} onClick={() => {
                    this.completeCircle(s, s.tmCircle);
                    this.drawCanvas(this.canvas, s.tmCircle, this.transform, true, 1)
                  }}>Cheat Circle</button>}
              </div>
            </div>
            <table>
              <tbody>
                {Object.keys(resources).filter((name) => {
                  return name === 'ideas' ? debug : s.res[name].visible
                }).map((name) => {
                  let gl = this.resourceGainLoss[name];
                  return (<tr key={name}>
                    <td className="resourceName">{title(name)}</td>
                    <td className="realResource" style={{ width: '100%', textAlign: 'right' }}>
                      <Resource name={name} percent={100 * s.res[name].amount / s.res[name].cap} shiny={s.res[name].amount == s.res[name].cap}></Resource>
                    </td>
                    <td><ResourceDiff
                      gainFrac={gl.gainFrac}
                      lossFrac={gl.lossFrac}></ResourceDiff></td>
                    {debug && <>
                      <td><button onClick={() => s.res[name].amount += .2 * s.res[name].cap}>+{.2 * s.res[name].cap}</button>
                        <button onClick={() => s.res[name].amount -= .2 * s.res[name].cap}>-{.2 * s.res[name].cap}</button></td>
                      <td>+{(gl.gain > -1 ? gl.gain : s.res[name].gain).toFixed(6)} -{(gl.loss > -1 ? gl.loss : s.res[name].loss).toFixed(6)}
                      </td></>}
                  </tr>)
                })}
              </tbody>
            </table>
            <div id="controls">
              <span style={{ 'cursor': 'pointer', fontSize: '1em', marginRight: '5px' }}
                onClick={() => { this.setState({ paused: !s.paused }) }}>
                {s.paused ? <Play></Play> : <Pause></Pause>}</span>
              <span style={{ 'cursor': 'pointer', fontSize: '1.5em' }}
                onClick={() => { this.setState({ showSettings: true }) }}>
                <Gear></Gear></span>
            </div>
          </div>
          <div className="panel leftPanel narrow">
            <div className="big" style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div style={s.showSelector || !s.unlockedSelector ? { visibility: 'hidden', marginRight: '8px' } : { marginRight: '8px' }}
                onClick={() => this.setState({ showSelector: true, showBuilder: false })}>Destructor&nbsp;&gt;</div>
              <div style={s.showBuilder ? { visibility: 'hidden' } : {}}
                onClick={() => this.setState({ showBuilder: true, showSelector: false }, () => { this.resizePreview(); this.createPreview() })}>Builder&nbsp;&gt;</div>
            </div>
            <div id="#selector">
              <div>
                {s.completedCircles.map((c) => {
                  return <canvas
                    onMouseEnter={() => { this.completedMouseEnter(c) }}
                    onTouchStart={() => { this.completedMouseEnter(c) }}
                    onMouseLeave={() => { this.completedMouseLeave(c) }}
                    onTouchCancel={() => { this.completedMouseLeave(c) }}
                    onTouchEnd={() => { this.completedMouseLeave(c) }}
                    ref={this.completedCanvases[c.index]} key={c.index}
                    className={"completedCircle " + (s.selectedCirclesDelete[c.index] ? 'destroySelect' : '')}
                    onClick={s.showSelector ? (
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
                <div style={{ flexGrow: 1 }} onClick={(e) => { this.setState({ showBuilder: false }); e.preventDefault() }}>&lt;&nbsp;Builder</div>
                <div id="builderCost">
                  {s.buildCost === null && "Free to make again"}</div>

              </div>
              <div id="builder">
                {/*<div>
                  Heavenly
                  </div>*/}
                {s.sliderUnlocks.source >= 0 && <div style={{ display: 'flex', marginBottom: '5px' }}>
                  <div style={{ flexGrow: 1 }}><p className="thin">Consume</p>
                    <div style={{}}>{title(sourceRes(this.state.builder))}</div>
                  </div>
                  <div>{<input type="range" min="1" max={this.state.sliderUnlocks.source} value={this.state.builder.source}
                    style={s.sliderUnlocks.source >= 2 ? {} : { visibility: 'hidden' }}
                    onChange={(e) => {
                      this.setState((s) => {
                        let builder = { ...this.state.builder, source: parseInt(e.target.value) };
                        return { builder, buildCost: this.getBuildCost(s, builder) }
                      }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>}
                    {
                      <div style={{ flexGrow: 1, width: '100%', display: 'flex', alignItems: 'center', visibility: (s.buildCost === null ? "hidden" : "visible") }}>
                        <div>Cost:&nbsp;</div>
                        {s.buildCost === null ?
                          <div style={{ width: '100%' }}><Resource name="ideas" percent="20"></Resource></div>
                          : <div style={{ width: '100%' }}><Resource name={s.buildCost[0].name} percent={100 * s.buildCost[0].cost / s.res[s.buildCost[0].name].cap}></Resource></div>
                        }
                      </div>
                    }</div>
                </div>}
                {s.sliderUnlocks.dest >= 0 && <div style={{ display: 'flex', marginBottom: '5px' }}>
                  <div style={{ flexGrow: 1 }}><p className="thin">Create</p>
                    <div style={{}}>{title(destRes(this.state.builder))}</div>
                  </div>
                  <div>{<input type="range" min="0" max={this.state.sliderUnlocks.dest} value={this.state.builder.dest}
                    style={s.sliderUnlocks.dest >= 1 ? {} : { visibility: 'hidden' }}
                    onChange={(e) => {
                      this.setState((s) => {
                        let builder = { ...this.state.builder, dest: parseInt(e.target.value) };
                        return { builder, buildCost: this.getBuildCost(s, builder) }
                      }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input>}
                    {
                      <div style={{
                        flexGrow: 1, width: '100%', display: 'flex', alignItems: 'center', visibility:
                          (s.buildCost === null || s.buildCost[1].name === 'ideas' || s.buildCost[1].cost === 0 || s.buildCost[1].name === s.buildCost[0].name ? "hidden" : "visible")
                      }}>
                        <div>Cost:&nbsp;</div>
                        {(s.buildCost === null) ?
                          <div style={{ width: '100%' }}><Resource name="ideas" percent="20"></Resource></div>
                          : <div style={{ flexGrow: 1 }}><Resource name={s.buildCost[1].name} percent={100 * s.buildCost[1].cost / s.res[s.buildCost[1].name].cap}></Resource></div>
                        }
                      </div>
                    }</div>
                </div>}
                {s.sliderUnlocks.efficiency >= 1 && <div style={{ display: 'flex' }}>
                  <div style={{ flexGrow: 1 }}>Efficiency</div>
                  <div><input type="range" min="0" max={this.state.sliderUnlocks.efficiency} value={this.state.builder.efficiency}
                    onChange={(e) => {
                      this.setState((s) => {
                        let builder = { ...this.state.builder, efficiency: parseInt(e.target.value) };
                        return { builder, buildCost: this.getBuildCost(s, builder) }
                      }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input></div>
                </div>}
                {s.sliderUnlocks.pressure >= 1 && s.builder.dest != 0 && <div style={{ display: 'flex' }}>
                  <div style={{ flexGrow: 1 }}>Pressure</div>
                  <div><input type="range" min="0" max={this.state.sliderUnlocks.pressure} value={this.state.builder.pressure}
                    onChange={(e) => {
                      this.setState((s) => {
                        let builder = { ...this.state.builder, pressure: parseInt(e.target.value) };
                        return { builder, buildCost: this.getBuildCost(s, builder) }
                      }, this.createPreview);
                      e.preventDefault();
                    }}
                  ></input></div>
                </div>}
                <div>
                  {(s.tmCircle !== null && !s.tmCircle.done) ? 'Can\'t start a new circle until finishing or aborting the current one.' :
                    (s.completedCircles.length >= maxCircles ? 'Circle limit reached. Use Destructor to destroy less useful circles.' :
                      (!this.haveCost() ? 'Can\'t afford circle. Check cost above.' : ''))}
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ 'textAlign': 'left', 'flexGrow': 1 }}>
                    <button disabled={s.tmCircle === null} onClick={() => this.setState({ confirmCancelDraw: true })}>Abort Drawing</button>
                  </div>
                  {debug && <div style={{ 'textAlign': 'right' }}>
                    <button
                      onClick={() => { this.startDraw(false) }}
                      disabled={s.completedCircles.length >= maxCircles || (s.tmCircle !== null && !s.tmCircle.done)}
                    >Cheat Draw</button>
                  </div>}
                  <div style={{ 'textAlign': 'right' }}>
                    <button
                      onClick={() => { this.startDraw(true) }}
                      disabled={!this.haveCost() || s.completedCircles.length >= maxCircles || (s.tmCircle !== null && !s.tmCircle.done)}
                    >Let's Draw It</button>
                  </div>
                </div>
                <div>
                  <canvas id="previewCanvas"
                    ref={this.previewCanvas}
                  ></canvas>
                </div>

              </div>
            </div>
            }
            {s.showSelector && <div id="selectorPanel">
              <div style={{ display: 'flex', margin: '5px', }}>
                <div onClick={(e) => { this.setState({ showSelector: false, selectedCirclesDelete: {}, }); e.preventDefault() }}>&lt;&nbsp;Destructor</div>
              </div>
              <p>Select the circles you would like to destroy.</p>
              <button onClick={(e) => { this.triggerDestruction(); e.preventDefault() }}>Destroy Selected Circles</button>
              <button onClick={(e) => { this.setState({ showSelector: false, selectedCirclesDelete: {}, }); e.preventDefault() }}>Cancel Destruction</button>

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
      </div >
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
    s.showSelector = false;
  }

  createPreview = () => {
    let s = this.state;
    let previewCircle = this.createCircle(s, true);
    const previewCanvas = this.previewCanvas;
    if (this.previewCanvas.current !== null) {
      this.drawCanvas(previewCanvas, previewCircle, this.previewTransform, true, 2)
    }
    this.setState({ previewCircle })
  }

  createCircle = (state, done) => {
    let segments = [];
    let spacing = 1.0 / state.builder.source;
    let outerAnchorRadius = state.builder.efficiency >= 3 ? .12 : .08;
    let innerAnchorRadius = state.builder.pressure >= 3 ? .12 : .08;
    let mainRadius = 1 - outerAnchorRadius;
    let enlargedAnchorRadius = outerAnchorRadius + .1;
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
    if (state.builder.efficiency >= 1) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: mainRadius + outerAnchorRadius,
        start: 0,
        end: 1,
      });
    } else {
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
    }
    if (state.builder.efficiency >= 2) {
      for (let i = 0; i < state.builder.source; i++) {

        let curA = enlargedOuterAnchors[i];
        let tempSeg = {
          center: [0, 0],
          radius: mainRadius + outerAnchorRadius,
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
        let topCenter = [outerAnchors[i].center[0], outerAnchors[i].center[1] + outerAnchorRadius / 4]
        segments.push({
          type: 'arc',
          center: topCenter,
          radius: outerAnchorRadius / 2,
          start: .1,
          end: .9,
        })

        let start = [topCenter[0], topCenter[1]];
        let end = [topCenter[0], topCenter[1] - outerAnchorRadius];
        let len = outerAnchorRadius;
        segments.push({
          type: 'line',
          start,
          end,
          len,
          lenSq: len * len,
        })
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
        lineWidth: 1.5,
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
    if (state.builder.pressure >= 1 && state.builder.dest != 0) {
      segments.push({
        type: 'arc',
        center: [0, 0],
        radius: innerRadius + innerAnchorRadius,
        start: 0,
        end: 1,
      });
    } else {
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
          radius: 3 * innerAnchorRadius / 5,
          start: 0,
          end: .35,
        });
        segments.push({
          type: 'arc',
          center: innerAnchors[i].center,
          radius: 3 * innerAnchorRadius / 5,
          start: .65,
          end: 1,
        });
        let start = [innerAnchors[i].center[0], innerAnchors[i].center[1] + 3 * innerAnchorRadius / 5];
        let end = [start[0], start[1] - 2 * innerAnchorRadius / 3];
        let len = 2 * innerAnchorRadius / 3;
        segments.push({
          type: 'line',
          start,
          end,
          len,
          lenSq: len * len,
        })
      }
    }


    return this.circleFromSegments(segments, done, insideStart, { ...state.builder });
  }

  cancelDraw = () => {
    this.state.tmCircle = null
    this.newSegments = [];
    this.drawCanvas(this.canvas, null, this.transform, true, 1)
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

  drawCanvas = (canvas, tmCircle, transform, forceRedraw, lineScale) => {
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
      let donePaths;


      if (segIndex < tmCircle.insideStart) {
        donePaths = outsideDonePaths;
      } else {
        donePaths = insideDonePaths;
      }
      ctx.lineWidth = this.baseLineWidth * seg.lineWidth * lineScale;
      if (forceRedraw) {
        if (seg.type === 'arc') {
          if (!seg.done && forceRedraw) {
            let planPath = new Path2D();
            planPath.arc(seg.center[0], seg.center[1], seg.radius, normalizedToRadians(seg.start), normalizedToRadians(seg.end), true);
            planPaths.push([planPath, seg.lineWidth]);
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
            donePaths.push([donePath, seg.lineWidth]);
          }
        } else if (seg.type === 'line') {
          if (!seg.done) {
            let planPath = new Path2D();
            planPath.moveTo(seg.start[0], seg.start[1]);
            planPath.lineTo(seg.end[0], seg.end[1]);
            planPaths.push([planPath, seg.lineWidth]);
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
            donePaths.push([donePath, seg.lineWidth]);
          }
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
            donePaths.push([donePath, seg.lineWidth]);
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
            donePaths.push([donePath, seg.lineWidth]);
          });
        }
      }



    });
    ctx.strokeStyle = progressColor;
    for (const [planPath, width] of planPaths) {
      ctx.lineWidth = this.baseLineWidth * width * lineScale;
      ctx.stroke(planPath);
    }
    ctx.strokeStyle = ctx.strokeStyle = resources[resMap[tmCircle.params.heavenly][tmCircle.params.source]].color;
    for (const [donePath, width] of outsideDonePaths) {
      ctx.lineWidth = this.baseLineWidth * width * lineScale;
      ctx.stroke(donePath);
    }

    ctx.strokeStyle = ctx.strokeStyle = resources[resMap[tmCircle.params.heavenly][tmCircle.params.dest]].color;
    for (const [donePath, width] of insideDonePaths) {
      ctx.lineWidth = this.baseLineWidth * width * lineScale;
      ctx.stroke(donePath);
    }
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
      if ('reqResearch' in next && s.prog[next.reqResearch[0]] < next.reqResearch[1]) {
        continue
      }
      if (!ideaCost) {
        this.completeFakeResearch(s, type)
        continue
      }
      if (ideaCost && s.curResearch === null) {
        s.researchOpts[type] = true;
      }
    }
    if (Object.keys(s.researchOpts).length == 1) {
      let research = Object.keys(s.researchOpts)[0]
      if (research === 'dest' || (research == 'efficiency' && s.prog[research] === 0)) {
        this.startResearch(s, Object.keys(s.researchOpts)[0])
      }
    }
  }

  startResearch = (s, type) => {
    if (s.curResearch !== null) {
      return
    }
    let sProg = s.prog[type]
    let next = PROG[type][sProg]
    let ideaCost = next.ideaCost;
    s.curResearch = { type, ideaCost, confirm: next.confirm }
    s.res.ideas.cap = ideaCost;
    s.researchOpts = {}
  }

  getCircleKey = (params) => {
    return (params.source + "_" + params.dest + "_" +
      params.efficiency + "_" + params.pressure)
  }

  completeFakeResearch = (s, type) => {
    let res = PROG[type][s.prog[type]]
    if (res.unlockSlider) {
      s.sliderUnlocks[res.unlockSlider[0]] = res.unlockSlider[1];
    }

    s.prog[type] += 1;
  }

  completeResearch = (s) => {
    if (!s.curResearch || (s.curResearch.ideaCost && s.res.ideas.amount < s.curResearch.ideaCost)) {
      return;
    }
    let type = s.curResearch.type
    let res = PROG[type][s.prog[type]]
    if (res.unlockSlider) {
      s.sliderUnlocks[res.unlockSlider[0]] = res.unlockSlider[1];
    }
    if (s.curResearch) {
      s.curResearch = null;
      s.res.ideas.amount = 0;
      s.researchComplete = false
      s.researchConfirmed = false
    }
    s.prog[type] += 1;
  }

  checkStory = (s) => {
    if (s.activeStory !== null && !s.noStoryConfirm) {
      return;
    }
    for (const [index, stuff] of story.entries()) {
      let [progReq, stateReq, message, other] = stuff
      if (other === undefined) {
        other = {}
      }
      if (index in s.doneStories) {
        continue;
      }
      let progMet = true;
      for (const [key, val] of Object.entries(progReq)) {
        if (s.prog[key] !== val) {
          progMet = false
          break
        }
      }
      if (!progMet) {
        continue
      }
      for (const [key, val] of Object.entries(stateReq)) {
        if (key === 'curResearch') {
          if (s.curResearch === null || s.curResearch.type != val) {
            progMet = false
            break
          }
        }
        else if (s[key] !== val) {
          progMet = false
          break
        }
      }
      if (!progMet) {
        continue
      }
      s.activeStory = index;
      s.activeMessage = message;
      if (other.noConfirm) {
        s.noStoryConfirm = true
        s.activeStory = null
        s.doneStories[index] = true;
        if (other.state) {
          Object.assign(s, other.state)
        }
      } else {
        s.noStoryConfirm = false
      }
      if (other.delay) {
        s.storyDelay = other.delay
      }
      if (other.confirm) {
        s.storyConfirm = other.confirm
      }
      if (other.completeResearch) {
        this.completeResearch(s)
      }
      break;
    }
  }

  update = (delta, debugFrame) => {
    let relDelta = delta / 1000;
    let forceResize = false;
    let callback = forceResize ? this.resizeCanvas : () => { };

    this.setState(state => {
      let s = state;
      this.updateResources(s);

      this.checkProg(s);
      this.checkStory(s);
      // Make this a dialog box or thing
      if (s.gameDone && !s.doneNotified) {
        s.modal = true
        s.doneNotified = true
        s.modalConfirm = 'More drawing!'
      }
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
        if (!s.canDraw) {
          this.mouseClicked = false;
        }

        if (seg.type === 'arc') {
          let relX = this.mouseX - seg.center[0];
          let relY = this.mouseY - seg.center[1];
          let circle = (seg.start === 0) && (seg.end === 1)
          let onSegSlop = onArcSlop / seg.radius;


          if (this.mosueX !== null && this.mouseClicked && circleContains(seg.radius, relX, relY)) {
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
              if (this.prevX !== null && circleContains(seg.radius, prevRelX, prevRelY) && ((
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
          if (this.mouseClicked && this.mouseX !== null) {
            let [relPos, distSq] = lineRelPosDistSq(this.mouseX, this.mouseY, seg);
            if (relPos >= -onSegSlop && relPos <= 1 + onSegSlop && distSq < lineDistFudge) {
              let [prevRelPos, prevDistSq] = lineRelPosDistSq(this.prevX, this.prevY, seg);
              if (this.prevX !== null && prevRelPos >= -onSegSlop && prevRelPos <= 1 + onSegSlop && prevDistSq < lineDistFudge) {
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
          let drawnBonus = (.1 * s.drawnTotal + 1) ** 2 + 1;

          let deltaSize = relDelta * s.drawSpeed / seg.len * drawFactor * drawnBonus;
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
      this.prevX = this.mouseX;
      this.prevY = this.mouseY;
      return {};

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
    if (!s.curResearch) {
      s.res.ideas.amount = 0
    }
    if (s.researchAllDone) {
      s.res.ideas.amount = s.res.ideas.cap
    }
  }

  calcResource = (s, resource, amount, source, c) => {
    let { pressure, efficiency } = (c && c.params) || { pressure: 0, efficiency: 1 };
    let fullCap = .99
    if (resource.name === 'ideas') {
      fullCap = .9999
    }
    if (resource.amount > fullCap * resource.cap) {
      resource.amount = resource.cap;
      return [0, 0];
    }
    let destMul = 1
    // (2-2x)^(1/3, 1/2, 1, 2, 3)
    if (resource.name !== 'ideas' && resource.amount > .5) {
      let exp = [8, 6, 4, 3, 2.1][pressure];
      destMul = (2 - 2 * resource.amount) ** exp
    }
    let sourceMul = 1
    if (source.amount < .5) {
      sourceMul = 1 - Math.cos(pi * source.amount);
    }
    efficiency = [.1, .2, .4, .8, 1.6][efficiency] * 20
    if (resource.name === 'ideas') {
      efficiency *= resources[source.name].ideaEfficiency
    }
    let destLevel = resources[resource.name].level;
    let sourceLevel = resources[source.name].level;
    if (destLevel > sourceLevel) {
      efficiency *= 0.5 ** (destLevel - sourceLevel)
    }
    if (source.name !== 'magic') {
      efficiency *= Math.log10(.8 * s.drawnDestTotals[resource.name] + 12) / Math.log10(2.4) - 1.8383
      efficiency *= Object.keys(s.drawnCircles[resource.name]).length ** 0.65 * 0.3 + 1
    }
    return [sourceMul * amount * destMul, destMul * amount * efficiency]
  }

  getBuildCost = (state, builder) => {
    if (state) {
      let key = this.getCircleKey(builder);
      if (key in state.drawnCircles[destRes(builder)]) {
        return null;
      }
    }
    let dest = builder.dest;
    let source = builder.source;
    let eff = builder.efficiency;
    let press = dest == 0 ? 0 : builder.pressure;
    let sourceCost = .25 + (dest / maxDest) ** .85 * .25 + (eff / maxEfficiency) ** .85 * .2 + (press / maxPressure) ** .75 * .25
    let destCost = 0;
    if (eff > 0 || press > 0) {
      destCost = ((eff + 1) / (maxEfficiency + 1)) ** .5 * .25 + ((press + 1) / (maxPressure + 1)) ** .5 * .5;
    }
    if (dest == source) {
      return [
        { name: sourceRes(builder), cost: Math.max(sourceCost, destCost) },
        { name: sourceRes(builder), cost: Math.max(sourceCost, destCost) },
      ]
    }
    if (destRes(builder) === 'ideas') {
      destCost = 0;
    }
    return [
      { name: sourceRes(builder), cost: sourceCost },
      { name: destRes(builder), cost: destCost },
    ]
  }

  mouseMove = (e) => {
    if (this.touched) {
      return;
    }
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
    e.preventDefault();
    this.touched = true
    // TODO fix for touch/multitouch (hm)
    if (e.type === "touchcancel" || e.type === "touchend") {
      this.mouseClicked = false;
      this.touched = false;
      this.mouseX = null;
      this.mouseY = null;
      this.prevX = null;
      this.prevY = null;
      return;
    }
    if (e.touches.length > 0) {
      var rect = this.canvas.current.getBoundingClientRect();
      if (this.mouseClicked) {
      }
      let point = new DOMPoint(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      point = this.inverseTransform.transformPoint(point);
      this.mouseX = point.x;
      this.mouseY = point.y;
      if (!this.mouseClicked) {
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
    if (this.state.paused) {
      setTimeout(() => { this.forceUpdate() }, 0)
    }
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

  saveState = (name) => {
    localStorage.setItem(name, JSON.stringify(this.state));
  }

  loadState = (name) => {
    const storedState = localStorage.getItem(name);
    if (storedState) {
      this.state = JSON.parse(storedState);
      if (this.state.storyDelay !== null && this.state.storyConfirm === null) {
        setTimeout(() => {
          this.state.doneStories[this.state.activeStory] = true;
          let sto = story[this.state.activeStory];
          if (sto[3].state) {
            Object.assign(this.state, sto[3].state)
          }
          this.state.activeStory = null;
          this.state.storyDelay = null;
        }, this.state.storyDelay * 1000)
      }
    } else {
      this.state = this.getInitState();
    }
    this.setState(this.state)
    setTimeout(this.initCompletedCanvases, 0);
  }

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

function title(name) {
  return name.charAt(0).toUpperCase() + name.slice(1)
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
