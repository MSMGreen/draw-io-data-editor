Draw.loadPlugin(function (ui) {
    var graph = ui.editor.graph;
    var originalMxCellConstructor = mxCell;
    // Create the extended mxCell constructor
	var originalMxCellConstructor = mxCell;

// Create a new mxCell subclass.
	function MyMxCell(value, geometry, style) {
		originalMxCellConstructor.call(this, value, geometry, style);
		if (this.isVertex() && value && value.nodeType === 1) {
			if (!value.hasAttribute('type')) {
				value.setAttribute('type', 'Concept');
			}
		}
	}

	// Extend the new mxCell subclass with the original mxCell.
	mxUtils.extend(MyMxCell, originalMxCellConstructor);

	// Override the decode method in the new mxCell subclass.
	MyMxCell.prototype.decode = function(node, restoreGeometry) {
		var type = node.getAttribute('type');
		if (type !== null && type !== 'Concept') {
			throw new Error("Invalid type: " + type);
		}
		originalMxCellConstructor.prototype.decode.apply(this, arguments);
	}

	// Override the encode method in the new mxCell subclass.
	MyMxCell.prototype.encode = function() {
		var node = originalMxCellConstructor.prototype.encode.apply(this, arguments);
		if (this.isVertex()) {
			node.setAttribute('type', 'Concept');
		}
		return node;
	}

    mxUtils.extend(mxCell, originalMxCellConstructor);
    ui.sidebar.addPalette('Node Editor', 'Node Editor', true, function (content) {
        content.innerHTML = '<div id="metadata-panel" style="padding: 8px;"><p>Select a shape to view its metadata.</p></div>';
    });
	
	function extractTextFromHTML(htmlString) {
		var div = document.createElement('div');
		div.innerHTML = htmlString;
		return div.textContent || div.innerText || "";
	}
	
function createMetadataForm(attributes, cell) {
    var form = '<form id="metadata-form">';
    var typeValue = cell.getAttribute('type');

    // First add 'type' field
    var typeAttr = Array.from(attributes).find(attr => attr.name === 'type');
    if (typeAttr) {
        var escapedValue = mxUtils.htmlEntities(typeAttr.value);
        form += '<label>Type:</label><select name="type" onchange="updateAttribute(\'type\', this.value, \'' + cell.id + '\')">';
        var options = ['Concept', 'Entity', 'OBSERV: Entity'];
        options.forEach(function (option) {
            var selected = (escapedValue === option) ? 'selected' : '';
            form += '<option value="' + option + '" ' + selected + '>' + option + '</option>';
        });
        form += '</select><br>';
    }

    // Then add 'label' field
    var labelAttr = Array.from(attributes).find(attr => attr.name === 'label');
    if (labelAttr) {
        var escapedValue = mxUtils.htmlEntities(extractTextFromHTML(labelAttr.value));
        form += '<label>Label:</label><input type="text" name="label" value="' + escapedValue + '" onchange="updateAttribute(\'label\', this.value, \'' + cell.id + '\')"><br>';
    }

    // Then process remaining fields according to type
    for (var i = 0; i < attributes.length; i++) {
        var attr = attributes[i];
        var escapedValue = attr.value;

        if (attr.name !== 'type' && attr.name !== 'label') { // Skip 'type' and 'label' since they've already been processed
            escapedValue = mxUtils.htmlEntities(escapedValue); // Escape HTML entities

            if ((typeValue === 'Concept' && (attr.name === 'domain' || attr.name === 'definition')) || 
                (typeValue === 'Entity' && (attr.name === 'entityType' || attr.name === 'attributes' || attr.name === 'definition')) ||
                (typeValue === 'Observation' && attr.name === 'entityType')|| (typeValue === 'OBSERV: Entity' && (attr.name === 'entityType' || attr.name === 'definition' || attr.name === 'collection'))) {
				if (attr.name === 'attributes' || attr.name === 'definition') {
					form += '<label>' + attr.name + ':</label><textarea name="' + attr.name + '" rows="4" cols="20" onchange="updateAttribute(\'' + attr.name + '\', this.value, \'' + cell.id + '\')">' + escapedValue + '</textarea><br>';
				}
				else {
    
                form += '<label>' + attr.name + ':</label><input type="text" name="' + attr.name + '" value="' + escapedValue + '" onchange="updateAttribute(\'' + attr.name + '\', this.value, \'' + cell.id + '\')"><br>';
				}
			}
        }
    }

    if (typeValue === 'Observation') {
        form += '<label>New Observation:</label><input type="text" name="newObservation" onchange="updateAttribute(\'newObservation\', this.value, \'' + cell.id + '\')"><br>';
    }

    
    form += '</form>';
    return form;
}

    function updateMetadataPanel(cell) {
        var metadataPanel = document.getElementById('metadata-panel');
        if (cell && graph.model.isVertex(cell) && cell.value && cell.value.attributes) {
            if (!cell.hasAttribute('type')) {
                cell.setAttribute('type', 'Concept');
            }

            if (!cell.hasAttribute('domain')) {
                cell.setAttribute('domain', '');
            }

            // Add 'attribute' field if it doesn't exist
            if (!cell.hasAttribute('attributes')) {
                cell.setAttribute('attributes', '');
            }

            var attributes = cell.value.attributes;
            var form = createMetadataForm(attributes, cell);
            metadataPanel.textContent = '';
            metadataPanel.insertAdjacentHTML('beforeend', form);
        } else {
            metadataPanel.innerHTML = '<p>Select a shape to view its metadata.</p>';
        }
    }

window.updateAttribute = function (attributeName, value, cellId) {
    var cell = graph.getModel().getCell(cellId);
    if (cell) {
        cell.setAttribute(attributeName, value);
        graph.refresh(cell);

        if (attributeName === 'type') {
			updateMetadataPanel(cell);
            // Clear all fields that aren't relevant to the selected type
            var irrelevantAttributes = ['domain', 'definition', 'entityType', 'attributes', 'collection'];
			mxutils.alert('I should remove children')
            irrelevantAttributes.forEach(function (attrName) {
				mxutils.alert('removing children')
                cell.setAttribute(attrName, '');
                removeChildShape(cell, attrName);
            });

            if (value === 'Concept') {
                cell.setAttribute('domain', cell.getAttribute('domain') || '');
                cell.setAttribute('definition', cell.getAttribute('definition') || '');
            } else if (value === 'Entity') {
                cell.setAttribute('entityType', cell.getAttribute('entityType') || '');
                cell.setAttribute('attributes', cell.getAttribute('attributes') || '');
                cell.setAttribute('definition', cell.getAttribute('definition') || '');
            } else if (value === 'Observation') {
                cell.setAttribute('entityType', cell.getAttribute('entityType') || '');
            }else if (value ===  'OBSERV: Entity') {
                cell.setAttribute('entityType', cell.getAttribute('entityType') || '');
                cell.setAttribute('definition', cell.getAttribute('definition') || '');
				cell.setAttribute('collection', cell.getAttribute('collection') || '');
            }
            
        } else if (attributeName === 'domain') {
            // Remove the existing domain label
            var existingChildren = graph.getModel().getChildVertices(cell);
            var labelCell = existingChildren.find(function (child) {
                return child.isDomainLabel; // Check for domain labels only
            });
            if (labelCell) {
                graph.removeCells([labelCell]);
            }
            // Insert a new domain label with the updated text
            if (value.trim() !== '') {
                insertDomainLabel(cell, value);
            }
        } else if (attributeName === 'attribute' || attributeName === 'newObservation') {
            if (value.trim() !== '') {
                insertAttributeLabel(cell, value);
            } else {
                removeChildShape(cell, attributeName);
            }
        } else if (attributeName === 'entityType') {
			insertDomainLabel(cell, value);
		}
		}
};


// New function to remove child shape based on attribute name
function removeChildShape(cell, attributeName) {
    var existingChildren = graph.getModel().getChildVertices(cell);
    var childShape;

    if (attributeName === 'domain') {
        childShape = existingChildren.find(function (child) {
            return child.isDomainLabel; // Check for domain labels only
        });
    } else if (attributeName === 'attributes') {
        childShape = existingChildren.find(function (child) {
            return child.geometry.y >= 1; // Check for attribute shapes only
        });
    }

    if (childShape) {
        graph.removeCells([childShape]);
    }
}

window.updateAttribute = function (attributeName, value, cellId) {
    var cell = graph.getModel().getCell(cellId);
    if (cell) {
        cell.setAttribute(attributeName, value);
        graph.refresh(cell);

        if (attributeName === 'type') {
            // Clear all fields that aren't relevant to the selected type
            var irrelevantAttributes = ['domain', 'definition', 'entityType', 'attributes'];
            irrelevantAttributes.forEach(function (attrName) {
                cell.setAttribute(attrName, '');
            });

            if (value === 'Concept') {
                cell.setAttribute('domain', cell.getAttribute('domain') || '');
                cell.setAttribute('definition', cell.getAttribute('definition') || '');
            } else if (value === 'Entity') {
                cell.setAttribute('entityType', cell.getAttribute('entityType') || '');
                cell.setAttribute('attributes', cell.getAttribute('attributes') || '');
                cell.setAttribute('definition', cell.getAttribute('definition') || '');
            } else if (value === 'Observation') {
                cell.setAttribute('entityType', cell.getAttribute('entityType') || '');
            } else if (value ===  'OBSERV: Entity') {
                cell.setAttribute('entityType', cell.getAttribute('entityType') || '');
                cell.setAttribute('definition', cell.getAttribute('definition') || '');
				cell.setAttribute('collection', cell.getAttribute('collection') || '');
            }

            updateMetadataPanel(cell);
        } else if (attributeName === 'domain') {
            // Remove the existing domain label
            var existingChildren = graph.getModel().getChildVertices(cell);
            var labelCell = existingChildren.find(function (child) {
                return child.isDomainLabel; // Check for domain labels only
            });
            if (labelCell) {
                graph.removeCells([labelCell]);
            }
            // Insert a new domain label with the updated text
            insertDomainLabel(cell, value);
        } else if (attributeName === 'attributes' || attributeName === 'newObservation') {
            if (value.trim() !== '') {
                insertAttributeLabel(cell, value);
				
		} 
		}else if (attributeName === 'entityType') {
			insertDomainLabel(cell, value);
		} else if (attributeName === 'collection') {
            // Remove the existing domain label
            var existingChildren = graph.getModel().getChildVertices(cell);
            var labelCell = existingChildren.find(function (child) {
                return child.isCollectionLabel; // Check for domain labels only
            });
            if (labelCell) {
                graph.removeCells([labelCell]);
            }
            // Insert a new domain label with the updated text
            insertCollectionLabel(cell, value);
        }
		}
	};
       
function insertDomainLabel(cell, domain) {
    var labelStyle = 'fontStyle=1;fontSize=8;align=center;verticalAlign=middle;rounded=1;strokeColor=0;fillColor=#29338C;fontColor=#FFFFFF;';
    var domainCellWidth = domain.length * 6;
    var geometry = new mxGeometry(1.10 - domainCellWidth / cell.geometry.width, -0.3, domainCellWidth, 10);
    geometry.relative = true;

    graph.getModel().beginUpdate();
    try {
        var existingChildren = graph.getModel().getChildVertices(cell);
        var labelCell = existingChildren.find(function (child) {
            return child.isDomainLabel && child.geometry.y < 1; // Check for domain labels above the parent shape
        });

        if (labelCell) {
            labelCell.geometry.width = domainCellWidth;
            labelCell.value = domain;
            graph.refresh(labelCell);
        } else {
            labelCell = new mxCell(domain, geometry, labelStyle);
            labelCell.vertex = true;
            labelCell.isDomainLabel = true; // Add this property to differentiate domain labels
            graph.addCell(labelCell, cell, 0);
        }
    } finally {
        graph.getModel().endUpdate();
    }
}

function insertCollectionLabel(cell, collection) {
    var labelStyle = 'fontStyle=1;fontSize=8;align=center;verticalAlign=middle;rounded=1;strokeColor=#3397D3;fillColor=#3397D3;fontColor=#FFFFFF;';
    var attributeCellWidth = 85;
    var attributeCellHeight = 10;
    var geometry = new mxGeometry(0.5 - (attributeCellWidth / 2) / cell.geometry.width, 0.85, attributeCellWidth, attributeCellHeight);
    geometry.relative = true;

    graph.getModel().beginUpdate();
    try {
        var existingChildren = graph.getModel().getChildVertices(cell);
        var labelCell = existingChildren.find(function (child) {
            return child.isCollectiveLabel && child.geometry.y > 1; // Check for domain labels above the parent shape
        });

        if (labelCell) {
            labelCell.geometry.width = collectionCellWidth;
            labelCell.value = collection;
            graph.refresh(labelCell);
        } else {
            labelCell = new mxCell(collection, geometry, labelStyle);
            labelCell.vertex = true;
            labelCell.isCollectionLabel = true; // Add this property to differentiate domain labels
            graph.addCell(labelCell, cell, 0);
        }
    } finally {
        graph.getModel().endUpdate();
    }
}

function insertAttributeLabel(cell, attribute) {
    var attributes = attribute.split(',');
    var shapeStyle = 'fontStyle=1;fontSize=8;align=center;verticalAlign=middle;rounded=0;strokeColor=#29338C;fillColor=#FFFFFF;fontColor=#29338C;';
    var attributeCellWidth = 95;
    var attributeCellHeight = 10;

    graph.getModel().beginUpdate();
    try {
        var existingChildren = graph.getModel().getChildVertices(cell);
        var existingAttributeShapes = existingChildren.filter(function (child) {
            return child.geometry.y >= 1;
        });
        var existingAttributeNames = existingAttributeShapes.map(function (child) {
            return child.value;
        });

        attributes.forEach(function (attr, index) {
            if (!existingAttributeNames.includes(attr)) {
                var cumulativeHeight = 1.0 + index * (attributeCellHeight / cell.geometry.height);
                var shapeGeometry = new mxGeometry(0.5 - (attributeCellWidth / 2) / cell.geometry.width, cumulativeHeight, attributeCellWidth, attributeCellHeight);
                shapeGeometry.relative = true;
                var shape = new mxCell(attr, shapeGeometry, shapeStyle);
                shape.vertex = true;
                graph.addCell(shape, cell);
            }
        });

        existingAttributeShapes.forEach(function (child) {
            if (!attributes.includes(child.value)) {
                graph.removeCells([child]);
            }
        });

        // Recalculate the y-coordinate of each attribute shape
        existingChildren = graph.getModel().getChildVertices(cell);
        existingAttributeShapes = existingChildren.filter(function (child) {
            return child.geometry.y >= 1;
        });

        existingAttributeShapes.sort(function (a, b) {
            return a.geometry.y - b.geometry.y;
        });

        existingAttributeShapes.forEach(function (child, index) {
            child.geometry.y = 1.0 + index * (attributeCellHeight / cell.geometry.height);
            graph.refresh(cell);
        });

    } finally {
        graph.getModel().endUpdate();
    }
}

    graph.getSelectionModel().addListener(mxEvent.CHANGE, function(sender, evt) {
        var cells = graph.getSelectionCells();
        var cell = cells.length > 0 ? cells[0] : null;

        if (cell) {
            updateMetadataPanel(cell);
        } else {
            updateMetadataPanel(null);
        }
    });
});