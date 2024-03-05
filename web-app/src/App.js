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
  const [usdaInfo, setUsdaInfo] = React.useState();
  const [search, setSearch] = React.useState('');


  function makeChart() {
    chartAlreadyMade = true;
    
    const nodes = [];
    const links = [];
    ingredientPairs.forEach(x => {
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
      .attr("fill", d => getClasif(d.name))
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
    .force("link", d3.forceLink(links)
    .id(d => d.id)
    .distance(d => 20 - d.value * 0.5) // Example calculation, adjust as needed
    // The base distance is 100, and we subtract a value based on count.
    // Ensure the result is positive and makes sense for your dataset.
)
      .force("charge", d3.forceManyBody().strength(-600)) // Increase repulsion
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
    const usdaInfo = ingredientToUSDAInfo(nodeData.name);
    setUsdaInfo(usdaInfo);
    console.log(usdaInfo);

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
      // Reset styles for all nodes and links to default
      d3.selectAll('.nodes g circle')
        .style('opacity', 0.5)
        .style('fill', d => getClasif(d.name)); // Reset to the original color
  
      d3.selectAll('.content-group line')
        .style('stroke-opacity', 0.3);
  
      if (selectedNodes.length === 0) return; // Exit if no nodes are selected
  
      // Identify links that connect to each selected node
      const linksForEachSelectedNode = selectedNodes.map(selectedNode =>
        graphLinks.filter(link =>
          link.source.id === selectedNode.id
        )
      ).flat();


      const commonLinks = []
      linksForEachSelectedNode.forEach(x => {

        let repeated = 1;
        linksForEachSelectedNode.forEach(y => {
          if(x.source.id === y.source.id) return;
          if(x.target.id === y.target.id) repeated = repeated + 1;
        });

        if(repeated >= selectedNodes.length) {
          commonLinks.push(x);
        }
      })
  
      // Highlight common links
      commonLinks.forEach(link => {
        d3.selectAll(`line[source="${link.source.id}"], line[target="${link.source.id}"]`)
          .style('stroke-opacity', 1);
        d3.selectAll(`line[source="${link.target.id}"], line[target="${link.target.id}"]`)
          .style('stroke-opacity', 1);
      });
  
      // Identify and highlight nodes at the ends of these common links in blue
      const connectedNodeIds = new Set(commonLinks.flatMap(link => [link.source.id, link.target.id]));
      connectedNodeIds.forEach(nodeId => {
        d3.select(`.nodes g[id="${nodeId}"] circle`)
          .style('opacity', 1); // Connected nodes in blue
      });
  
      // Overlay the clicked (selected) nodes in orange
      selectedNodes.forEach(node => {
        d3.select(`.nodes g[id="${node.id}"] circle`)
          .style('opacity', 1)
          .style('fill', 'orange'); // Clicked nodes in orange
      });
    }   
  
    if(graphLinks.length) updateVisualState(clickedNodes);
  }, [clickedNodes, graphLinks]); // Depend on clickedNodes and graphLinks

  React.useEffect(() => {
    console.log(search);
    const recipeSearch = recipes.find(x => x.title === search);
    if(!recipeSearch) return;

    const newSelectedNodes = graphNodes.filter(x => !!recipeSearch.ingredients.find(y => y === x.name));
    setClickedNodes(newSelectedNodes);
  }, [search])

  function handleRecommendedIngredientButton(ingredient) {
    const nodeInfo = graphNodes.find(x => x.name === ingredient);
    if(nodeInfo) handleNodeClick(nodeInfo);
  }

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
        <div style={{padding:15}}>
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
          <Divider style={{marginBottom: 15}}/>
          <div>
            <Typography variant="h6">Podés agregar:</Typography>
            <div>
              {recommendedIngredients.map((ingredient, i) => (
                <Button style={{margin:'10px 0',display:'block'}} variant="contained" onClick={() => handleRecommendedIngredientButton(ingredient)}>
                  {ingredient}
                </Button>
              ))}
            </div>
          </div>
          <Divider style={{marginBottom: 15}}/>
          <div>
            <Typography variant="h6">Recetas:</Typography>
            {recommendedRecipes.map((recipe, i) => (
              <Card style={{margin:'15px 0'}} key={i}>
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
          <Divider style={{marginBottom: 15}}/>
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
      <div style={{padding:7,background:'#fff',borderRadius:8,position:'fixed',top:15,right:15}}>
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
      <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{maxWidth: '100%', height: 'auto'}} />
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

export default App;
