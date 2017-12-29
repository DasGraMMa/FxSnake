/**
 * The direction enum defining directions to use for directions.
 */
const Direction = {
    None: -1,
    Right: 0,
    Up: 1,
    Left: 2,
    Down: 3
};

/**
 * The class representing a Vector2 (vector with 2 components).
 */
class Vector2
{
    constructor(x = 0, y = 0)
    {
        this.x = x;
        this.y = y;
    }

    get x() { return this._x; }
    set x(val) { this._x = val; }

    plus(vec2)
    {
        return new Vector2(this.x + vec2.x, this.y + vec2.y);
    }

    equals(vec2)
    {
        if(!(vec2 instanceof Vector2))
        {
            return false;
        }

        return vec2.x == this.x && vec2.y == this.y;
    }
}

/**
 * The class representing a Vector2 with integer components.
 */
class Vector2i extends Vector2
{
    get x() { return this._x; }
    set x(val)
    {
        this._x = Math.floor(val);
    }

    get y() { return this._y; }
    set y(val)
    {
        this._y = Math.floor(val);
    }
    
    plus(vec2)
    {
        return new Vector2i(this.x + vec2.x, this.y + vec2.y);
    }
}

/**
 * The game itself.
 */
class Game
{
    /**
     * Starts the game and returns the instance.
     */
    static start()
    {
        return new this();
    }

    /**
     * Logs stuff.
     * @param {*} msg 
     */
    static log(msg)
    {
        console.log("%cFxSnake%c:\t%s", "color: red; font-weight: bold;", "", msg);
    }

    /**
     * Constructs a game.
     */
    constructor()
    {
        Game.log("Constructing a new game.");

        // Canvas handle first.
        this.canvasEl = document.getElementById("game");
        this.canvasContext = this.canvasEl.getContext("2d");
        // Setup document stuff.
        document.addEventListener("keypress", (event) => this.doInput(event));
        
        // Game variables.
        this.blockSize = 16;
        this.direction = Direction.None;
        this.playerPosition = [];
        this.playerTailLength = 5;
        this.playerControls = {
            Up: "w",
            Down: "s",
            Right: "d",
            Left: "a"
        };
        this.foodPosition = null;
        this.score = 0;
        this.highScore = 1000;

        // Game loop variables.
        this.loopDelay = -1;
        this.running = false;
        this.loopTimeout = -1;

        this.startIntern();
    }

    /**
     * The internal method for starting a new game.
     */
    startIntern()
    {
        Game.log("Starting a new game.");

        // Set the important variables again.
        this.direction = Direction.Up;
        this.playerTailLength = 5;
        this.score = 0;

        let plInitialPos = new Vector2i(this.gridWidth / 2, this.gridHeight / 2);
        this.playerPosition.unshift(plInitialPos);

        this.loopDelay = 240;
        this.running = true;
        clearTimeout(this.loopTimeout);

        this.doGameLoop();
    }

    doGameLoop()
    {
        this.doLogic();
        this.doDrawing();

        if(this.running) this.loopTimeout = setTimeout(() => this.doGameLoop(), this.loopDelay);
    }

    doLogic()
    {
        if(this.foodPosition == null)
        {
            this.foodPosition = this.gridRandomPos;
        }

        let curPlayerPos = this.playerPosition[0],
            newPlayerPos = new Vector2i();
        switch(this.direction)
        {
        case Direction.Up:
            newPlayerPos = curPlayerPos.plus(new Vector2i(0, -1));
            break;
        case Direction.Down:
            newPlayerPos = curPlayerPos.plus(new Vector2i(0, 1));
            break;
        case Direction.Right:
            newPlayerPos = curPlayerPos.plus(new Vector2i(1, 0));
            break;
        case Direction.Left:
            newPlayerPos = curPlayerPos.plus(new Vector2i(-1, 0));
            break;
        }

        if(newPlayerPos.x < 0) newPlayerPos.x = this.toGridPosition(this.canvasEl.width) - 1;
        else if(newPlayerPos.x > this.toGridPosition(this.canvasEl.width) - 1) newPlayerPos.x = 0;

        if(newPlayerPos.y < 0) newPlayerPos.y = this.toGridPosition(this.canvasEl.height) - 1;
        else if(newPlayerPos.y > this.toGridPosition(this.canvasEl.height) - 1) newPlayerPos.y = 0;

        this.playerPosition.unshift(newPlayerPos);
        if(this.playerPosition.length > this.playerTailLength) this.playerPosition.pop();

        for(let i = 1; i < this.playerPosition.length; i++)
        {
            if(newPlayerPos.equals(this.playerPosition[i]))
            {
                this.onDeath();
                return;
            }
        }

        if(newPlayerPos.equals(this.foodPosition))
        {
            this.collectFood();
        }
    }

