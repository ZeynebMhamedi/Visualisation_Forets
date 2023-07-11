
// Fonction pour générer des arbres hiérarchiques à partir des données.
export function generateTree(treeData, treeId, treeLayout) {
const root = d3.hierarchy(treeData);
root.each((node, i) => {
node.id = `${treeId}-${i}`;
node.data.accuracy = node.parent ? node.parent.data.accuracy : treeData.accuracy; 
});
return treeLayout(root);
}

// Fonction pour déterminer la couleur en fonction de l'accuracy.
export function getColorByAccuracy(accuracy) {
if (accuracy >= 0.8) {
    return "red";
} else if (accuracy >= 0.6) {
    return "blue";
} else {
    return "gray";
}
}

//calculer le cercle circonscrit
export function calculateBoundingCircle(tree) {
    const xCoords = tree.descendants().filter(d => d.parent).map(d => d.x);
    const yCoords = tree.descendants().filter(d => d.parent).map(d => d.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radius = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2)) / 2;
    return { centerX, centerY, radius };
  }


// Fonction pour calculer la position X de chaque arbre en fonction de son accuracy
export function calculateTreeXPosition(accuracy, totalWidth) {
    let xPos;
    if (accuracy >= 0.8) {
      xPos = totalWidth / 6;
    } else if (accuracy >= 0.6) {
      xPos = totalWidth / 2;
    } else {
      xPos = (5 * totalWidth) / 6;
    }
    return xPos;
  }
  
  export function setBubble(slider, bubble) {
    let val = slider.value;
    let min = slider.min ? slider.min : 0;
    let max = slider.max ? slider.max : 100;
    let newVal = Number(((val - min) * 100) / (max - min));
    bubble.innerHTML = val;

    // Sorta magic numbers based on size and scale.
    bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
}

// Fonction pour basculer la classe "toggled" sur les nœuds ayant le même nom.
export function toggleSameNodes(d, data, svg) {
  // Trouver tous les nœuds portant le même nom dans tous les arbres
  const sameNodes = data.flatMap(tree => tree.descendants())
    .filter(node => node.data.name === d.data.name);

  // Basculer la classe "toggled" sur les nœuds trouvés
  svg.selectAll(".node")
    .filter(node => sameNodes.includes(node))
    .classed("toggled", sameNodes[0].data.toggled ? false : true);
}

export function prepareDataForVisualization(selectedFeature, selectedGroup, selectedFeatures, data, accuracyRanges){
  // Filtrer les données en fonction de la caractéristique sélectionnée.
  let filteredData;
  if (selectedFeature && selectedFeature !== "Toutes les caractéristiques") {
    filteredData = data.filter(tree =>
      tree.descendants().some(node => node.data.name === selectedFeature)
    );
  } else {
    filteredData = data; // Si aucune caractéristique n'est sélectionnée ou si "Toutes les caractéristiques" est sélectionné, utiliser toutes les données.
  }
  // Filtrer les données en fonction des caractéristiques sélectionnées avec les boutons 'Meilleures' et 'Pires'.
  if (selectedFeatures && selectedFeatures.length > 0) {
    filteredData = filteredData.filter(tree =>
      tree.descendants().some(node => selectedFeatures.includes(node.data.name))
    );
  }
  // Filtrer les données en fonction du groupe sélectionné.
  let selectedAllGroups = false;
  if (selectedGroup && selectedGroup !== "Tous les groupes") {
    const range = accuracyRanges[selectedGroup];
    if (range) {
      filteredData = filteredData.filter(tree =>
        tree.data.accuracy >= range.min && tree.data.accuracy < range.max
      );
    } else {
      console.error(`Unknown group: ${selectedGroup}`);
    }
  } else {
    selectedAllGroups = true;
  }
  return { filteredData, selectedAllGroups };
}


