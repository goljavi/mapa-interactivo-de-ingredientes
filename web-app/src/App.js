import React from 'react';
import * as d3 from 'd3';
import { recommendIngredient, findRecipesWithIngredients } from './functions';
import ingredientPairs from './ingredient-pairs.json';

const width = 928; 
const height = 600;

const color = d3.scaleOrdinal(d3.schemeCategory10);

let chartAlreadyMade = false;

function App() {
  const svgRef = React.useRef();
  const [graphNodes, setGraphNodes] = React.useState([]);
  const [graphLinks, setGraphLinks] = React.useState([]);
  const [clickedNodes, setClickedNodes] = React.useState([]);
  const [recommendedIngredients, setRecommendedIngredients] = React.useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = React.useState([]);

  function makeChart() {
    chartAlreadyMade = true;
    
    const nodes = [];
    const links = [];
    ingredientPairs.forEach(x => {
      if(x.count < 15) return;

      const ing1slug = x.ing1.replaceAll(' ', '-');
      const ing2slug = x.ing2.replaceAll(' ', '-');

      if(!nodes.find(y => y.name === x.ing1)) {
        nodes.push({id: ing1slug, name: x.ing1})
      }

      if(!nodes.find(y => y.name === x.ing2)) {
        nodes.push({id: ing2slug, name: x.ing2})
      }

      links.push({source: ing1slug, target: ing2slug, value: x.count})
      links.push({source: ing2slug, target: ing1slug, value: x.count})
    });
    setGraphNodes(nodes);
    setGraphLinks(links);

    // Create the SVG container.
    const svg = d3.select(svgRef.current);

    // This group contains all graph elements
    const contentGroup = svg.append("g").attr("class", "content-group"); 

    // Add a line for each link, and a circle for each node.
    const link = contentGroup.append("g")
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.3)
      .selectAll()
      .data(links)
      .join("line")
        .attr("stroke-width", d => 0.1)
        .attr("source", d => d.source)
        .attr("target", d => d.target);

    const node = contentGroup.append("g")
        .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g").attr("id", d => d.id); // Append a group for each node

    node.append("circle")
      .attr("r", 30) // Radius of the circle
      .style('opacity', 0.5)
      .attr("fill", d => color(d.group))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("click", (event, d) => handleNodeClick(d));
    
    node.append("text")
      .text(d => d.name)
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle") // Center the text
      .attr("alignment-baseline", "middle") // Center vertically
      .style("font-size", "10px")
      .style("fill", "#333") // Text color
      .on("click", (event, d) => handleNodeClick(d)); 

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100)) // Adjust link distance
      .force("charge", d3.forceManyBody().strength(-500)) // Increase repulsion
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

      node
          .attr("transform", d => `translate(${d.x},${d.y})`);

      if (simulation.alpha() < 0.1) { // Check if the simulation has cooled down
        simulation.stop(); // Stops the simulation
      }
    }

    const zoom = d3.zoom()
      .scaleExtent([0, 10]) // This defines the range of zoom. Feel free to adjust.
      .on("zoom", zoomed);
  
    function zoomed(event) {
      contentGroup.attr("transform", event.transform);
    }

    svg.call(zoom);

    return svg.node();
  }

  React.useEffect(() => {
    if(!svgRef || !svgRef.current || chartAlreadyMade) return;
    makeChart()
  }, [svgRef]);

  React.useEffect(() => {
    if(!clickedNodes.length){ 
      setRecommendedIngredients([]);
      setRecommendedRecipes([]);
      return;
    }

    const clickedNodeNames = clickedNodes.map(x => x.name);
    setRecommendedIngredients(recommendIngredient(clickedNodeNames));
    setRecommendedRecipes(findRecipesWithIngredients(clickedNodeNames));
  }, [clickedNodes]);

  function handleNodeClick(nodeData) {
    setClickedNodes(prevNodes => {
      const nodeIndex = prevNodes.findIndex(n => n.id === nodeData.id);
      let newClickedNodes;
      if (nodeIndex > -1) {
        // Node is already in the list, so remove it
        newClickedNodes = prevNodes.filter((_, index) => index !== nodeIndex);
      } else {
        // Node is not in the list, so add it
        newClickedNodes = [...prevNodes, nodeData];
      }
  
      return newClickedNodes;
    });
  }

  React.useEffect(() => {
    function updateVisualState(selectedNodes) {
      // Set all nodes to reduced opacity
      d3.selectAll('.nodes g circle')
        .style('opacity', 0.5)
        .style('fill', d => color(d.group)); // Reset color to original
    
      // Highlight selected nodes
      selectedNodes.forEach(node => {
        d3.select(`.nodes g[id="${node.id}"] circle`)
          .style('opacity', 1)
          .style('fill', 'orange');
      });
    
      // Reset all link opacities
      d3.selectAll('.content-group line')
        .style('stroke-opacity', 0.3);
  
        console.log('updateVisualState', graphLinks.length);
    
      // Highlight links for selected nodes
      selectedNodes.forEach(node => {
        graphLinks.forEach(link => {
          if (link.source.id === node.id || link.target.id === node.id) {
            console.log('yes')
            d3.selectAll(`line[source="${node.id}"]`)
              .style('stroke-opacity', 1);
            d3.selectAll(`line[target="${node.id}"]`)
              .style('stroke-opacity', 1);
  
            d3.select(`.nodes g[id="${link.source.id}"] circle`)
              .style('opacity', 1);
            d3.select(`.nodes g[id="${link.target.id}"] circle`)
              .style('opacity', 1);
          }
        });
      });
    }   

    if(graphLinks.length) updateVisualState(clickedNodes, graphLinks);
  }, [clickedNodes, graphLinks]); // Depend on clickedNodes and graphLinks

  
  function handleRecommendedIngredientButton(ingredient) {
    const nodeInfo = graphNodes.find(x => x.name === ingredient);
    if(nodeInfo) handleNodeClick(nodeInfo);
  }

  console.log('root', graphLinks.length);

  return (
    <div>
      <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{maxWidth: '100%', height: 'auto'}} />
      <div style={{position:'fixed',left:0,top:0,height:'100vh',width:300,padding:15}}>
        <div style={{width:'100%',height:'90vh',padding:15,background:'#fff', borderRadius: 15}}>
          <div>
            <h3>Seleccionaste:</h3>
            <ul>
              {clickedNodes.map(node => (
                <li key={node.id}>{node.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Podés agregar:</h3>
            <ul>
              {recommendedIngredients.map((ingredient, i) => (
                <li key={i}><button onClick={() => handleRecommendedIngredientButton(ingredient)}>{ingredient}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Recetas:</h3>
            <ul>
              {recommendedRecipes.map((recipe, i) => (
                <li key={i}><a href={recipe.url} target="_blank" rel="noreferrer">{recipe.title}</a></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
