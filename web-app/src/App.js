// Import necessary modules from React, d3, Material-UI, and custom functions
import React from 'react';
import * as d3 from 'd3';
import { recommendIngredient, findRecipesWithIngredients, ingredientToUSDAInfo, getClasif } from './functions';
import ingredientPairs from './ingredient-pairs-tfidf.json';
import recipes from './formatted-recipes.json';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

// Define width and height for SVG
const width = 928; 
const height = 600;

// Flag to track if the chart has been created already
let chartAlreadyMade = false;

// Initialize an empty map to store ingredient counts
const ingredientCounts = new Map();

// Iterate over ingredientPairs array
ingredientPairs.forEach(pair => {
    // Update count for ing1
    ingredientCounts.set(pair.ing1, (ingredientCounts.get(pair.ing1) || 0) + 1);
    
    // Update count for ing2
    ingredientCounts.set(pair.ing2, (ingredientCounts.get(pair.ing2) || 0) + 1);
});

function transformNumber(x) {
  const x_min = 14;
  const x_max = 115;
  const y_min = 15;
  const y_max = 70;

  // Map x to the desired range
  return ((x - x_min) / (x_max - x_min)) * (y_max - y_min) + y_min;
}


// Main functional component - App
function App() {
  // Define React refs and state variables using hooks
  const svgRef = React.useRef();
  const [graphNodes, setGraphNodes] = React.useState([]);
  const [graphLinks, setGraphLinks] = React.useState([]);
  const [clickedNodes, setClickedNodes] = React.useState([]);
  const [recommendedIngredients, setRecommendedIngredients] = React.useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = React.useState([]);
  const [usdaInfo, setUsdaInfo] = React.useState();
  const [search, setSearch] = React.useState('');

  // Function to create the d3 chart
  function makeChart() {
    // Mark that chart has been created
    chartAlreadyMade = true;

    // Initialize arrays to store nodes and links
    const nodes = [];
    const links = [];

    // Iterate through ingredient pairs data
    ingredientPairs.forEach(x => {
      // Create slugs for ingredients
      const ing1slug = x.ing1.replaceAll(' ', '-');
      const ing2slug = x.ing2.replaceAll(' ', '-');

      // Check if nodes exist, if not add them
      if (!nodes.find(y => y.name === x.ing1)) {
        nodes.push({ id: ing1slug, name: x.ing1 });
      }
      if (!nodes.find(y => y.name === x.ing2)) {
        nodes.push({ id: ing2slug, name: x.ing2 });
      }

      // Create links between ingredients
      links.push({ source: ing1slug, target: ing2slug, value: x.count });
      links.push({ source: ing2slug, target: ing1slug, value: x.count });
    });

    // Update state with nodes and links
    setGraphNodes(nodes);
    setGraphLinks(links);

    // Create the SVG container
    const svg = d3.select(svgRef.current);

    // This group contains all graph elements
    const contentGroup = svg.append("g").attr("class", "content-group");

    // Add lines for links and circles for nodes
    const link = contentGroup.append("g")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.3)
      .selectAll()
      .data(links)
      .join("line")
      .attr("stroke-width", d => 0.1)
      .attr("source", d => d.source)
      .attr("target", d => d.target);

    // Append a group for each node and add circles and text
    const node = contentGroup.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g").attr("id", d => d.id);

    // Add circles to represent nodes
    node.append("circle")
      .attr("r", d => transformNumber(ingredientCounts.get(d.name)))
      .style('opacity', 0.5)
      .attr("fill", d => getClasif(d.name))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("click", (event, d) => handleNodeClick(d));

    // Add text labels to nodes
    node.append("text")
      .text(d => d.name)
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("font-size", "10px")
      .style("fill", "#333")
      .on("click", (event, d) => handleNodeClick(d));

    // Create a simulation to apply forces to the nodes
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(d => 20 - d.value * 0.5))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    // Function to update positions of nodes and links
    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);

      if (simulation.alpha() < 0.1) {
        simulation.stop();
      }
    }

    // Add zoom behavior to the SVG
    const zoom = d3.zoom()
      .scaleExtent([0, 10])
      .on("zoom", zoomed);

    function zoomed(event) {
      contentGroup.attr("transform", event.transform);
    }

    svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(400, 250).scale(0.3));

    return svg.node();
  }

  // Effect hook to create the chart
  React.useEffect(() => {
    if (!svgRef || !svgRef.current || chartAlreadyMade) return;
    makeChart();
  }, [svgRef]);

  // Effect hook to update recommended ingredients and recipes when nodes are clicked
  React.useEffect(() => {
    if (!clickedNodes.length) {
      setRecommendedIngredients([]);
      setRecommendedRecipes([]);
      return;
    }
    const clickedNodeNames = clickedNodes.map(x => x.name);
    setRecommendedIngredients(recommendIngredient(clickedNodeNames));
    setRecommendedRecipes(findRecipesWithIngredients(clickedNodeNames));
  }, [clickedNodes]);

  // Function to handle click on a node
  function handleNodeClick(nodeData) {
    const usdaInfo = ingredientToUSDAInfo(nodeData.name);
    setUsdaInfo(usdaInfo);
    setClickedNodes(prevNodes => {
      const nodeIndex = prevNodes.findIndex(n => n.id === nodeData.id);
      let newClickedNodes;
      if (nodeIndex > -1) {
        newClickedNodes = prevNodes.filter((_, index) => index !== nodeIndex);
      } else {
        newClickedNodes = [...prevNodes, nodeData];
      }
      return newClickedNodes;
    });
  }

  // Effect hook to update visual state based on clicked nodes
  React.useEffect(() => {
    function updateVisualState(selectedNodes) {
      d3.selectAll('.nodes g circle')
        .style('opacity', 0.5)
        .style('fill', d => getClasif(d.name));

      d3.selectAll('.content-group line')
        .style('stroke-opacity', 0.3);

      if (selectedNodes.length === 0) return;

      const linksForEachSelectedNode = selectedNodes.map(selectedNode =>
        graphLinks.filter(link =>
          link.source.id === selectedNode.id
        )
      ).flat();

      const commonLinks = []
      linksForEachSelectedNode.forEach(x => {
        let repeated = 1;
        linksForEachSelectedNode.forEach(y => {
          if (x.source.id === y.source.id) return;
          if (x.target.id === y.target.id) repeated = repeated + 1;
        });
        if (repeated >= selectedNodes.length) {
          commonLinks.push(x);
        }
      });

      commonLinks.forEach(link => {
        d3.selectAll(`line[source="${link.source.id}"], line[target="${link.source.id}"]`)
          .style('stroke-opacity', 1);
        d3.selectAll(`line[source="${link.target.id}"], line[target="${link.target.id}"]`)
          .style('stroke-opacity', 1);
      });

      const connectedNodeIds = new Set(commonLinks.flatMap(link => [link.source.id, link.target.id]));
      connectedNodeIds.forEach(nodeId => {
        d3.select(`.nodes g[id="${nodeId}"] circle`)
          .style('opacity', 1);
      });

      selectedNodes.forEach(node => {
        d3.select(`.nodes g[id="${node.id}"] circle`)
          .style('opacity', 1)
          .style('fill', 'orange');
      });
    }

    if (graphLinks.length) updateVisualState(clickedNodes);
  }, [clickedNodes, graphLinks]);

  // Effect hook to search for recipes
  React.useEffect(() => {
    const recipeSearch = recipes.find(x => x.title === search);
    if (!recipeSearch) return;

    const newSelectedNodes = graphNodes.filter(x => !!recipeSearch.ingredients.find(y => y === x.name));
    setClickedNodes(newSelectedNodes);
  }, [search])

  // Function to handle click on recommended ingredient button
  function handleRecommendedIngredientButton(ingredient) {
    const nodeInfo = graphNodes.find(x => x.name === ingredient);
    if (nodeInfo) handleNodeClick(nodeInfo);
  }

  // Render UI components
  return (
    <div>
      <Drawer
        sx={{
          width: 350,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 350,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <div style={{ padding: 15 }}>
          <div>
            <Typography variant="h6">Seleccionaste:</Typography>
            <TableContainer component={Paper}>
              <Table size="small" aria-label="a dense table">
                <TableBody>
                  {clickedNodes.map((node, i) => (
                    <TableRow key={i}>
                      <TableCell component="th" scope="row">
                        {node.name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          <Divider style={{ marginBottom: 15 }} />
          <div>
            <Typography variant="h6">Podés agregar:</Typography>
            <div>
              {recommendedIngredients.map((ingredient, i) => (
                <Button style={{ margin: '10px 0', display: 'block' }} variant="contained" onClick={() => handleRecommendedIngredientButton(ingredient)}>
                  {ingredient}
                </Button>
              ))}
            </div>
          </div>
          <Divider style={{ marginBottom: 15 }} />
          <div>
            <Typography variant="h6">Recetas:</Typography>
            {recommendedRecipes.map((recipe, i) => (
              <Card style={{ margin: '15px 0' }} key={i}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {recipe.title}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" href={recipe.url} target="_blank" rel="noreferrer">{new URL(recipe.url).hostname}</Button>
                </CardActions>
              </Card>
            ))}
          </div>
          <Divider style={{ marginBottom: 15 }} />
          {usdaInfo && <div>
            <Typography variant="h6">Info Nutricional: </Typography>
            <Typography variant="body1">{usdaInfo?.description} x 100g</Typography>
            <TableContainer component={Paper}>
              <Table size="small" aria-label="a dense table">
                <TableHead>
                  <TableRow>
                    <TableCell>Nutriente</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usdaInfo.foodNutrients.map((row, i) => (
                    <TableRow
                      key={i}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.nutrient.name}
                      </TableCell>
                      <TableCell align="right">{row.amount}{row.nutrient.unitName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>}
        </div>
      </Drawer>
      <div style={{ padding: 7, background: '#fff', borderRadius: 8, position: 'fixed', top: 15, right: 15 }}>
        <Autocomplete
          disablePortal
          id="combo-box-demo"
          options={recipes.map(x => ({ label: x.title }))}
          sx={{ width: 300 }}
          onInputChange={(event, newInputValue) => {
            setSearch(newInputValue);
          }}
          renderInput={(params) => <TextField {...params} label="Receta" />}
        />
      </div>
      <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%', height: 'auto' }} />
      <style>{`
        svg text {
          font-family: "Roboto", sans-serif;
          text-transform: capitalize;
          text-shadow: 0 0 7px white;
        }
      `}</style>
    </div>
  );
}

// Export the component
export default App;

