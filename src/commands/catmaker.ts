import { createCommand } from 'chatter'
import * as debug from 'debug'
import { USE_CLI } from '../env'
import { randomByWeight, WeightedValues, randomInt } from '../util'
const log = debug('bort:commands:catmaker')

interface CatDirection {
  sprite : string
  delta : [number, number]
}
interface CatConfig {
  emptySprite : string
  startSprite : string
  headSprites : WeightedValues
  crossoverSprites : WeightedValues
  directions : {
    f : CatDirection
    l : CatDirection
    r : CatDirection
  }[]
  /** We may want to wrap the result in a block, eg ensure monospace formatting. */
  wrapResult : (result : string) => string
}

function getConfig(isBpf : boolean) : CatConfig {
  if(isBpf) {
    return {
      emptySprite: ':catspace:',
      startSprite: ':catbot:',
      headSprites: {
        ':cattop:': 120,
        ':cattoprev:': 60,
        ':chapo:': 1,
        ':dmx:': 1,
        ':dncash:': 1,
        ':drago:': 1,
        ':gape:': 2,
        ':hayao:': 2,
        ':heathcliff:': 5,
        ':hi:': 5,
        ':kuchi:': 5,
        ':murphy:': 1,
        ':robocop:': 1
      },
      crossoverSprites: {
        ':catcross1:': 1,
        ':catcross2:': 1
      },
      directions: [
        // facing right
        {
          f: { sprite: ':catlr:', delta: [ 1,  0] },
          l: { sprite: ':catul:', delta: [ 0,  1] },
          r: { sprite: ':catld:', delta: [ 0, -1] }
        },
        // facing up
        {
          f: { sprite: ':catud:', delta: [ 0,  1] },
          l: { sprite: ':catld:', delta: [-1,  0] },
          r: { sprite: ':catdr:', delta: [ 1,  0] }
        },
        // facing left
        {
          f: { sprite: ':catlr:', delta: [-1,  0] },
          l: { sprite: ':catdr:', delta: [ 0, -1] },
          r: { sprite: ':catur:', delta: [ 0,  1] }
        },
        // facing down
        {
          f: { sprite: ':catud:', delta: [ 0, -1] },
          l: { sprite: ':catur:', delta: [ 1,  0] },
          r: { sprite: ':catul:', delta: [-1,  0] }
        }
      ],
      wrapResult: result => result
    }
  }
  return {
    emptySprite: ' ',
    startSprite: 'X',
    headSprites: { O: 1 },
    crossoverSprites: { '┼': 1 },
    directions: [
      // facing right
      {
        f: { sprite: '─', delta: [ 1,  0] },
        l: { sprite: '┘', delta: [ 0,  1] },
        r: { sprite: '┐', delta: [ 0, -1] }
      },
      // facing up
      {
        f: { sprite: '│', delta: [ 0,  1] },
        l: { sprite: '┐', delta: [-1,  0] },
        r: { sprite: '┌', delta: [ 1,  0] }
      },
      // facing left
      {
        f: { sprite: '─', delta: [-1,  0] },
        l: { sprite: '┌', delta: [ 0, -1] },
        r: { sprite: '└', delta: [ 0,  1] }
      },
      // facing down
      {
        f: { sprite: '│', delta: [ 0, -1] },
        l: { sprite: '└', delta: [ 1,  0] },
        r: { sprite: '┘', delta: [-1,  0] }
      }
    ],
    wrapResult: result => `\`\`\`\n${result}\n\`\`\``
  }
}


interface TurnChance {
  f : number
  l : number
  r : number
}

const gridSizeX = 16
const gridSizeY = 20

const startDirection = 1

const defaultExtraCatChance = 0.5
const defaultTurnChance : TurnChance = {
  f: 1,
  l: 1,
  r: 1
}

