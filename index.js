const {
    Engine, 
    Render, 
    World, 
    Runner, 
    Bodies,
    Body,
    Events   
    } = Matter;

// Global varialbes
const cellsHorizontal = 14;
const cellsVertical = 13;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);


// Walls to constrain bodies from falling

const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, {isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, {isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, {isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, {isStatic: true })
];

World.add(world, walls);


// Maze generation

// fisher-yates shuffle
const shuffle = (arr) => {
    let counter = arr.length;
    

    while (counter > 0){
        const index = Math.floor(Math.random() * counter);

        counter--;
        const temp = arr[counter];        
        arr[counter] = arr[index];
        arr[index] = temp;
        

    }
    return arr;
};

const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));
const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

// Step 2: picking random starting point
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

// 
const stepThroughCell = (row, column) => {
    // if I have visited the cell at [row, column], then return
    if(grid[row][column]){
        return;
    }

    // Mark this cell as being visited
    grid[row][column] = true;

    // Assemble randomly-ordered list of neighbours
    const neighbours = shuffle([
        //above
        [row - 1, column, 'up'],
        // // below
        [row + 1, column, 'down'],
        // left
        [row, column - 1, 'left'],
        // right
        [row, column + 1, 'right']

    ]);
    

    // for each neighbour...
    for(let neighbour of neighbours){
        const[nextRow, nextColumn, direction] = neighbour;
        // see of that neighbour is out of bounds
        if(
            nextRow < 0 || 
            nextRow >= cellsVertical || 
            nextColumn < 0 || 
            nextColumn >= cellsHorizontal
            ){
            continue;
        }

        //  if we have visited that neighbour, continue to next neighbour
        if(grid[nextRow][nextColumn]){
            continue;
        }

        // Remove a wall form either of horizontals or verticals
        if(direction === 'left' ){
            verticals[row][column - 1] = true;
        }else if(direction === 'right'){
            verticals[row][column] = true;
        }else if (direction === 'up'){
            horizontals[row - 1][column] = true;
        }else if (direction === 'down'){
            horizontals[row][column] = true;
        }
        // Visit that next cell
        stepThroughCell(nextRow, nextColumn);
    }

};

stepThroughCell(startRow, startColumn);

// itrate ove horizontals

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) =>{
        if(open){
            return;
        }
        // formula for horizontal walls x-coordinate = col[i]*unitlen + unitlen / 2
        // y coordinate = row[i]* unitlen + unitlen
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5,
            {
                isStatic: true,
                label: "Wall",
                render :{
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            5,
            unitLengthY,
            {
                isStatic: true,
                label: "Wall",
                render :{
                    fillStyle: 'red'
                }
            }

        );
        World.add(world, wall);
    });
});

// creating a goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .7,
    unitLengthY * .7,
    {
        isStatic: true,
        label: 'Goal',
        render :{
                    fillStyle: 'green'
                }
    }

);
World.add(world, goal);

// Creating Ball
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    Math.min(unitLengthX, unitLengthY) / 4,
    {
        label: 'Ball',
        render :{
                    fillStyle: 'blue'
                }
    }
);
World.add(world, ball);

// event listner
document.addEventListener('keydown', event => {
    const {x, y} = ball.velocity;
    
    if(event.keyCode === 37){
        Body.setVelocity(ball, {x: x - 5, y});

    }
    if(event.keyCode === 38){
        Body.setVelocity(ball, {x, y: y - 5});
    }
    if(event.keyCode === 39){
        Body.setVelocity(ball, {x: x + 5, y});
    }
    if(event.keyCode === 40){
        Body.setVelocity(ball, {x, y: y + 5});
    }
});

// Win condition
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision) => {
        const labels = ['Goal','Ball'];
        if(
            labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ) {
            document.querySelector('.winner').classList.remove('hidden');
            engine.world.gravity.y = 1;
            world.bodies.forEach(body => {
                if(body.label === 'Wall'){
                    Body.setStatic(body, false);
                }
            })

        } 
    });
})