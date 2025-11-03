let bPlusTree = new BPlusTree(4);

function setOrder() {
    const order = parseInt(prompt("Digite a ordem da árvore (mínimo 3):", bPlusTree.order));
    if (!isNaN(order) && order >= 3) {
        bPlusTree = new BPlusTree(order);
        document.getElementById("historyLog").innerHTML = "";
        bPlusTree.updateDisplay();
        bPlusTree.log('info', `Nova árvore B+ criada com ordem ${order}`);
    }
}

function updateStats(tree) {
    const infoDiv = document.getElementById("treeInfo");
    infoDiv.innerHTML = `
        Ordem: ${tree.order} | 
        Altura: ${tree.getHeight()} | 
        Nós: ${tree.countNodes()} | 
        Elementos: ${tree.countElements()} |
        Folhas: ${tree.getLeafSequence().length} valores
    `;
}

function insertValue() {
    const input = document.getElementById("valueInput");
    const value = parseInt(input.value);
    
    if (!isNaN(value) && value >= 0) {
        bPlusTree.insert(value);
    } else {
        bPlusTree.log('error', 'Por favor, digite um número válido (≥ 0)');
    }
    input.value = "";
}

function deleteValue() {
    const input = document.getElementById("valueInput");
    const value = parseInt(input.value);
    
    if (!isNaN(value) && value >= 0) {
        bPlusTree.delete(value);
    } else {
        bPlusTree.log('error', 'Por favor, digite um número válido (≥ 0)');
    }
    input.value = "";
}

function resetTree() {
    bPlusTree = new BPlusTree(bPlusTree.order);
    document.getElementById("historyLog").innerHTML = "";
    bPlusTree.updateDisplay();
    bPlusTree.log('info', 'Árvore resetada');
}

function loadSampleData() {
    bPlusTree.loadSampleData();
}

function renderTree(tree) {
    const container = document.getElementById("tree");
    container.innerHTML = '';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('connections');
    container.appendChild(svg);
    
    const treeStructure = document.createElement('div');
    treeStructure.className = 'tree-structure';
    
    const levels = getTreeLevels(tree.root);
    
    levels.forEach((levelNodes, levelIndex) => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level';
        
        levelNodes.forEach((nodeInfo) => {
            const nodeContainer = document.createElement('div');
            nodeContainer.className = 'node-container';
            
            const node = nodeInfo.node;
            const maxKeys = tree.order - 1;
            const isFull = node.keys.length >= maxKeys;
            const isRoot = levelIndex === 0;
            
            const nodeDiv = document.createElement('div');
            nodeDiv.className = `node ${node.isLeaf ? 'leaf' : 'internal'} ${isRoot ? 'root' : ''} ${isFull ? 'full' : ''}`;
            
            nodeDiv.innerHTML = `
                <div style="font-weight: bold;">${node.keys.join(' | ')}</div>
                <div style="font-size: 0.7rem; color: #666; margin-top: 3px;">
                    ${node.isLeaf ? 'Folha' : 'Interno'} (${node.keys.length}/${maxKeys})
                </div>
            `;
            
            nodeContainer.appendChild(nodeDiv);
            levelDiv.appendChild(nodeContainer);
            
            nodeInfo.element = nodeDiv;
            nodeInfo.container = nodeContainer;
        });
        
        treeStructure.appendChild(levelDiv);
    });
    
    container.appendChild(treeStructure);
    
    setTimeout(() => drawConnections(levels, svg, tree), 100);
}

function getTreeLevels(root) {
    const levels = [];
    
    function traverse(node, level, parentIndex) {
        if (!levels[level]) levels[level] = [];
        
        const nodeInfo = {
            node: node,
            level: level,
            parentIndex: parentIndex
        };
        
        levels[level].push(nodeInfo);
        const currentIndex = levels[level].length - 1;
        
        if (!node.isLeaf) {
            node.children.forEach((child, childIndex) => {
                traverse(child, level + 1, currentIndex);
            });
        }
        
        return currentIndex;
    }
    
    traverse(root, 0, -1);
    return levels;
}