function addCat(grid : string[][], config : CatConfig, turnChance : TurnChance) : boolean {
  const {
    emptySprite,
    startSprite,
    crossoverSprites,
    directions,
    headSprites
  } = config
  const straightSegments = new Set([directions[0].f.sprite, directions[1].f.sprite])

  log('new cat!')

  // search for an empty spot to put the cat.
  let attempts = 5
  let x : number
  let y : number
  do {
    x = randomInt(gridSizeX)
    y = Math.max(randomInt(gridSizeY / 2) - 1, 0)
    attempts--
    if(attempts === 0) {
      log(`can't find an empty space!`)
      return false
    }
  } while(grid[x][y] !== emptySprite || grid[x][y + 1] !== emptySprite)

  // we can infer previous steps if we need to backtrack, but this is simpler
  const steps : { prevSprite : string, delta : [number, number] }[] = []

  // lay initial sprite.
  grid[x][y] = startSprite
  y += 1
  let dir = startDirection

  // function canGoInDirection(direction : number) : boolean {
  //   // if we're facing the opposite direction, we can't go in that direction.
  //   if(dir === (direction + 2) % 4) return false

  //   let xToCheck = x
  //   let yToCheck = y
  //   do {
  //     const [dX, dY] = directions[direction].f.delta
  //     xToCheck = xToCheck + dX
  //     yToCheck = yToCheck + dY
  //     if(xToCheck < 0 || xToCheck >= gridSizeX || yToCheck < 0 || yToCheck >= gridSizeY) return false
  //     // if it's an empty space above, we can go in that direction.
  //     if(grid[xToCheck][yToCheck] === emptySprite) return true
  //     // if it's anything except an empty space or a straight segment, we can't go in that direction.
  //     if(!straightSegments.has(grid[xToCheck][yToCheck])) return false
  //     // if it's a straight segment, check the same conditions for the next space in that direction.
  //   } while(true)
  // }


  // TODO: number of steps might be more interesting as a gaussian, and should
  // be configurable.
  let stepsLeft = randomInt(20, 100)
  do {
    log(`steps left: ${stepsLeft}`)
    ////////////////////////////
    // log full state at each step.
    if(USE_CLI) {
      const rows : string[] = []
      for(let i = gridSizeY - 1; i >= 0; i--) {
        const row = []
        for(let j = 0; j < gridSizeX; j++) {
          row.push(grid[j][i])
        }
        rows.push(row.join(','))
      }
      log('state:')
      log(rows.join('\n'))
    }
    ////////////////////////////

    // we should only have been placed in a non-empty sprite if we're doing a crossover
    if(grid[x][y] !== emptySprite) {
      if((dir === 1 || dir === 3 && grid[x][y] === directions[0].f.sprite) ||
        (dir === 0 || dir === 2 && grid[x][y] === directions[1].f.sprite)) {
        grid[x][y] = randomByWeight(crossoverSprites)
        const [dX, dY] = directions[dir].f.delta
        x += dX
        y += dY
        log(`crossover! pos now [${x},${y}]`)
        continue
      }
      console.warn(`Expected empty sprite at [${x},${y}], found ${grid[x][y]}`)
    }

    const nextDirections = directions[dir]

    // remove all invalid turns:
    const validTurns = { ...turnChance }
    for(const [nextDir, { delta: [dX, dY] }] of Object.entries(nextDirections)) {
      // don't go out of bounds, and stop 1 below the top row so we always have
      // space for the head
      if(x + dX < 0 || x + dX >= gridSizeX || y + dY < 0 || y + dY >= gridSizeY - 1) {
        log(`deleting ${nextDir}`)
        delete (validTurns as any)[nextDir]
        continue
      }

      // if the cell is occupied and we're not going forward, this isn't a valid direction.
      if(grid[x + dX][y + dY] !== emptySprite && nextDir !== 'f') {
        delete (validTurns as any)[nextDir]
        continue
      }

      // FIXME: all this logic is duplicated in the canGoInDirection method above.

      // don't go over non-empty cells, UNLESS the direction is forward and the
      // segment is a straight that's perpendicular -- we'll make it a crossover.
      let xToCheck = x
      let yToCheck = y
      let shouldDelete = false
      do {
        xToCheck = xToCheck + dX
        yToCheck = yToCheck + dY
        if(xToCheck < 0 || xToCheck >= gridSizeX || yToCheck < 0 || yToCheck >= gridSizeY) {
          shouldDelete = true
          break
        }
        // if it's an empty space above, we can go in that direction.
        if(grid[xToCheck][yToCheck] === emptySprite) break
        // if it's anything except an empty space or a straight segment, we can't go in that direction.
        if(!straightSegments.has(grid[xToCheck][yToCheck])) { shouldDelete = true; break }
        // if it's a straight segment, check the same conditions for the next space in that direction.
      } while(true)
      if(shouldDelete) {
        delete (validTurns as any)[nextDir]
        continue
      }
    }

    if(Object.keys(validTurns).length === 0) {
      log('no valid turns')
      break
    }

    // update our current position and facing
    {
      const nextDirection = randomByWeight(validTurns)
      const { sprite, delta: [dX, dY] } = nextDirections[nextDirection]

      steps.push({ prevSprite: grid[x][y], delta: [dX, dY] })

      grid[x][y] = sprite
      x += dX
      y += dY
      log(`pos now [${x},${y}]`)

      if(nextDirection === 'l') {
        dir = (dir + 1) % 4
      }
      else if(nextDirection === 'r') {
        dir = dir - 1
        if(dir === -1) dir = 3
      }
    }

    stepsLeft--
  } while(stepsLeft > 0)

  // end by moving up and placing the head.
  // TODO: backtrack until going up is valid;
  // we can also move up into a straight segment if there's space on the other side
  // (looking forward until there's a non-straight segment OR a free space)
  grid[x][y] = randomByWeight(headSprites)
  // switch(dir) {
  //   case 0:
  //     // facing east: turn north
  //     grid[x][y] = directions[dir].l.sprite
  //     grid[x][y + 1] = randomByWeight(headSprites)
  //     break
  //   case 1:
  //     // facing north: just place the head
  //     grid[x][y] = randomByWeight(headSprites)
  //     break
  //   case 2:
  //     // facing west: turn north
  //     grid[x][y] = directions[dir].r.sprite
  //     grid[x][y + 1] = randomByWeight(headSprites)
  //     break
  //   case 3:
  //     // if we're facing south, we have a bit of a tricky situation. we can't
  //     // move straight up, so we want to backtrack and change the last sprite
  //     // to face up. except the last sprite could be '┐', '┌', or '│', and if
  //     // it's the latter, we have to keep backtracking until we hit a
  //     // different direction.
  //     grid[x][y] = emptySprite
  //     y = y + 1
  //     while(grid[x][y] === directions[3].f.sprite) {
  //       grid[x][y] = emptySprite
  //       y = y + 1
  //     }

  //     if(grid[x][y] === directions[0].r.sprite) { // ┐
  //       grid[x][y] = directions[0].l.sprite
  //     }
  //     else {
  //       grid[x][y] = directions[2].r.sprite
  //     }
  //     grid[x][y + 1] = randomByWeight(headSprites)
  //     break
  //   default:
  //     throw new Error('unknown direction')
  // }
  return true
}