    onDeath()
    {
        Game.log("YOU'RE DEAD.");
    }

    collectFood()
    {
        this.playerTailLength++;
        this.foodPosition = null;
        let scoreToAdd = Math.round(175 * (this.blockSize / 8) * Math.random());
        this.score += scoreToAdd;
        this.loopDelay = Math.max(20, Math.floor(this.loopDelay * .9));

        Game.log("Collected food. New tail length: " + this.playerTailLength + ", added score: " + scoreToAdd + ", loop delay: " + this.loopDelay);
    }

    doDrawing()
    {
        this.canvasContext.fillStyle = "white";
        this.canvasContext.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);
        
        this.canvasContext.strokeStyle = "rgba(0,0,0,.1)";
        for(let i = 0; i < this.gridWidth; i++)
        {
            for(let j = 0; j < this.gridHeight; j++)
            {
                this.canvasContext.strokeRect(this.toPixelPosition(i), this.toPixelPosition(j), this.blockSize, this.blockSize);
            }
        }

        this.canvasContext.fillStyle = "black";
        for(let i = 0; i < Math.min(this.playerPosition.length, this.playerTailLength); i++)
        {
            this.canvasContext.fillRect(this.toPixelPosition(this.playerPosition[i].x),
                this.toPixelPosition(this.playerPosition[i].y), this.blockSize, this.blockSize);
        }

        if(this.foodPosition != null)
        {
            this.canvasContext.fillStyle = "green";
            this.canvasContext.fillRect(this.toPixelPosition(this.foodPosition.x),
                this.toPixelPosition(this.foodPosition.y), this.blockSize, this.blockSize);
        }

        this.canvasContext.fillStyle = "black";
        this.canvasContext.font = "32px SMMaker";
        this.canvasContext.textAlign = "right";
        this.canvasContext.textBaseline = "top";
        this.canvasContext.fillText("Score: " + this.score, this.canvasEl.width - 8, 8);
    }

    doInput(keyEvent)
    {
        if(keyEvent.key == "r")
        {
            this.startIntern();
        }
        else if(keyEvent.key == "p")
        {
            this.running = !this.running;
            if(this.running) this.doGameLoop();

            Game.log("Game " + (this.running ? "resumed" : "paused") + ".");
        }
        else if(this.checkPressedDirection(keyEvent) != Direction.None
            && this.running)
        {
            this.changeDirection(this.checkPressedDirection(keyEvent));
        }
    }

    changeDirection(dir)
    {
        switch(this.direction)
        {
        case Direction.Up:
            if(dir == Direction.Down) return;
            break;
        case Direction.Down:
            if(dir == Direction.Up) return;
            break;
        case Direction.Left:
            if(dir == Direction.Right) return;
            break;
        case Direction.Right:
            if(dir == Direction.Left) return;
            break;
        }

        this.direction = dir;

        Game.log("Switched to direction " + dir);
    }

    checkPressedDirection(keyEvent)
    {
        switch(keyEvent.key)
        {
        case this.playerControls.Up:
            return Direction.Up;
        case this.playerControls.Down:
            return Direction.Down;
        case this.playerControls.Right:
            return Direction.Right;
        case this.playerControls.Left:
            return Direction.Left;
        }

        return Direction.None;
    }

    get gridWidth()
    {
        return Math.floor(this.canvasEl.width / this.blockSize);
    }

    get gridHeight()
    {
        return Math.floor(this.canvasEl.height / this.blockSize);
    }

    get gridRandomPos()
    {
        return new Vector2i(this.gridWidth * Math.random(), this.gridHeight * Math.random());
    }

    toGridPosition(coord)
    {
        return coord / this.blockSize;
    }

    toPixelPosition(coord)
    {
        return coord * this.blockSize;
    }
}

// Starts the game.
let game = Game.start();
