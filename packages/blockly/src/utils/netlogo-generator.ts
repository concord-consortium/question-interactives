import Blockly from "blockly";

interface NetLogoGenerator extends Blockly.Generator {
  ORDER_ATOMIC: number;
  ORDER_NEW: number;
  ORDER_MEMBER: number;
  ORDER_FUNCTION_CALL: number;
  ORDER_INCREMENT: number;
  ORDER_DECREMENT: number;
  ORDER_BITWISE_NOT: number;
  ORDER_UNARY_PLUS: number;
  ORDER_UNARY_NEGATION: number;
  ORDER_LOGICAL_NOT: number;
  ORDER_TYPEOF: number;
  ORDER_VOID: number;
  ORDER_DELETE: number;
  ORDER_AWAIT: number;
  ORDER_EXPONENTIATION: number;
  ORDER_MULTIPLICATION: number;
  ORDER_DIVISION: number;
  ORDER_MODULUS: number;
  ORDER_SUBTRACTION: number;
  ORDER_ADDITION: number;
  ORDER_BITWISE_SHIFT: number;
  ORDER_RELATIONAL: number;
  ORDER_IN: number;
  ORDER_INSTANCEOF: number;
  ORDER_EQUALITY: number;
  ORDER_BITWISE_AND: number;
  ORDER_BITWISE_XOR: number;
  ORDER_BITWISE_OR: number;
  ORDER_LOGICAL_AND: number;
  ORDER_LOGICAL_OR: number;
  ORDER_CONDITIONAL: number;
  ORDER_ASSIGNMENT: number;
  ORDER_YIELD: number;
  ORDER_COMMA: number;
  ORDER_NONE: number;
  INDENT: string;
  SIZE: Record<string, number>;
  PRODUCE: Record<string, string>;
  BREAK: Record<string, string>;
  CONSUME: Record<string, string>;
  LIGHT: Record<string, number | string>;
  SIZE_VIRUS: Record<string, number>;
  SIZE_ANIMAL: Record<string, number>;
  SIZE_EUTROPHICATION: Record<string, number>;
  HEATSIZE: Record<string, number>;
  SPEED: Record<string, number | string>;
  SPEED_EUTROPHICATION: Record<string, number>;
  MASS: Record<string, number>;
  ARRANGEMENT: Record<string, string>;
  POSITION: Record<string, string>;
  POSITION_WILDFIRES: Record<string, string>;
  HEADING: Record<string, string>;
  DIRECTION: Record<string, string>;
  MAGNITUDE: Record<string, string>;
  EFFECT: Record<string, number>;
  forBlock: Record<string, (block: Blockly.Block) => string>;
  blockToCode(block: Blockly.Block): string | [string, number];
}

export const netlogoGenerator = new Blockly.Generator("NETLOGO") as NetLogoGenerator;

/**
 * https://developer.mozilla.org/en/JavaScript/Reference/Operators/Operator_Precedence
 */
netlogoGenerator.ORDER_ATOMIC = 0;           // 0 "" ...
netlogoGenerator.ORDER_NEW = 1.1;            // new
netlogoGenerator.ORDER_MEMBER = 1.2;         // . []
netlogoGenerator.ORDER_FUNCTION_CALL = 2;    // ()
netlogoGenerator.ORDER_INCREMENT = 3;        // ++
netlogoGenerator.ORDER_DECREMENT = 3;        // --
netlogoGenerator.ORDER_BITWISE_NOT = 4.1;    // ~
netlogoGenerator.ORDER_UNARY_PLUS = 4.2;     // +
netlogoGenerator.ORDER_UNARY_NEGATION = 4.3; // -
netlogoGenerator.ORDER_LOGICAL_NOT = 4.4;    // !
netlogoGenerator.ORDER_TYPEOF = 4.5;         // typeof
netlogoGenerator.ORDER_VOID = 4.6;           // void
netlogoGenerator.ORDER_DELETE = 4.7;         // delete
netlogoGenerator.ORDER_AWAIT = 4.8;          // await
netlogoGenerator.ORDER_EXPONENTIATION = 5.0; // **
netlogoGenerator.ORDER_MULTIPLICATION = 5.1; // *
netlogoGenerator.ORDER_DIVISION = 5.2;       // /
netlogoGenerator.ORDER_MODULUS = 5.3;        // %
netlogoGenerator.ORDER_SUBTRACTION = 6.1;    // -
netlogoGenerator.ORDER_ADDITION = 6.2;       // +
netlogoGenerator.ORDER_BITWISE_SHIFT = 7;    // << >> >>>
netlogoGenerator.ORDER_RELATIONAL = 8;       // < <= > >=
netlogoGenerator.ORDER_IN = 8;               // in      
netlogoGenerator.ORDER_INSTANCEOF = 8;       // instanceof
netlogoGenerator.ORDER_EQUALITY = 9;         // == != === !==
netlogoGenerator.ORDER_BITWISE_AND = 10;     // &
netlogoGenerator.ORDER_BITWISE_XOR = 11;     // ^
netlogoGenerator.ORDER_BITWISE_OR = 12;      // |
netlogoGenerator.ORDER_LOGICAL_AND = 13;     // &&
netlogoGenerator.ORDER_LOGICAL_OR = 14;      // ||
netlogoGenerator.ORDER_CONDITIONAL = 15;     // ?:
netlogoGenerator.ORDER_ASSIGNMENT = 16;      // = += -= **= *= /= %= <<= >>= ...
netlogoGenerator.ORDER_YIELD = 17;           // yield
netlogoGenerator.ORDER_COMMA = 18;           // ,
netlogoGenerator.ORDER_NONE = 99;            // (...)
netlogoGenerator.INDENT = "  ";

