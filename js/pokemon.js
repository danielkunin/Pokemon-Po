//Pokemon Visualization JS

//constants
var n = 10,
    dur = 100,
    speed  = 1,
    startX = 5,
    startY = 5
    global = 0;

//Compute link data for grid
var links = [];
for (var y = 0; y < n; ++y) {
  for (var x = 0; x < n; ++x) {
    if (y > 0) links.push({source: (y - 1) * n + x, target: y * n + x});
    if (x > 0) links.push({source: y * n + (x - 1), target: y * n + x});
  }
}

//svg
var svg = d3.select("svg"),
    width = 600,
    height = 600
    pad = 50;

//scales
var xScale = d3.scale.linear().domain([1, 10]).range([pad, width-pad]);
var yScale = d3.scale.linear().domain([1, 10]).range([pad, height-pad]);
var vScale = d3.scale.linear().domain([1, 20]).range([15, 50]);

// define the x axis
var xAxis = d3.svg.axis()
    .orient("top")
    .scale(xScale);

// define the y axis
var yAxis = d3.svg.axis()
    .orient("left")
    .scale(yScale);
  
//Draw heat map
side = (width - 2*pad)/9
heatmap = svg.append('image')
              .attr("xlink:href", "./img/heatmap.png")
              .attr('y', pad-side/2)
              .attr('x', pad-side/2)
              .attr('width', 10*side)
              .attr('height', 10*side)
              .attr('opacity', '0.8');


// draw y axis with labels 
svg.append("g")
  .attr("class", "axis")
    .attr("transform", "translate("+(pad-side/2)+",0)")
    .call(yAxis);

// draw x axis with labels
svg.append("g")
    .attr("class", "xaxis axis")
    .attr("transform", "translate(0,"+(pad-side/2)+")")
    .call(xAxis);

//Draw Grid
// svg.selectAll('line.grid')
//     .data(links)
//     .enter()
//     .append('line')
//     .attr('class', "grid")
//     .attr("y1", function(d){ return xScale(Math.floor(d.source/10) + 1) })
//     .attr("x1", function(d){ return yScale(d.source%10 + 1) })
//     .attr("y2", function(d){ return xScale(Math.floor(d.target/10) + 1) })
//     .attr("x2", function(d){ return yScale(d.target%10 + 1) })
//     .style("stroke", "black");

//Ash is naive algorithm, Misty is complicated algorithm
Ash = svg.append('circle').attr('r', 0).attr('fill', 'rgba(100,189,255,0.75)');
Misty = svg.append('circle').attr('r', 0).attr('fill', 'rgba(0,208,161,0.75)');


//Detrmines if a pokemon in range
function inRange(start, end, time, speed) {
  xDist = Math.abs(end[0] - start[0])
  yDist = Math.abs(end[1] - start[1])
  elapse = (xDist + yDist)/speed
  if (elapse <= time) {
    return [1, elapse]
  } else {
    return [0, 0]
  }
}

//Implements simple algorithm
function simpleAlgorithm(current, speed, global) {
  Ash.attr('cx', xScale(current[0])).attr('cy', yScale(current[1])).attr('r', vScale(3));
  Misty.attr('cx', xScale(current[0])).attr('cy', yScale(current[1])).attr('r', vScale(3));
  complicatedAlgorithm(current,speed, global);
  number = 0;
  value = 0;
  time = 0;
  for (var i = 0; i < pokemon.length; i++) {
    poke = [pokemon[i].x, pokemon[i].y]
    arrivalT = pokemon[i].t
    timeout = arrivalT * dur
    setTimeout(addPokemon.bind(null, poke, pokemon[i].v), timeout)
    possibleT = Math.min(arrivalT + 15 - time, 15)
    result = inRange(current, poke, possibleT, speed)
    if (result[0]) {
      number += 1
      value += pokemon[i].v
      dist = Math.abs(current[0] - poke[0]) + Math.abs(current[1] - poke[1])
      setTimeout(moveAsh.bind(null, current, poke, result[1]/dist, dist, number, value), timeout)
      time += result[1]
      current = poke
    } else {
      time = arrivalT
    }
  }
  return [number, value]
}