export function generateAllGroupsVisualization(filteredData, selectedFeature, height, totalWidth, boundingCircles, maxHeight, margin, g, axisMarginBottom, svg, tooltip, data, couleur, classes, accuracyScale, verticalSpacingFactor, width, xOffset) {
  // Réinitialiser les variables de positionnement
  let yOffsetGroup1 = [];
  let yOffsetGroup2 = [];
  let yOffsetGroup3 = [];


  // Boucle sur chaque arbre pour créer la visualisation.
  filteredData.forEach((tree, index) => {
    const treeWidths = tree.descendants().map(d => d.x);
    const maxTreeWidth = Math.max(...treeWidths);
    const treeHeights = tree.descendants().map(d => d.y);
    const maxTreeHeight = Math.max(...treeHeights);


    // Calcul de la position X de l'arbre, change si un groupe spécifique est sélectionné.
    let treeXPosition;
    treeXPosition = calculateTreeXPosition(tree.data.accuracy, totalWidth);
  

    let yOffset;
    const boundingCircleRadius = boundingCircles[index].radius;
    const accumulatedRadius = (group) => group.reduce((acc, radius) => acc + radius, 0);

    let groupSpacing = -60; 

    if (tree.data.accuracy >= 0.8) {
      yOffset = accumulatedRadius(yOffsetGroup1) + yOffsetGroup1.length * (maxHeight + margin.bottom + groupSpacing) + axisMarginBottom;
      yOffsetGroup1.push(boundingCircleRadius);
    } else if (tree.data.accuracy >= 0.6) {
      yOffset = accumulatedRadius(yOffsetGroup2) + yOffsetGroup2.length * (maxHeight + margin.bottom + groupSpacing) + axisMarginBottom;
      yOffsetGroup2.push(boundingCircleRadius);
    } else {
      yOffset = accumulatedRadius(yOffsetGroup3) + yOffsetGroup3.length * (maxHeight + margin.bottom + groupSpacing) + axisMarginBottom;
      yOffsetGroup3.push(boundingCircleRadius);
    }

    // Création d'un groupe (g) pour chaque arbre.
    const treeGroup = g.append("g")
      .attr("transform", `translate(${treeXPosition - boundingCircles[index].centerX}, ${yOffset})`);

    // Dessiner le cercle circonscrit pour chaque arbre en utilisant la couleur de la racine.
    const boundingCircle = boundingCircles[index];
    const rootColor = getColorByAccuracy(tree.data.accuracy);

    treeGroup.append("circle")
      .attr("class", "bounding-circle")
      .attr("cx", boundingCircle.centerX)
      .attr("cy", boundingCircle.centerY)
      .attr("r", boundingCircle.radius)
      .attr("stroke", rootColor) // Utilise la couleur de la racine pour le contour du cercle.
      .attr("fill", rootColor) // Utilise la couleur de la racine pour le remplissage du cercle.
      .attr("opacity", 0.3); // Ajoute une opacité pour rendre le cercle semi  transparent.

      treeGroup.append("circle")
        .attr("class", "bounding-circle")
        .attr("cx", boundingCircle.centerX)
        .attr("cy", boundingCircle.centerY)
        .attr("r", boundingCircle.radius)
        .attr("stroke", "black")
        .attr("fill", "none");
  
      treeGroup.append("text")
        .attr("class", "accuracy-label")
        .attr("x", boundingCircle.centerX)
        .attr("y", 0) // Ajuste la position verticale des étiquettes
        .attr("text-anchor", "middle")
        .text(`${tree.data.accuracy.toFixed(2)}`)
        .attr("font-family", "Arial")
        .attr("font-size", "12px")
        .attr("fill", "black");
  
      // Dessiner les nœuds de chaque arbre (sauf la racine)
      const nodesData = tree.descendants().filter(d => d.parent);
      const nodes = treeGroup.selectAll(".node")
        .data(nodesData, d => d.data.name);
  
      const nodesEnter = nodes.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .on("mouseover", function(d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          tooltip.html(d.data.name)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        })
        .on("click", function(d) {
          const node = d3.select(this);
          const isToggled = node.classed("toggled");
  
          // Supprimer la classe "toggled" de tous les nœuds de toutes les arborescences
          svg.selectAll(".node").classed("toggled", false);
  
          // Basculer la classe "toggled" sur le nœud cliqué et les mêmes nœuds
          node.classed("toggled", !isToggled);
          toggleSameNodes(d, data, svg);
          
          if (d.children) {
            selectedFeature = d.data.name;
            // Mettre à jour l'affichage de la fonctionnalité sélectionnée
            d3.select('#selected-feature-display').text(`Caractéristique: ${selectedFeature}`);
          }  
          else {
            // Effacer le texte si le nœud cliqué est une feuille
            d3.select('#selected-feature-display').text('');}
        });
  
        nodesEnter.append("circle")
          .attr("r", 8)
          .style('fill', d => {
              // Si le nœud est une feuille et que son nom correspond à une classe, on utilise la couleur correspondante
              if (!d.children && classes.includes(d.data.name)) {
                  return couleur(d.data.name);
              }
              // Sinon, on colorie le nœud en noir ou en vert selon que le nom du nœud correspond à la caractéristique sélectionnée
              else {
                  return d.data.name === selectedFeature ? '#90EE90' : '#black';
              }
          }) 
          .style('stroke', d => {
            // Si le nœud est une feuille, on lui donne un bord noir
            return (!d.children) ? 'black' : 'none';
          })
          .style('stroke-width', d => {
              // Si le nœud est une feuille, on lui donne un bord d'épaisseur 2
              return (!d.children) ? '2' : 'none';
          })
          .attr("data-name", d => d.data.name);
  
      nodes.exit().remove();
  
      // Dessiner les liens entre les nœuds.
      const linksData = tree.links();
      const filteredLinksData = linksData.filter(d => d.source.parent); // Exclut les liens où la source est la racine
      const links = treeGroup.selectAll(".link")
        .data(filteredLinksData, d => d.source.data.name + '-' + d.target.data.name);  

        const linksEnter = links.enter()
          .append("path")
          .attr("class", "link")
          .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
          .attr("stroke", "black")
          .attr("fill", "none");
    
        links.exit().remove();
    
        // Mise à jour des variables de positionnement et de taille.
        xOffset += maxTreeWidth + margin.right;
        maxHeight = Math.max(maxHeight, maxTreeHeight);
      });
    
      // Ajustement de la largeur et de la hauteur de la zone de dessin si nécessaire.
      const maxGroupLength = Math.max(yOffsetGroup1.length, yOffsetGroup2.length, yOffsetGroup3.length);
      const totalHeight = maxGroupLength * (maxHeight + margin.bottom) * verticalSpacingFactor + margin.top + margin.bottom;
      if (totalWidth > width) {
          svg.attr("width", totalWidth);
      }
      svg.attr("height", Math.max(height, totalHeight) + axisMarginBottom);

      // Création de l'axe de l'accuracy.
      const accuracyAxis = d3.axisBottom(accuracyScale)
        .tickValues([1, 0.8, 0.6, 0]) // Valeurs spécifiques qu'on souhaite afficher
        .tickFormat(d3.format(".0%"));

      // Ajout de l'axe de l'accuracy.
      svg.append("g")
        .attr("class", "accuracy-axis")
        .attr("transform", `translate(10, 140)`) //Position de l'axe d'accuracy
        .call(accuracyAxis);

      const axeLabelPos = 6.5;
      // Ajout du libellé "Accuracy" en haut à gauche de l'axe
      svg.append("text")
      .attr("class", "axis-label")
      .attr("x", margin.left)
      .attr("y", margin.top * axeLabelPos)
      .attr("text-anchor", "start")
      .text("Accuracy");

      // Ajout des libellés des groupes au-dessus de l'axe
      svg.append("text")
      .attr("class", "group-label")
      .attr("x", (totalWidth - margin.left - margin.right) / 6) // Position x pour le libellé "Groupe 1"
      .attr("y", margin.top * axeLabelPos) // Position y pour tous les libellés
      .attr("text-anchor", "middle")
      .text("Groupe 1");

      svg.append("text")
      .attr("class", "group-label")
      .attr("x", (totalWidth - margin.left - margin.right) / 2) // Position x pour le libellé "Groupe 2"
      .attr("y", margin.top * axeLabelPos) // Position y pour tous les libellés
      .attr("text-anchor", "middle")
      .text("Groupe 2");

      svg.append("text")
      .attr("class", "group-label")
      .attr("x", (totalWidth - margin.left - margin.right) * 5 / 6) // Position x pour le libellé "Groupe 3"
      .attr("y", margin.top * axeLabelPos) // Position y pour tous les libellés
      .attr("text-anchor", "middle")
      .text("Groupe 3");

      // Mise à jour la position X du titre de l'axe de l'accuracy.
      svg.select(".accuracy-axis-title")
        .attr("x", totalWidth / 2);
    
}