netlogoGenerator.SIZE = {
  "SMALL": 1,
  "MEDIUM": 3,
  "BIG": 5
};

netlogoGenerator.PRODUCE = {
  "O2": "produce-o2",
  "GLUCOSECOMPLEX": "produce-glucose-complex",
  "GLUCOSE": "produce-glucose"
};

netlogoGenerator.BREAK = {
  "CO2": "break-apart-co2",
  "H2O": "break-apart-h2o"
};

netlogoGenerator.CONSUME = {
  "CO2": '"co2"',
  "GLUCOSECOMPLEX": '"glucose-complex"',
  "H2O": '"h2o"',
  "LIGHTENERGY": '"energy"'
};

netlogoGenerator.LIGHT = {
  "LAMP": "temperature",
  "LOW": 15,
  "MEDIUM": 30,
  "HIGH": 45
};

netlogoGenerator.SIZE_VIRUS = {
  "SMALL": 5,
  "MEDIUM": 8,
  "BIG": 12
};

netlogoGenerator.SIZE_ANIMAL = {
  "SMALL": 1,
  "MEDIUM": 1.5,
  "BIG": 2
};

netlogoGenerator.SIZE_EUTROPHICATION = {
  "SMALL": 5,
  "MEDIUM": 10,
  "BIG": 15
};

netlogoGenerator.HEATSIZE = {
  "SMALL": 0.2,
  "MEDIUM": 0.7,
  "BIG": 1
};

netlogoGenerator.SPEED = {
  "ZERO": 0,
  "PHOTOLOW": 2,
  "PHOTOMEDIUM": 10,
  "PHOTOHIGH": 35,
  "VERY_LOW": "10 - random (random-wiggle)",
  "LOW": "30 - random (random-wiggle)",
  "MEDIUM": "50 - random (random-wiggle)",
  "HIGH": "80 - random (random-wiggle)",
  "TEMP": "initial-temperature - random (random-wiggle)",
  "WIND_SPEED": "wind-speed - random (random-wiggle)",
  "BAIXA": "30 - random (random-wiggle)",
  "MEDIA": "50 - random (random-wiggle)",
  "ALTA": "80 - random (random-wiggle)",
};

netlogoGenerator.SPEED_EUTROPHICATION = {
  "ZERO": 0,
  "SLOW": 0.5,
  "MEDIUM": 1,
  "FAST": 1.5
};

netlogoGenerator.MASS = {
  "LIGHT": 1,
  "MEDIUM": 2.5,
  "HEAVY": 10
};

netlogoGenerator.ARRANGEMENT = {
  "UNIFORM": 'setxy xcor ycor',
  "MESSY": 'ifelse (abs(xcor) > plate-size - 1) or (abs(ycor) > plate-size - 1) [\n' +
               'if xcor >= plate-size [setxy xcor - ((random 30) / 20 ) ycor] \n'+
               'if xcor <= ( - plate-size) [setxy xcor + ((random 30) / 20 ) ycor] \n'+
               'if ycor <= ( - plate-size) [setxy xcor ycor + ((random 30) / 20 )] \n'+
               'if ycor >= plate-size [setxy xcor ycor - ((random 30) / 20 )] \n'+
               'set color green \n' +
               '] \n'+
               '[set color cyan \n setxy xcor + ((random 10) / 20) - ((random 10) / 20 ) ycor + ((random 10) / 20) - ((random 10) / 20)]\n',
};

