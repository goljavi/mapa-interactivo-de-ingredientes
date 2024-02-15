import React from 'react';
import * as d3 from 'd3';
import { recommendIngredient } from './functions';
import ingredientPairs from './ingredient-pairs.json';

const width = 928; 
const height = 600;

function App() {
  const svgRef = React.useRef();

  function makeChart() {
    // Specify the dimensions of the chart.
    

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const nodes = [];
    const links = [];
    ingredientPairs.forEach(x => {
      if(x.count < 3) return;
      if(!nodes.find(y => y.id === x.ing1)) {
        nodes.push({id: x.ing1})
      }

      if(!nodes.find(y => y.id === x.ing2)) {
        nodes.push({id: x.ing2})
      }

      links.push({source: x.ing1, target: x.ing2, value: x.count ** 10})
      links.push({source: x.ing2, target: x.ing1, value: x.count ** 10})
    });

    // Create the SVG container.
    const svg = d3.select(svgRef.current);

    // Add a line for each link, and a circle for each node.
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
      .selectAll()
      .data(links)
      .join("line")
        .attr("stroke-width", d => 0.1);

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
      .selectAll()
      .data(nodes)
      .join("circle")
        .attr("r", 5)
        .attr("fill", d => color(d.group));

    node.append("title")
        .text(d => d.id);

    // Add a drag behavior.
    node.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

      node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
    }

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return svg.node();
  }

  React.useEffect(() => {
    if(!svgRef || !svgRef.current) return;
    makeChart()
  }, [svgRef]);

  React.useEffect(() => {    
    const recommendation = recommendIngredient(["carne", "ajo"]);
    console.log(recommendation);
  }, []);

  return (
    <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{maxWidth: '100%', height: 'auto'}} />
  );
}

export default App;