//Sophisticated Algorithm (Still under Construction)
function complicatedAlgorithm(current_location, speed, global) {
    pokemon_caught = 0;
    points = 0;
    time = 0;
    index = 0;
    n = pokemon.length;
    maxTime = pokemon[n-1].t
    while (time <= maxTime) {
        pokemon_on_board = []
        j = index;
        while((j < n) && (pokemon[j].t <= time)) {
          if (pokemon[j].t < time - 15) {
            index++;
            j++;
          } else {
            pokemon_on_board.push(pokemon[j])
            j++;
          }
        };
        bestPoints = 0;
        if (global) {
          bestLocation = [3,8];
        } else {
          bestLocation = best_node(current_location[0], current_location[1]);
        };
        for (var k = 0; k < pokemon_on_board.length; k++) {
            pokemon_location = [pokemon_on_board[k].x, pokemon_on_board[k].y]
            if ((pokemon_location[0] == current_location[0]) && (pokemon_location[1] == current_location[1])) {
                pokemon_caught += 1;
                points += pokemon_on_board[k].v;
                index++;
            } else {
              arrival_time = pokemon_on_board[k].t;
              possible_time = Math.min(arrival_time + 15 - time, 15);
              result = inRange(current_location, pokemon_location, possible_time, speed);
              if (result[0] & (pokemon_on_board[k].v > bestPoints)) {
                  bestPoints = pokemon_on_board[k].v
                  bestLocation = pokemon_location
              }
            }
        }
        var ind;
        if (current_location[0] != bestLocation[0]){
          current_location[0] += Math.sign(bestLocation[0] - current_location[0])
          ind = (current_location[0]-1)*10 + current_location[1]-1;
        } else {
          current_location[1] += Math.sign(bestLocation[1] - current_location[1])
          ind = (current_location[0]-1)*10 + current_location[1]-1;
        }
        timeout = time*dur;
        setTimeout(moveMisty.bind(null, ind, 1/speed, pokemon_caught, points), timeout)
        time += 1/speed
  }
  return [pokemon_caught, points]
}

//Determines best neighbor
function best_node(x, y) {
    left = score(x - 1, y);
    right = score(x + 1, y);
    down = score(x, y - 1);
    up = score(x, y + 1);
    best = Math.max(left, right, down, up);
    if (best == left) {
        return [x-1, y];
    } else if (best == right) {
        return [x+1, y];
    } else if (best == down) {
        return [x, y-1];
    } else if (best == up) {
        return [x, y+1];
    }
}

//Computes probability matrix
var node_score = new Array(12);
for (var i = 0; i < 12; i++) {
  node_score[i] = new Array(12).fill(0);
}
for (var i = 0; i < pokemon.length; i++) {
  node_score[pokemon[i].x][pokemon[i].y] += pokemon[i].v;
}
function score(x, y){
    return node_score[x][y]
}


//Adds pokemon to map
function addPokemon(pos, value) {
  index = (pos[0]-1)*10 + pos[1]-1;
  side = vScale(value);
  svg.append('image')
      .attr("xlink:href", "./img/pokemon.png")
      .attr('y', function(d){ return xScale(Math.floor(index/10) + 1)-side/2 })
      .attr('x', function(d){ return yScale(index%10 + 1) - side/2 })
      .attr('width', side)
      .attr('height', side)
      .attr('opacity', '1')
      .transition()
      .attr('opacity', '0.2')
      .duration(15*dur)
      .each('end', function(d){ d3.select(this).remove(); });
}

//This function moves ash from current position to end in the 
//input time and steps.  Randomly chooses path on coordinate grid.
function moveAsh(curr, pos, time, steps, num, val) {
  if (curr[0] != pos[0] & curr[1] != pos[1]){
    p = Math.random()
    if (p>0.5) {
      curr[0] += Math.sign(pos[0]-curr[0])
    } else {
      curr[1] += Math.sign(pos[1]-curr[1])
    }
  } else if (curr[0] != pos[0]) {
    curr[0] += Math.sign(pos[0]-curr[0])
  } else if (curr[1] != pos[1]) {
    curr[1] += Math.sign(pos[1]-curr[1])
  }
  index = (curr[0]-1)*10 + curr[1]-1;
  Ash.transition()
      .attr('cy', function(d){ return xScale(Math.floor(index/10) + 1) })
      .attr('cx', function(d){ return yScale(index%10 + 1) })
      .ease('linear')
      .duration(time*dur)
      .each('end', function(d){
        if (steps-- != 0) {
          moveAsh(curr, pos, time, steps, num, val)
        } else {
          d3.select("#totalCaught").text(num)
          d3.select("#totalPoints").text(val)
        }; 
      });
}

//This function moves Misty from current position to end in the 
//input time and steps.  Randomly chooses path on coordinate grid.
function moveMisty(index, time, num, val) {
  Misty.transition()
      .attr('cy', function(d){ return xScale(Math.floor(index/10) + 1) })
      .attr('cx', function(d){ return yScale(index%10+ 1) })
      .ease('linear')
      .duration(time*dur)
      .each('end', function(d){
          d3.select("#totalCaughtMisty").text(num)
          d3.select("#totalPointsMisty").text(val)
      });
}

//Update Speed
d3.select("#speed").on("change", function() {
  speed = +document.querySelector('input[name="optradio"]:checked').value;
});
//Update Starting Conditions
d3.select("#xStart").on("change", function() {
  startX = +this.value;
});
d3.select("#yStart").on("change", function() {
  startY = +this.value;
});
//Update Strategy
d3.select("#strategy").on("change", function() {
  global = +document.querySelector('input[name="optradios"]:checked').value;
});
//Handle Click
d3.select("#start").on("click", function() {
  curr = [startX, startY]
  simpleAlgorithm(curr, speed, global);
  document.getElementById("start").disabled = true;
});
