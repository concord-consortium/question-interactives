# Authoring Simulations Controlled by Blockly

The blockly and agent simulation interactives can be used together to create simulations that students can control using blockly programs.

# Connecting the Interactives

1. Add a blockly and an agent simulation interactive to a page in the Activity Player.
2. Make sure to give your blockly interactive a name (edit it, enter a name, then save your change).
3. Edit the agent simulation interactive.
4. Scroll down to Data Source Interactive and select your blockly interactive.
5. Save your change to the agent simulation interactive.

The agent simulation interactive is now connected to the blockly interactive, and will accept code from it to control its simulation. You must view the page in student view for the connection to work (Preview in: Activity Player at the top right of the Edit Page page).

# Atomic Agents

Agent simulation interactives use the Atomic Agents simulation engine. It has [extensive documentation and examples](https://gjmcn.github.io/atomic-agents/). It uses [Atomic Agents Vis](https://gjmcn.github.io/atomic-agents-vis/) to render the simulation.

This documentation will reference concepts from Atomic Agents and Atomic Agents Vis.

# Setting Up the Simulation

When an agent simulation interactive accepts code from a blockly interactive, it will ignore any of its own code and will only use code provided by the blockly interactive.

After an agent simulation interactive has accepted code from a blockly interactive, a "Show Blockly Code" button will appear under the simulation. Pressing this button will display the code that was transfered between the interactives. This can be very helpful when debugging while authoring a simulation.

## Examples

Files in the `src/sims` directory include examples of simulations that can be helpful when writing simulations.

## Coding the Simulation

Simulation code must be vanilla javascript. All simulation code has access to the following variables:
- `sim` - The Atomic Agents simulation
- `AA` - Everything you'd get from `import * as AA from "atomic-agents"`
- `AV` - Everything you'd get from `import * as AV from "atomic-agents-vis"`
- `globals` - An object that allows you to directly access and modify globals. Globals are variables that can be changed and accessed during a simulation. They are often used by widgets, but they can also be used without them.
  - `globals.set(globalKey: string, value: any)`
    Updates the value of the given global. If the global doesn't already exist, this creates it.
  - `globals.get(globalKey)`
    Returns the current value of the given global.
- `addWidget` - A function that allows you to add widgets to the simulation.
  - `addWidget` takes a single parameter, an object containing the following:
    - `type` - The type of the widget (see below).
    - `globalKey` - The global this widget is tied to.
    - `defaultValue` - The value to use to intialize the global if it is not already initialized.
    - `data` - An object containing additional information, which is different for different widgets.

### Widgets

#### `readout`

This widget displays the value of the given global.

`data`:
- `backgroundColor: string` - Optional. The color for the widget background.
- `color: string` - Optional. The color for the widget text.
- `formatType: "decimal" | "integer" | "percent"` - Optional. How to format the numeric value.
  - `"integer"` (default): Display as rounded integer (no decimals)
  - `"decimal"`: Display as decimal number with specified precision
  - `"percent"`: Multiply value by 100 and display with % symbol
- `label: string` - Optional. Displayed before the value if included.
- `precision: number` - Optional. Number of decimal places to show.
  - Default: `2` for decimal format, `0` for percent format
  - Ignored for integer format (always rounds to whole number)
- `unit: string` - Optional. Unit text to display after the value (e.g., "°C", "m/s").


#### `slider` and `circular-slider`

These widgets allow the user to change the value of a global using either a horizontal slider (`slider`) or a circular slider (`circular-slider`).

The global value must be a number.

`data`:
- `formatType: "decimal" | "integer" | "percent"` - Optional. How to format the numeric value displayed in the optional readout.
- `min: number` - The minimum value for the slider.
- `max: number` - The maximum value for the slider.
- `label: string` - Text displayed above the slider.
- `precision: number` - Optional. Number of decimal places to show in the optional readout.
  - Default: `2` for decimal format, `0` for percent format
  - Ignored for integer format (always rounds to whole number)
- `secondaryLabel: string` - Optional. Appears after the primary label and after the optional readout (when present).
- `showReadout: boolean` - Optional. Show a readout that displays the value and which can be manually edited by the user.
- `step: number` - Optional. Set a defined increment size for the slider.
- `unit: string` - Optional. Unit text to display after the value in the optional readout (e.g., "°C", "m/s").

**Numeric Value Format and Precision Notes:**
- Values are automatically formatted based on `formatType` and `precision`
- Non-numeric values are displayed as-is (converted to string)
- For percentage format, the value is multiplied by 100 and "%" is displayed as the unit (e.g., 0.5 → "50 %"). Any `unit` value specified for a percent value will be ignored.
- If `precision` is not specified:
  - Decimal format defaults to 2 decimal places
  - Percent format defaults to 0 decimal places (whole percentage)
  - Integer format always rounds to whole numbers (precision parameter is ignored)

Blockly code is added in two places: the simulation code, and then within individual block definitions.

## Simulation Code

The simulation code has its own text area when editing a blockly interactive. All of the code included here will be sent as-is to the agent simulation interactive.

## Blockly Code

The blockly program created by a student will generate code. This code will be included alongside the simulation code and passed together to the agent simulation interactive.

Different blocks generate code in different ways. Some automatically produce code, and using these blocks will require you to set up your simulation code in specific ways. Other blocks require authors to provide their own code.

### Starter Blocks

#### Setup

This block defines the `setup` function, which will include the code generated by all blocks contained in the setup block. In order for this block to do anything, include `setup();` at the bottom of the simulation code.

#### Go

This block defines the `sim.afterTick` method. If you define your own `sim.afterTick` method in the simulation code, the method defined by this block will override it.

#### On Mouse Click

This block currently defines a function called `onClick`, which can be used as an event listener (see [Atomic Agents Vis Interaction](https://gjmcn.github.io/atomic-agents-vis/#/?id=interaction)). When assigning `onClick` to the `sim`, make sure you include `background: true` in the object you pass to `.vis()`.

##### Creating Actors On Mouse Click

Unfortunately, a bug in Atomic Agents Vis makes it non-trivial to add new actors by clicking. The specific bug is that actors added to the simulation outside of one of the simulation's tick functions does not get rendered by vis.

The `predator-prey` example simulation shows one work around for this problem. The basic idea is to queue click events to be handled within the `sim.beforeTick` function. To implement this pattern:
- Store pending click events in a variable: `let onClickPendingEvent = undefined;`
- Create an `_onClick` handler that stores the event, and directly pass that function to `sim.vis()`:
  ```
  function _onClick(event) {
    onClickPendingEvent = event;
  }

  sim.vis({
    background: true,
    click: _onClick
  });
  ```
- In `sim.beforeTick`, process any pending click events:
  ```
  if (onClickPendingEvent) {
    onClick(onClickPendingEvent);
    onClickPendingEvent = undefined;
  }
  ```

##### Positioning Using Mouse Click Coordinates

It's also tricky to use the coordinates of a mouse click to position an actor. Again, the `predator-prey` example shows one solution to this problem.
- Create an `_onClick` handler, which you should directly pass to `sim.vis()`.
- In `_onClick()`, save the coordinates of the mouse event as globals.
- When positioning an actor to the mouse's location, use the globals you saved.
  - Note that the `predator-prey` example uses the mouse coordinates when creating the actor, but it's more common to set the position in a setter with a `mouse position` option.

### Creator Blocks

These custom blocks are used to create actors of different types in the simulation. They generate code like:

`create_[type]([count], [callback]);`

- `type` is the Object Name specified in the edit block UI
- `count` is a value specified by a user
- `callback` is a function like `(agent) => { [statements] }`
  - `agent` is the newly created agent (the callback should be called with every agent created)
  - `statements` is the code generated by blocks contained within the creator block (usually setters)
  - If the creator block contains no blocks, the callback will NOT be included

To use a creator block, the author needs to define a function called `create_[type]` for each type the creator block allows.
- The function should take a `count` and a `callback` (which might be `undefined`).
- It should create `count` actors.
- Each actor should have a label `type` applied to it.
  - Note that the label should be exactly the same as the `type`--be mindful of singular vs plural here.
- If provided, `callback` should be called on each new actor.

#### Example

This example is from `predator-prey`. The first function, `create_a_wolf`, creates a single new actor. Note that "wolves" is applied as a label. This function is called by `create_wolves`, which is what is directly called by the code generated by the creator block. This function calls `ceate_a_wolf` `count` times, calling `callback` on each newly created agent (assuming `callback` is actually defined).

```
function create_a_wolf(props) {
  const { color, energy, x, y } = props ?? {};
  const agent = new AA.Actor();
  agent.radius = 10;
  agent.vel = AA.Vector.randomAngle(1.5);
  agent.vis({ image: wolfImage, tint: color ?? "0x333333" });
  agent.label("wolves", true);
  agent.state = { energy: energy ?? wolfEnergy };
  agent.x = x ?? Math.random() * sim.width;
  agent.y = y ?? Math.random() * sim.height;

  agent.addTo(sim);
  return agent;
};

function create_wolves(num, callback) {
  for (let i = 0; i < num; i++) {
    const agent = create_a_wolf();
    if (callback) callback(agent);
  }
}
```

### Set Properties Blocks

These custom blocks are used to generate setters. These blocks generate code like:

`set_[property](agent, "[value]");`

- `property` is the Property Name specified in the edit block UI
- `value` is the value specified in the block (either a string from a dropdown menu or a number)
  - Note that `value` is always wrapped in quotes, even if it is a number.

To use a setter block, the author needs to define a function called `set_[property]`.
- It should take an agent as the first argument.
  - The agent will be provided if the block is used within a creator or ask block. In other contexts, the author will have to ensure an agent is defined, or the student will see an error.
- It should take a value as the second argument.

What the function does is up to the author, but a common pattern is:

```
function set_size(agent, value) {
  agent.state.size = value;
}
```

### Ask Blocks

These custom blocks are used to loop through all agents of a particular type and execute code for each one.
- When creating an ask block, the author will have to specify a Target Entity. These are based on creator blocks that have been previously defined.
- The creator block will contain a dropdown with each `type` specified for the chosen Target Entity, as well as "all".

The block will generate different code depending on whether a `type` or "all" is specified. For "all":

`sim.actors.forEach(actor => { [statements] });`

For a `type`:

`sim.withLabel("[type]").forEach(actor => { [statements] });`

- `statements` is the code generated by blocks contained within the ask block.

An author doesn't have to do anything special for an ask block to work.

### Action Blocks

Custom action blocks give authors a lot of flexibility to create blocks that can do a wide range of things that a simulation might need. Many different types of fields can be added to action blocks. And action blocks require custom code to be specified by an author.

When an action block contains child blocks, the code from these child blocks can be plugged into the action's code by using `${CHILDBLOCKS}`.

Check example simulations for ideas on how to use action blocks.

### Condition Blocks

Custom condition blocks allow authors to create conditions that can be used within if, when, or many other types of blocks. Like action blocks, they require authors to write their own custom code to generate.