function drawConnections(levels, svg, tree) {
    const existingConnections = svg.querySelectorAll('.connection, .leaf-connection');
    existingConnections.forEach(conn => conn.remove());
    
    for (let level = 0; level < levels.length - 1; level++) {
        const parentLevel = levels[level];
        const childLevel = levels[level + 1];
        
        parentLevel.forEach((parentInfo, parentIndex) => {
            const parentNode = parentInfo.element;
            const parentRect = parentNode.getBoundingClientRect();
            const containerRect = svg.getBoundingClientRect();
            
            const parentX = parentRect.left + parentRect.width / 2 - containerRect.left;
            const parentY = parentRect.bottom - containerRect.top;
            
            const children = childLevel.filter(childInfo => childInfo.parentIndex === parentIndex);
            
            children.forEach(childInfo => {
                const childNode = childInfo.element;
                const childRect = childNode.getBoundingClientRect();
                
                const childX = childRect.left + childRect.width / 2 - containerRect.left;
                const childY = childRect.top - containerRect.top;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', parentX);
                line.setAttribute('y1', parentY);
                line.setAttribute('x2', childX);
                line.setAttribute('y2', childY);
                line.setAttribute('class', 'connection');
                svg.appendChild(line);
            });
        });
    }
    
    drawLeafConnections(levels, svg, tree);
    
    const container = document.getElementById("tree");
    svg.setAttribute('width', container.offsetWidth);
    svg.setAttribute('height', container.offsetHeight);
}

function drawLeafConnections(levels, svg, tree) {
    const leafLevel = levels[levels.length - 1];
    if (!leafLevel || leafLevel.length < 2) return;
    
    const containerRect = svg.getBoundingClientRect();
    
    for (let i = 0; i < leafLevel.length - 1; i++) {
        const currentNode = leafLevel[i].element;
        const nextNode = leafLevel[i + 1].element;
        
        const currentRect = currentNode.getBoundingClientRect();
        const nextRect = nextNode.getBoundingClientRect();
        
        const currentX = currentRect.right - containerRect.left;
        const currentY = currentRect.top + currentRect.height / 2 - containerRect.top;
        const nextX = nextRect.left - containerRect.left;
        const nextY = nextRect.top + nextRect.height / 2 - containerRect.top;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', currentX);
        line.setAttribute('y1', currentY);
        line.setAttribute('x2', nextX);
        line.setAttribute('y2', nextY);
        line.setAttribute('class', 'leaf-connection');
        svg.appendChild(line);
    }
}

function updateHistoryDisplay(tree) {
    const historyList = document.getElementById("historyLog");
    historyList.innerHTML = '';
    
    if (tree.history.length === 0) {
        historyList.innerHTML = '<div class="history-entry info">Nenhuma operação realizada</div>';
        return;
    }
    
    tree.history.forEach(entry => {
        const item = document.createElement('div');
        item.classList.add('history-entry', entry.action);
        
        let icon = '🔧';
        if (entry.action === 'insert') icon = '➕';
        if (entry.action === 'delete') icon = '➖';
        if (entry.action === 'error') icon = '❌';
        if (entry.action === 'info') icon = 'ℹ️';
        if (entry.action === 'split') icon = '🔀';
        
        item.innerHTML = `
            <strong>${icon} ${entry.message}</strong>
            <small style="color: #666; display: block; margin-top: 2px;">${entry.timestamp}</small>
        `;
        
        historyList.appendChild(item);
    });
}

function updateLeafSequence(tree) {
    const sequenceDiv = document.getElementById("leafSequence");
    const sequence = tree.getLeafSequence();
    
    if (sequence.length === 0) {
        sequenceDiv.innerHTML = '<div style="text-align: center; color: #666;">Sequência vazia</div>';
        return;
    }
    
    let html = '<div class="sequence-items">';
    sequence.forEach((value, index) => {
        html += `<span class="leaf-sequence-item">${value}</span>`;
        if (index < sequence.length - 1) {
            html += '<span class="leaf-sequence-arrow">→</span>';
        }
    });
    html += '</div>';
    
    sequenceDiv.innerHTML = html;
}

window.onload = function() {
    bPlusTree.updateDisplay();
    bPlusTree.log('info', 'Visualizador de Árvore B+ iniciado');
};