// The main command.

export default createCommand(
  {
    name: 'cat',
    description: 'get cat',
    usage: '[extra cat chance [go left chance [go right chance [go straight chance]]]]'
  },
  (message : string) : string => {
    const turnChance = { ...defaultTurnChance }
    let extraCatChance = defaultExtraCatChance
    if(message.length > 0) {
      const [chance, l, r, f] = message.split(' ')
        .map(n => parseInt(n, 10))
        .filter(n => !isNaN(n)) as (number | undefined)[]

      if(typeof chance === 'number') extraCatChance = chance / 100
      if(typeof l === 'number') turnChance.l = l
      if(typeof r === 'number') turnChance.r = r
      if(typeof f === 'number') turnChance.f = f
      log(`cat chance ${extraCatChance} l ${turnChance.l} r ${turnChance.r} f ${turnChance.f}`)
    }

    // TODO: handle per-server via store
    const config = getConfig(!USE_CLI)

    const grid : string[][] = []
    for(let i = 0; i < gridSizeX; i++) {
      grid[i] = Array<string>(gridSizeY).fill(config.emptySprite)
    }

    let lastAddSucceeded = addCat(grid, config, turnChance)

    while(Math.random() < extraCatChance && lastAddSucceeded) {
      lastAddSucceeded = addCat(grid, config, turnChance)
    }

    // print out the result.
    const rows : string[] = []
    for(let i = gridSizeY - 1; i >= 0; i--) {
      const row = []
      for(let j = 0; j < gridSizeX; j++) {
        row.push(grid[j][i])
      }
      rows.push(row.join(''))
    }
    return config.wrapResult(rows.join('\n'))
  }
)