netlogoGenerator.POSITION = {
  "RANDOM": "(min-pxcor + 5 + random-float (world-width - 10)) min-pycor + 5 + random-float (world-height - 10)",
  "CENTER": "0 0",
  "VERTICAL": "0 (-85 + random-float (170))",
  "HORIZONTAL": "(-85 + random-float (170)) 0",
  "MOUSE": "drop-with-mouse 500",
  "FIRE_BOTTOM": "(-51 + random-float 2) 0.99 * min-pycor", 
  "RANDOM_HEAT": "(random-float (2 * plate-size) ) - (plate-size ) (random-float (2 * plate-size)) - plate-size",
  "CENTER_HEAT": "0 0",
  "VERTICAL_HEAT": "0 (-5 + random-float (10))",
  "HORIZONTAL_HEAT": "(-5 + random-float (10)) 0"
};

netlogoGenerator.POSITION_WILDFIRES = { ...netlogoGenerator.POSITION };
netlogoGenerator.POSITION_WILDFIRES.RANDOM = "random-xcor random-ycor";

netlogoGenerator.HEADING = {
  "RANDOM": "random-float 360",
  "UP": "0 - (random-wiggle / 2) + random (random-wiggle)",
  "RIGHT": "90 - (random-wiggle / 2) + random (random-wiggle)",
  "DOWN": "180 - (random-wiggle / 2) + random (random-wiggle)",
  "LEFT": "270 - (random-wiggle / 2) + random (random-wiggle)",
  "WIND_DIRECTION": "wind-direction"
};

netlogoGenerator.DIRECTION = {
  "FORWARD": "dx dy",
  "UPWARD": "0 1",
  "RIGHTWARD": "1 0",
  "DOWNWARD": "0 -1",
  "LEFTWARD": "-1 0",
  "WIND": "sin wind-direction cos wind-direction"
};

netlogoGenerator.MAGNITUDE = {
  "MUCH_MORE": "10 - random (random-wiggle)",
  "MORE": "5 - random (random-wiggle)",
  "LITTLE_MORE": "3 - random (random-wiggle)",
  "SAME": "0",
  "WIND": "wind-speed"
};

netlogoGenerator.EFFECT = {
  "DIRECT": 1,
  "INVERSE": -1,
  "NOEFFECT": 0
};

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
netlogoGenerator.addReservedWords(
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#Keywords
  'ask,set,go,turtle,patches,break,case,catch,class,const,continue,debugger,default,delete,do,else,export,extends,finally,for,function,if,import,in,instanceof,new,return,super,switch,this,throw,try,typeof,var,void,while,with,yield,' +
  'enum,' +
  'implements,interface,let,package,private,protected,public,static,' +
  'await,' +
  'null,true,false,' +
  // Magic variable.
  'arguments,' +
  // Everything in the current environment (835 items in Chrome, 104 in Node).
  Object.getOwnPropertyNames(globalThis).join(','));

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
netlogoGenerator.init = function (workspace: Blockly.Workspace) {
  // Create a dictionary of definitions to be printed before the code.
  const nl = netlogoGenerator as any;
  nl.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  nl.functionNames_ = Object.create(null);

  if (!nl.nameDB_) {
    nl.nameDB_ =
      new Blockly.Names((Blockly.Generator as any).prototype.RESERVED_WORDS_);
  } else {
    nl.nameDB_.reset();
  }

  nl.nameDB_.setVariableMap(workspace.getVariableMap());

  const defvars: string[] = [];
  // Add developer variables (not created or named by the user).
  const devVarList = Blockly.Variables.allDeveloperVariables(workspace);
  for (let i = 0; i < devVarList.length; i++) {
    defvars.push(nl.nameDB_.getName(devVarList[i],
      Blockly.Names.DEVELOPER_VARIABLE_TYPE));
  }

  // Add user variables, but only ones that are being used.
  const variables = Blockly.Variables.allUsedVarModels(workspace);
  for (let i = 0; i < variables.length; i++) {
    defvars.push(nl.nameDB_.getName(variables[i].getId(),
      Blockly.VARIABLE_CATEGORY_NAME));
  }

  // Declare all of the variables.
  if (defvars.length && nl.definitions_) {
    nl.definitions_['variables'] =
      'let ' + defvars.join(', ') + ';';
  }
  this.isInitialized = true;
};

// Gets all code not just one set
netlogoGenerator.scrub_ = function (block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = '';
  if (nextBlock) {
    const result = netlogoGenerator.blockToCode(nextBlock);
    const next = Array.isArray(result) ? result[0] : result;
    nextCode = opt_thisOnly ? '' : next;
  }
  return code + nextCode;
};

// Essential method for Blockly generators
netlogoGenerator.blockToCode = function (block: Blockly.Block): string {
  if (!block) return '';
  
  // Check if this block has a generator function
  if (netlogoGenerator.forBlock && netlogoGenerator.forBlock[block.type]) {
    return netlogoGenerator.forBlock[block.type](block);
  }
  
  // Fallback: return block's type or an empty string
  return block.type ? block.type : '';
};

// Initialize forBlock as empty object
netlogoGenerator.forBlock = {};