export function generateSpecificGroupVisualization(filteredData, selectedFeature, height, totalWidth, boundingCircles, maxHeight, margin, g, axisMarginBottom, svg, tooltip, data, couleur, classes, verticalSpacingFactor, width, xOffset) {

  d3.select(".accuracy-axis").remove();
  d3.select(".axis-label").remove();
  d3.selectAll(".group-label").remove();
  
  // Trier les données par accuracy en ordre décroissant pour le groupe spécifique sélectionné.
  filteredData.sort((a, b) => b.data.accuracy - a.data.accuracy);

  xOffset = 50; // Cette variable déterminera la position X de chaque arbre.
  
  filteredData.forEach((tree, index) => {
    const treeWidths = tree.descendants().map(d => d.x);
    const maxTreeWidth = Math.max(...treeWidths);
    const treeHeights = tree.descendants().map(d => d.y);
    const maxTreeHeight = Math.max(...treeHeights);
    
    // Calcul de la position X de l'arbre.
    let treeXPosition = xOffset;
    
    // Créer un groupe pour chaque arbre.
    const treeGroup = g.append("g")
      .attr("transform", `translate(${treeXPosition}, ${150})`);

    // Dessiner le cercle circonscrit pour chaque arbre en utilisant la couleur de la racine.
    const boundingCircle = boundingCircles[index];
    const rootColor = getColorByAccuracy(tree.data.accuracy);

  treeGroup.append("circle")
    .attr("class", "bounding-circle")
    .attr("cx", boundingCircle.centerX)
    .attr("cy", boundingCircle.centerY)
    .attr("r", boundingCircle.radius)
    .attr("stroke", rootColor) // Utilise la couleur de la racine pour le contour du cercle.
    .attr("fill", rootColor) // Utilise la couleur de la racine pour le remplissage du cercle.
    .attr("opacity", 0.3); // Ajoute une opacité pour rendre le cercle semi  transparent.

    treeGroup.append("circle")
      .attr("class", "bounding-circle")
      .attr("cx", boundingCircle.centerX)
      .attr("cy", boundingCircle.centerY)
      .attr("r", boundingCircle.radius)
      .attr("stroke", "black")
      .attr("fill", "none");

    treeGroup.append("text")
      .attr("class", "accuracy-label")
      .attr("x", boundingCircle.centerX)
      .attr("y", 0) // Ajuste la position verticale des étiquettes
      .attr("text-anchor", "middle")
      .text(`${tree.data.accuracy.toFixed(2)}`)
      .attr("font-family", "Arial")
      .attr("font-size", "12px")
      .attr("fill", "black");

    // Dessiner les nœuds de chaque arbre (sauf la racine)
    const nodesData = tree.descendants().filter(d => d.parent);
    const nodes = treeGroup.selectAll(".node")
      .data(nodesData, d => d.data.name);  

    const nodesEnter = nodes.enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("mouseover", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(d.data.name)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .on("click", function(d) {
        const node = d3.select(this);
        const isToggled = node.classed("toggled");

        // Supprimer la classe "toggled" de tous les nœuds de toutes les arborescences
        svg.selectAll(".node").classed("toggled", false);

        // Basculer la classe "toggled" sur le nœud cliqué et les mêmes nœuds
        node.classed("toggled", !isToggled);
        toggleSameNodes(d, data, svg);

        if (d.children) {
          selectedFeature = d.data.name;
          // Mettre à jour l'affichage de la fonctionnalité sélectionnée
          d3.select('#selected-feature-display').text(`Caractéristique: ${selectedFeature}`);
        }  
        else {
          // Effacer le texte si le nœud cliqué est une feuille
          d3.select('#selected-feature-display').text('');}
      });

      nodesEnter.append("circle")
      .attr("r", 8)
      .style('fill', d => {
          // Si le nœud est une feuille et que son nom correspond à une classe, on utilise la couleur correspondante
          if (!d.children && classes.includes(d.data.name)) {
              return couleur(d.data.name);
          }
          // Sinon, on colorie le nœud en noir ou en vert selon que le nom du nœud correspond à la caractéristique sélectionnée
          else {
              return d.data.name === selectedFeature ? '#90EE90' : '#black';
          }
      }) 
      .style('stroke', d => {
        // Si le nœud est une feuille, bord noir
        return (!d.children) ? 'black' : 'none';
      })
      .style('stroke-width', d => {
          // Si le nœud est une feuille, bord d'épaisseur 2
          return (!d.children) ? '2' : 'none';
      })
      .attr("data-name", d => d.data.name)

    nodes.exit().remove();

    // Dessiner les liens entre les nœuds.
    const linksData = tree.links();
    const filteredLinksData = linksData.filter(d => d.source.parent); // Exclut les liens où la source est la racine
    const links = treeGroup.selectAll(".link")
      .data(filteredLinksData, d => d.source.data.name + '-' + d.target.data.name); 

      const linksEnter = links.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
        .attr("stroke", "black")
        .attr("fill", "none");
  
      links.exit().remove();
  
      // Mise à jour des variables de positionnement et de taille.
      let treeSpacing = 50;  
      xOffset += maxTreeWidth + margin.right + treeSpacing;
      svg.attr("width", Math.max(svg.attr("width"), xOffset));
      maxHeight = Math.max(maxHeight, maxTreeHeight);
    });  
}


export function updateFeatureDropdown(selectedFeatures) {
  // Parcourir toutes les options de la liste déroulante des caractéristiques
  d3.selectAll('#FeatureSelect option').each(function(d) {
    let optionElement = d3.select(this);

    // Si l'option actuelle n'est pas dans selectedFeatures et ce n'est pas "Toutes les caractéristiques", la désactiver.
    if (!selectedFeatures.includes(d) && d !== "Toutes les caractéristiques") {
      optionElement.attr('disabled', '');
    } else {
      // Assurez-vous que les options valides ne sont pas désactivées
      optionElement.attr('disabled', null);
    }
  });

  // Assurez-vous que Select2 est mis à jour pour refléter les modifications
  $('#FeatureSelect').trigger('change.select2');
}
