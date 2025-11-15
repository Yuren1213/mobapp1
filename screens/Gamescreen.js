// ./screens/GameScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  PanResponder,
} from "react-native";

const { width, height } = Dimensions.get("window");

// GRID SETTINGS
const CELL = 28;
const OFFSET_X = 8;
const OFFSET_Y = 80;

// Maze layout (1=wall,0=path,2=power pellet)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,0,0,0,1,0,0,0,0,2,0,0,1],
  [1,0,1,1,0,1,0,1,1,0,1,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,0,1,0,1],
  [1,0,1,0,1,1,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,2,1],
  [1,0,1,1,1,1,1,1,1,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const ROWS = MAZE.length;
const COLS = MAZE[0].length;

// helpers
const inBounds = (r,c) => r>=0 && r<ROWS && c>=0 && c<COLS;
const isFree = (r,c) => inBounds(r,c) && MAZE[r][c] !== 1;

// BFS pathfinding, returns next step from start towards target (r,c)
function bfsNextStep(start, target, blocked = null) {
  const [sr, sc] = start;
  const [tr, tc] = target;
  if (!isFree(tr, tc)) return null;
  const q = [[sr, sc]];
  const prev = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  prev[sr][sc] = [-1,-1];
  const dirs = [[-1,0],[0,1],[1,0],[0,-1]]; // prioritize up,right,down,left
  while (q.length) {
    const [r,c] = q.shift();
    if (r===tr && c===tc) break;
    for (let [dr,dc] of dirs) {
      const nr = r+dr, nc = c+dc;
      if (!inBounds(nr,nc)) continue;
      if (blocked && blocked(nr,nc)) continue;
      if (MAZE[nr][nc] === 1) continue;
      if (prev[nr][nc] == null) {
        prev[nr][nc] = [r,c];
        q.push([nr,nc]);
      }
    }
  }
  if (prev[tr][tc] == null) return null;
  let cur = [tr, tc];
  let before = prev[cur[0]][cur[1]];
  while (before && before[0] !== -1 && !(before[0]===sr && before[1]===sc)) {
    cur = before;
    before = prev[cur[0]][cur[1]];
  }
  return cur;
}

// utility to clamp
const dist = (a,b) => Math.hypot(a.r - b.r, a.c - b.c);

// Initial positions (grid)
const INIT_PAC = { r: 1, c: 2, dir: "left", nextDir: null };
const GHOST_HOME = { r: 3, c: 6 }; // respawn tile

// Ghost definitions
const INIT_GHOSTS = [
  { id: "blinky", r: 1, c: 11, color: "#ff3b3b" }, // red
  { id: "pinky",  r: 1, c: 10, color: "#ff9ad6" }, // pink
  { id: "inky",   r: 5, c: 11, color: "#33d6ff" }, // cyan
  { id: "clyde",  r: 5, c: 1,  color: "#ffb84d" }, // orange
];

// Mode schedule (seconds) simplified: scatter 7, chase 20, scatter 7, chase 20, then repeat
const MODE_SEQUENCE = [
  { mode: "scatter", duration: 7 },
  { mode: "chase", duration: 20 },
  { mode: "scatter", duration: 7 },
  { mode: "chase", duration: 20 },
];

export default function GameScreen({ navigation }) {
  const [pac, setPac] = useState(INIT_PAC);
  const [ghosts, setGhosts] = useState(() => INIT_GHOSTS.map(g=>({ ...g, mode: "scatter", frightened: false, eaten: false })));
  const [pellets, setPellets] = useState([]);
  const [powerPellets, setPowerPellets] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [modeIdx, setModeIdx] = useState(0);
  const [modeTimer, setModeTimer] = useState(MODE_SEQUENCE[0].duration);
  const [frightTimer, setFrightTimer] = useState(0);

  const pan = useRef({});
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e,g) => { pan.x0 = g.x0; pan.y0 = g.y0; },
      onPanResponderRelease: (e,g) => {
        const dx = g.moveX - pan.x0;
        const dy = g.moveY - pan.y0;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 20) queuePacDir("right");
          else if (dx < -20) queuePacDir("left");
        } else {
          if (dy > 20) queuePacDir("down");
          else if (dy < -20) queuePacDir("up");
        }
      },
    })
  ).current;

  // Generate pellets and power pellets from maze layout
  useEffect(() => {
    const pelletList = [];
    const powerList = [];
    for (let r=0; r<ROWS; r++) {
      for (let c=0; c<COLS; c++) {
        if (MAZE[r][c] === 0) pelletList.push({ r, c, eaten: false });
        if (MAZE[r][c] === 2) powerList.push({ r, c, eaten: false });
      }
    }
    setPellets(pelletList);
    setPowerPellets(powerList);
  }, []);

  // Queue direction (so Pac chooses next when allowed)
  function queuePacDir(dir) {
    setPac(p => ({ ...p, nextDir: dir }));
  }

  // move Pac every tick
  useEffect(() => {
    const tick = setInterval(() => {
      if (isPaused) return;
      setPac((p) => {
        // attempt to apply nextDir if possible
        const tryMove = (r,c,dirToTry) => {
          let nr=r,nc=c;
          if (dirToTry === "up") nr = r-1;
          if (dirToTry === "down") nr = r+1;
          if (dirToTry === "left") nc = c-1;
          if (dirToTry === "right") nc = c+1;
          if (isFree(nr,nc)) return { r: nr, c: nc, dir: dirToTry };
          return null;
        };

        let moved = tryMove(p.r, p.c, p.nextDir);
        if (!moved) moved = tryMove(p.r, p.c, p.dir);
        if (!moved) return p; // can't move

        const newP = { r: moved.r, c: moved.c, dir: moved.dir, nextDir: p.nextDir };

        // eat pellet
        setPellets(prev => {
          let ate = false;
          const next = prev.map(pp => {
            if (!pp.eaten && pp.r === newP.r && pp.c === newP.c) {
              ate = true;
              return { ...pp, eaten: true };
            }
            return pp;
          });
          if (ate) setScore(s => s + 10);
          return next;
        });

        // eat power pellet -> frightened mode
        setPowerPellets(prev => {
          const next = prev.map(pp => {
            if (!pp.eaten && pp.r === newP.r && pp.c === newP.c) {
              setScore(s => s + 50);
              triggerFright();
              return { ...pp, eaten: true };
            }
            return pp;
          });
          return next;
        });

        return newP;
      });
    }, 220); // pac speed (ms) - lower is faster
    return () => clearInterval(tick);
  }, [isPaused]);

  // mode switcher (scatter/chase cycle)
  useEffect(() => {
    if (isPaused) return;
    const modeInterval = setInterval(() => {
      setModeTimer(t => {
        if (t <= 1) {
          // advance mode
          const nextIdx = (modeIdx + 1) % MODE_SEQUENCE.length;
          setModeIdx(nextIdx);
          // update all ghosts' mode if not frightened
          setGhosts(gs => gs.map(g => g.frightened ? g : { ...g, mode: MODE_SEQUENCE[nextIdx].mode }));
          return MODE_SEQUENCE[nextIdx].duration;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(modeInterval);
  }, [modeIdx, isPaused]);

  // frightened countdown
  useEffect(() => {
    if (frightTimer <= 0) return;
    const id = setInterval(() => {
      setFrightTimer(t => {
        if (t <= 1) {
          // end frightened
          setGhosts(gs => gs.map(g => ({ ...g, frightened: false, eaten: false, mode: MODE_SEQUENCE[modeIdx].mode })));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [frightTimer]);

  // ghost AI tick
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setGhosts((currentGhosts) => {
        return currentGhosts.map(g => {
          // if eaten, move towards home quickly
          if (g.eaten) {
            const next = bfsNextStep([g.r,g.c], [GHOST_HOME.r, GHOST_HOME.c]);
            if (next) {
              const [nr, nc] = next;
              if (nr === GHOST_HOME.r && nc === GHOST_HOME.c) {
                // respawn at home: revive
                return { ...g, r: nr, c: nc, eaten: false, frightened: false, mode: MODE_SEQUENCE[modeIdx].mode };
              }
              return { ...g, r: nr, c: nc };
            }
            return g;
          }

          // frightened -> random movement
          if (g.frightened) {
            // try random free neighbour
            const dirs = [[-1,0],[0,1],[1,0],[0,-1]];
            const shuffled = dirs.sort(()=>Math.random()-0.5);
            for (let [dr,dc] of shuffled) {
              const nr = g.r + dr, nc = g.c + dc;
              if (isFree(nr,nc)) return { ...g, r: nr, c: nc };
            }
            return g;
          }

          // Normal chase/scatter behavior
          let target;
          if (g.mode === "scatter") {
            // each ghost scatter corner (approx)
            if (g.id === "blinky") target = { r: 1, c: COLS - 2 };
            if (g.id === "pinky")  target = { r: 1, c: 1 };
            if (g.id === "inky")   target = { r: ROWS - 2, c: COLS - 2 };
            if (g.id === "clyde")  target = { r: ROWS - 2, c: 1 };
          } else {
            // chase mode: classic target rules
            if (g.id === "blinky") {
              target = { r: pac.r, c: pac.c };
            } else if (g.id === "pinky") {
              // 4 tiles ahead of pac (approx)
              const ahead = tilesAhead(pac, 4);
              target = ahead;
            } else if (g.id === "inky") {
              // vector from blinky to two tiles ahead of pac (approx)
              const blinky = currentGhosts.find(x => x.id === "blinky") || currentGhosts[0];
              const ahead2 = tilesAhead(pac, 2);
              // vector from blinky to ahead2
              const vr = ahead2.r - blinky.r;
              const vc = ahead2.c - blinky.c;
              target = { r: ahead2.r + vr, c: ahead2.c + vc };
              // clamp target into bounds
              if (!inBounds(target.r, target.c) || MAZE[target.r]?.[target.c] === 1) {
                target = ahead2;
              }
            } else if (g.id === "clyde") {
              // if far -> chase, if near -> scatter corner
              const d = dist(pac, g);
              if (d > 4) target = { r: pac.r, c: pac.c };
              else target = { r: ROWS - 2, c: 1 };
            }
          }

          // resolve target into next step
          // ensure target is free, otherwise fallback to pac tile
          if (!isFree(target.r, target.c)) target = { r: pac.r, c: pac.c };

          const next = bfsNextStep([g.r, g.c], [target.r, target.c]);
          if (next) return { ...g, r: next[0], c: next[1] };
          // fallback random
          const dirs = [[-1,0],[0,1],[1,0],[0,-1]];
          for (let [dr,dc] of dirs) {
            const nr = g.r + dr, nc = g.c + dc;
            if (isFree(nr,nc)) return { ...g, r: nr, c: nc };
          }
          return g;
        });
      });
    }, 360); // ghost speed
    return () => clearInterval(id);
  }, [pac, modeIdx, frightTimer, isPaused]);

  // after ghosts move, check collisions with pac
  useEffect(() => {
    ghosts.forEach(g => {
      if (g.r === pac.r && g.c === pac.c && !g.eaten) {
        if (g.frightened) {
          // eat ghost
          setScore(s => s + 200);
          setGhosts(gs => gs.map(gg => gg.id === g.id ? ({ ...gg, eaten: true }) : gg));
        } else {
          // pac dies
          handleDeath();
        }
      }
    });
  }, [ghosts, pac]);

  function tilesAhead(pacState, n) {
    let { r, c, dir } = pacState;
    let tr = r, tc = c;
    if (dir === "up") tr = r - n;
    if (dir === "down") tr = r + n;
    if (dir === "left") tc = c - n;
    if (dir === "right") tc = c + n;
    if (!inBounds(tr,tc) || MAZE[tr][tc] === 1) return { r, c };
    return { r: tr, c: tc };
  }

  function triggerFright() {
    // set frightened on all alive ghosts
    setGhosts(gs => gs.map(g => ({ ...g, frightened: !g.eaten, mode: "frightened" })));
    setFrightTimer(7); // frightened lasts 7s
  }

  function handleDeath() {
    // pause movement then respawn or game over
    setIsPaused(true);
    setLives(l => {
      const newLives = l - 1;
      setTimeout(() => {
        if (newLives <= 0) {
          Alert.alert("Game Over", `Score: ${score}`, [{ text: "Restart", onPress: resetGame }], { cancelable:false });
        } else {
          // respawn positions
          setPac(INIT_PAC);
          setGhosts(INIT_GHOSTS.map(g=>({ ...g, mode: MODE_SEQUENCE[modeIdx].mode, frightened:false, eaten:false })));
          setIsPaused(false);
        }
      }, 600);
      return newLives;
    });
  }

  function resetGame() {
    setPac(INIT_PAC);
    setGhosts(INIT_GHOSTS.map(g=>({ ...g, mode: "scatter", frightened:false, eaten:false })));
    setPellets(p => p.map(x => ({ ...x, eaten:false })));
    setPowerPellets(pp => pp.map(x => ({ ...x, eaten:false })));
    setScore(0);
    setLives(3);
    setIsPaused(false);
    setModeIdx(0);
    setModeTimer(MODE_SEQUENCE[0].duration);
    setFrightTimer(0);
  }

  // manual controls
  function movePac(dir) { queuePacDir(dir); }

  // rendering helpers
  const cellLeft = (c) => OFFSET_X + c * CELL;
  const cellTop = (r) => OFFSET_Y + r * CELL;

  const pelletsLeft = pellets.filter(p => !p.eaten).length + powerPellets.filter(p=> !p.eaten).length;

  return (
    <View style={styles.screen} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Text style={styles.title}>Pac-Man (Real-ish)</Text>
        <Text style={styles.hud}>Score: {score} • Lives: {lives} • Mode: {MODE_SEQUENCE[modeIdx].mode} • Pellets: {pelletsLeft}</Text>
      </View>

      <View style={[styles.board, { width: COLS*CELL + OFFSET_X*2, height: ROWS*CELL + OFFSET_Y - 40 }]}>
        {/* walls */}
        {MAZE.map((rowArr, r) => (
          rowArr.map((val, c) =>
            val === 1 ? (
              <View key={`w-${r}-${c}`} style={[styles.wall, { left: cellLeft(c), top: cellTop(r), width: CELL, height: CELL }]} />
            ) : null
          )
        ))}

        {/* pellets */}
        {pellets.map((p,i) => !p.eaten && (
          <View key={`pel-${i}`} style={[styles.pellet, { left: cellLeft(p.c) + CELL/2 - 4, top: cellTop(p.r) + CELL/2 - 4 }]} />
        ))}

        {/* power pellets */}
        {powerPellets.map((p,i) => !p.eaten && (
          <View key={`pow-${i}`} style={[styles.power, { left: cellLeft(p.c) + CELL/2 - 7, top: cellTop(p.r) + CELL/2 - 7 }]} />
        ))}

        {/* pac */}
        <View style={[styles.pac, { left: cellLeft(pac.c) + CELL/2 - 12, top: cellTop(pac.r) + CELL/2 - 12 }]} />

        {/* ghosts */}
        {ghosts.map((g,i) => {
          const styleGhost = [
            styles.ghost,
            { left: cellLeft(g.c) + CELL/2 - 12, top: cellTop(g.r) + CELL/2 - 12 },
          ];
          let bodyStyle = { backgroundColor: g.color };
          if (g.eaten) bodyStyle = { backgroundColor: "#222" };
          if (g.frightened && !g.eaten) bodyStyle = { backgroundColor: "#7fb0ff" };
          return <View key={`g-${i}`} style={[...styleGhost, bodyStyle]} />;
        })}
      </View>

      {/* controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => movePac("up")} style={styles.controlBtn}><Text style={styles.controlTxt}>↑</Text></TouchableOpacity>
        <View style={{ flexDirection:'row' }}>
          <TouchableOpacity onPress={() => movePac("left")} style={styles.controlBtn}><Text style={styles.controlTxt}>←</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => movePac("right")} style={styles.controlBtn}><Text style={styles.controlTxt}>→</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => movePac("down")} style={styles.controlBtn}><Text style={styles.controlTxt}>↓</Text></TouchableOpacity>
      </View>

      {/* bottom */}
      <View style={styles.bottomRow}>
        <TouchableOpacity onPress={resetGame} style={styles.btnGreen}><Text style={{color:'#fff'}}>Restart</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnRed}><Text style={{color:'#fff'}}>Exit</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, backgroundColor: "#000" },
  header: { paddingTop:36, paddingHorizontal:12, paddingBottom:6 },
  title: { color:"#fff", fontSize:20, fontWeight:"700" },
  hud: { color:"#ddd", marginTop:6 },

  board: {
    position:"relative",
    marginTop:8,
    marginLeft:6,
    backgroundColor:"#000",
  },

  wall: {
    position:"absolute",
    backgroundColor:"#233e8b",
    borderWidth:1,
    borderColor:"#1a2e5f",
  },

  pellet: {
    position:"absolute",
    width:8,
    height:8,
    borderRadius:4,
    backgroundColor:"#fff",
  },
  power: {
    position:"absolute",
    width:14,
    height:14,
    borderRadius:7,
    backgroundColor:"#ffdf6b",
    borderWidth:1,
    borderColor:"#cfa83b",
  },

  pac: {
    position:"absolute",
    width:24,
    height:24,
    borderRadius:12,
    backgroundColor:"#ffd400",
    borderWidth:2,
    borderColor:"#c8a900",
  },

  ghost: {
    position:"absolute",
    width:24,
    height:24,
    borderTopLeftRadius:12,
    borderTopRightRadius:12,
    borderBottomLeftRadius:6,
    borderBottomRightRadius:6,
    borderWidth:1,
    borderColor:"#000",
  },

  controls: {
    position:"absolute",
    bottom:92,
    left:0,
    right:0,
    alignItems:"center",
  },
  controlBtn: {
    backgroundColor:"#111",
    padding:10,
    margin:8,
    borderRadius:8,
    minWidth:56,
    alignItems:"center",
  },
  controlTxt: { color:"#fff", fontSize:20 },

  bottomRow: {
    position:"absolute",
    bottom:24,
    left:20,
    right:20,
    flexDirection:"row",
    justifyContent:"space-between",
  },
  btnGreen: { backgroundColor:"#0b7", padding:10, borderRadius:8 },
  btnRed: { backgroundColor:"#f55", padding:10, borderRadius:8 },
});
