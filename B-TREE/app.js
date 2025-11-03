let tree = new BTree(3);

function setDegree() {
    const t = parseInt(prompt("Digite o grau mínimo T (ex: 3):", tree.t));
    if (!isNaN(t) && t >= 2) {
        tree = new BTree(t);
        document.getElementById("historyLog").innerHTML = "";
        render();
        updateInfo();
        tree.log(`Criada nova árvore com T = ${t}`);
    }
}

function updateInfo() {
    const t = tree.t;
    document.getElementById("treeInfo").innerHTML =
        `T = ${t} → cada nó pode ter de <b>${t - 1}</b> a <b>${2 * t - 1}</b> chaves`;
}

function insertLetter() {
    const input = document.getElementById("letterInput");
    const letter = input.value.toUpperCase();
    if (letter.match(/[A-Z]/)) {
        const success = tree.insert(letter);
        if (success) {
            render();
        }
    } else {
        tree.log(`'${letter}' não é uma letra válida!`);
    }
    input.value = "";
}

function deleteLetter() {
    const input = document.getElementById("letterInput");
    const letter = input.value.toUpperCase();
    if (letter.match(/[A-Z]/)) {
        const success = tree.delete(letter);
        if (success) {
            render();
        }
    } else {
        tree.log(`'${letter}' não é uma letra válida!`);
    }
    input.value = "";
}

function resetTree() {
    tree = new BTree(tree.t);
    document.getElementById("historyLog").innerHTML = "";
    render();
}

function loadInitialTree() {
    tree.createInitialStructure();
    render();
    updateInfo();
}

function render() {
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
        
        levelNodes.forEach((nodeInfo, nodeIndex) => {
            const nodeContainer = document.createElement('div');
            nodeContainer.className = 'node-container';
            
            const node = nodeInfo.node;
            const max = 2 * node.t - 1;
            const isFull = node.keys.length >= max;
            const isRoot = levelIndex === 0;
            const isEmpty = node.keys.length === 0;
            
            const nodeDiv = document.createElement('div');
            nodeDiv.className = `node ${isFull ? 'full' : ''} ${isRoot ? 'root' : ''} ${isEmpty ? 'empty' : ''}`;
            
            if (isEmpty) {
                nodeDiv.innerHTML = `(vazio)`;
            } else {
                nodeDiv.innerHTML = `
                    ${node.keys.join(" | ")}
                    <div style="font-size:0.7rem; color:#666;">
                        (${node.keys.length}/${max})
                    </div>
                `;
            }
            
            nodeContainer.appendChild(nodeDiv);
            levelDiv.appendChild(nodeContainer);
            
            nodeInfo.element = nodeDiv;
            nodeInfo.container = nodeContainer;
            nodeInfo.index = nodeIndex;
        });
        
        treeStructure.appendChild(levelDiv);
    });
    
    container.appendChild(treeStructure);
    
    setTimeout(() => drawConnections(levels, svg), 100);
}

function getTreeLevels(root) {
    const levels = [];
    
    function traverse(node, level, parentIndex) {
        if (!levels[level]) levels[level] = [];
        
        const nodeInfo = {
            node: node,
            level: level,
            parentIndex: parentIndex,
            index: levels[level].length,
            children: []
        };
        
        levels[level].push(nodeInfo);
        const currentIndex = levels[level].length - 1;
        
        if (!node.leaf) {
            node.children.forEach((child, childIndex) => {
                const childIndexInLevel = traverse(child, level + 1, currentIndex);
                nodeInfo.children.push(childIndexInLevel);
            });
        }
        
        return currentIndex;
    }
    
    traverse(root, 0, -1);
    return levels;
}

function drawConnections(levels, svg) {
    const existingConnections = svg.querySelectorAll('.connection');
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
    
    const container = document.getElementById("tree");
    svg.setAttribute('width', container.offsetWidth);
    svg.setAttribute('height', container.offsetHeight);
}

window.onload = function() {
    loadInitialTree();
};