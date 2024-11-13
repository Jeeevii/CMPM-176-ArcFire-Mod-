title = "MODDED ARCFIRE";

description = `
[Hold]
  Set arc
[Release]
  Fire
`;

characters = [
  `
  ll
  l  l
 llll
l l  
  lll
 l 
`,
  `
  ll
l l
 llll
  l  l
llll
    l
`,

`
ll
l
llll
l l
l ll
l
`,
`
 ll
l
llll
l
ll l
  l
`,



  ``,
  `
 llll
  l  
 lllll
l l  
  lll
 l 
`,
  `
 llll
  l
lllll
  l  l
llll
    l
`,
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 16,
  theme: "crt",
};

let pos;
let moveAngle;
let moveDist;
let angle; // angle is indicated by the sword
let arcFrom;
let arcTo;
let shots;
let isPressing;

let enemies;
let enemyAddAngle;
let enemyAddTicks;

let innocents;
let innocentsRoamTicks;
let innocentsRoamAngle;
let multiplier;

function update() {
  // i think this is inital values?
  if (!ticks) {
    pos = vec(50, 50);
    angle = 0;
    shots = [];
    isPressing = false;
    moveAngle = 0;
    moveDist = 0;
    enemies = [];
    innocents = times(10, () => ({
      pos: vec(rnd(40, 60), rnd(40, 60)),
      targetPos: vec(rnd(40, 60), rnd(40, 60)),
      vel: vec(),
      ticks: rnd(60),
      wandering: false,
      
    }));;
    enemyAddAngle = rnd(PI * 2);
    enemyAddTicks = 0;
    innocentsRoamTicks = 0;
    innocentsRoamAngle = rnd(PI * 2);
  }

  // moves player based on released shot
  if (moveDist > 1) {
    pos.add(vec(moveDist * 0.2).rotate(moveAngle));
    moveDist *= 0.2;
    if (!pos.isInRect(10, 10, 90, 90)) {
      moveAngle += PI;
    }
    pos.clamp(10, 90, 10, 90);
  }
  angle += 0.07 * difficulty; // rotates sword angle

  // displays circle (possibly replace circle with moving innocents?)
  color("light_blue");
  arc(50, 50, 7, 4);

  // displays sword
  color("light_black");
  line(pos, vec(9).rotate(angle).add(pos), 2);

  // displays player (???)
  color("black");
  char(addWithCharCode("a", floor(ticks / 30) % 2), pos, {
    mirror: { x: cos(moveAngle) < 0 ? -1 : 1 },
  });
  let range = 0;

  // updates arc
  if (isPressing) {
    arcTo = angle;
    range = 300 / sqrt((arcTo - arcFrom) * 30);
    color("green");
    line(pos, vec(range).rotate(arcFrom).add(pos));
    line(pos, vec(range).rotate(arcTo).add(pos));
    arc(pos, range, 3, arcFrom, arcTo);
  }

  // if arc maxes out
  if (isPressing && arcTo - arcFrom > PI) {
    isPressing = false;
  }

  // fires shot on release
  if (isPressing && input.isJustReleased) {
    isPressing = false;
    if (shots.length === 0) {
      play("select");
      shots.push({ pos, d: 0, range, arcFrom, arcTo });
    }

    // sets vars to move player
    moveAngle = (arcTo + arcFrom) / 2;
    moveDist = range / 2;
  }

  // starts sword slash
  if (input.isJustPressed) {
    play("laser");
    arcFrom = angle;
    isPressing = true;
    multiplier = 1;
  }

  // updates/displays shots
  color("cyan");
  shots = shots.filter((s) => {
    s.d += 2;
    arc(pos, s.d, 5, s.arcFrom, s.arcTo);
    return s.d < s.range;
  });

  // spawns new enemies 
  enemyAddTicks -= difficulty; 
  if (enemyAddTicks < 0) {
    const pos = vec(70).rotate(enemyAddAngle).add(50, 50);
    const vel = vec(rnd(10))
      .rotate(rnd(PI * 2))
      .add(50, 50)
      .sub(pos)
      .div(500 / rnd(1, difficulty));
    enemies.push({ pos, vel });
    enemyAddTicks += rnd(40, 60);
    if (rnd() < 0.1) {
      enemyAddAngle = rnd(PI * 2);
    } else {
      enemyAddAngle += rnds(0.05);
    }
  }

  innocentsRoamTicks -= difficulty;
  if (innocentsRoamTicks < 0) {
    console.log("innocents roaming");
    let n = Math.floor(rnd(0, innocents.length));
    innocents[n].wandering = true;
    innocents[n].targetPos.set(rnd(15, 85), rnd(15, 85));
    innocentsRoamTicks = 150;
  }
  
  // updates innocents
  color("green");
  remove(innocents, (h) => {
    let ta; // target angle to run towards


    // makes innocents run away from enemies
    if (enemies.length > 0) {
      const ne = getNearestActor(enemies, h.pos);
      if (ne.pos.distanceTo(h.pos) < 25) {
        ta = ne.pos.angleTo(h.pos); // sets angle to run away from enemy
      }
    }

    // if wandering 
    if (h.wandering) {
      ta = h.pos.angleTo(h.targetPos);
      if (h.pos.distanceTo(h.targetPos) < 1) {
        h.targetPos.set(rnd(15, 85), rnd(15, 85));
      }
    }

    // resets target position to center of screen
    if (ta == null) {
      if (h.pos.distanceTo(h.targetPos) < 1) {
        h.targetPos.set(rnd(40, 60), rnd(40, 60));
      }
      ta = h.pos.angleTo(h.targetPos);
    }



    h.vel.addWithAngle(ta, 0.01);
    h.vel.mul(0.8);
    let px = h.pos.x;
    h.pos.add(vec(h.vel).mul(difficulty));
    h.pos.clamp(10, 90, 10, 90);
    h.ticks += difficulty;
    const c = char(addWithCharCode("c", floor(h.ticks / 30) % 2), h.pos, {
      mirror: { x: h.pos.x > px ? 1 : -1 },
    });
    if (c.isColliding.rect.black) {
      play("explosion");
      particle(h.pos, 9, 2);
      return true;
    }

    if (c.isColliding.rect.red) {
      play("explosion");
      particle(h.pos, 9, 2);
      return true;
    }
  });

  // updates enemies 
  color("red");
  enemies = enemies.filter((e) => {
    // e refers to enemies. enemies made up of {p, v}
    e.pos.add(e.vel);
    const c = char(addWithCharCode("e", floor(ticks / 30) % 2), e.pos, {
      mirror: { x: cos(e.vel.angle) < 0 ? -1 : 1 },
    }).isColliding;

    // if enemy is hit by the arc
    if (c.rect.cyan) {
      play("powerUp");
      particle(e.pos);
      addScore(multiplier, e.pos);
      multiplier++;
      return false;
    }

    // if enemy reaches player or circle
    if (c.char.a || c.char.b || c.rect.light_blue) {
      if (c.rect.light_blue) {
        text("X", vec(e.pos).sub(50, 50).div(2).add(50, 50));
      } else {
        text("X", pos);
      }
      play("lucky");
      end();
    }
    return true;
  });
}

function getNearestActor(actors, pos) {
  return actors.reduce((a, b) => {
    return a.pos.distanceTo(pos) < b.pos.distanceTo(pos) ? a : b;
  });
}