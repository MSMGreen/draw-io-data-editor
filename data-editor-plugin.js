Draw.loadPlugin(function (ui) {
    function createPanel(ui) {
        const div = document.createElement('div');
        div.style.padding = '4px';

        div.innerHTML = `
            <div>
                <label for="shapeLabel">Label:</label>
                <input type="text" id="shapeLabel" style="width: 100%;" />
            </div>
            <div style="margin-top: 8px;">
                <label for="customProperty">Custom Property:</label>
                <input type="text" id="customProperty" style="width: 100%;" />
            </div>
            <button id="applyChanges" style="margin-top: 8px; width: 100%;">Apply Changes</button>
        `;

        const applyChangesButton = div.querySelector('#applyChanges');

        applyChangesButton.addEventListener('click', function () {
            const shapeLabel = div.querySelector('#shapeLabel').value;
            const customProperty = div.querySelector('#customProperty').value;
            const selectedCell = ui.editor.graph.getSelectionCell();

            if (selectedCell && selectedCell.isVertex()) {
                updateShapeData(selectedCell, shapeLabel, customProperty);
            }
        });

        return div;
    }

    function updateShapeData(shape, label, customProperty) {
        if (shape) {
            // Update the shape's label
            shape.setValue(label);

            // Update the custom properties
            shape.customProperties = shape.customProperties || {};
            shape.customProperties.property = customProperty;

            // Refresh the shape to reflect the changes
            ui.editor.graph.refresh(shape);
        }
    }

    const panel = createPanel(ui);

    // Attach the panel to the draw.io UI
    ui.sidebar.addPage('shapeDataModifier', 'Modify Shape Data', panel);

    // Listen for shape selection events
    ui.editor.graph.getSelectionModel().addListener(mxEvent.CHANGE, function (sender, evt) {
        const selectedCell = ui.editor.graph.getSelectionCell();

        if (selectedCell && selectedCell.isVertex()) {
            const shapeLabel = panel.querySelector('#shapeLabel');
            const customProperty = panel.querySelector('#customProperty');

            shapeLabel.value = selectedCell.getValue() || '';
            customProperty.value = selectedCell.customProperties?.property || '';
        }
    });
});
