class BPlusTreeNode {
    constructor(isLeaf = false) {
        this.keys = [];
        this.children = [];
        this.isLeaf = isLeaf;
        this.next = null;
        this.parent = null;
    }
}

class BPlusTree {
    constructor(order = 4) {
        this.order = order;
        this.root = new BPlusTreeNode(true);
        this.history = [];
    }

    log(action, message) {
        const timestamp = new Date().toLocaleTimeString();
        this.history.unshift({
            action,
            message,
            timestamp,
            treeState: this.getTreeState()
        });
        
        if (this.history.length > 50) {
            this.history.pop();
        }
        
        this.updateDisplay();
    }

    getTreeState() {
        return {
            height: this.getHeight(),
            nodeCount: this.countNodes(),
            elementCount: this.countElements()
        };
    }

    search(key, node = this.root) {
        let i = 0;
        while (i < node.keys.length && key > node.keys[i]) {
            i++;
        }
        
        if (node.isLeaf) {
            if (i < node.keys.length && key === node.keys[i]) {
                return { node, index: i };
            }
            return null;
        }
        
        return this.search(key, node.children[i]);
    }

    insert(key) {
        if (this.search(key)) {
            this.log('error', `Valor ${key} já existe na árvore!`);
            return;
        }

        this.log('insert', `Inserindo valor ${key}...`);
        
        let node = this.root;
        
        if (node.keys.length === this.order - 1) {
            const newRoot = new BPlusTreeNode(false);
            newRoot.children.push(this.root);
            this.root = newRoot;
            this.splitChild(newRoot, 0);
        }
        
        this.insertNonFull(this.root, key);
    }

    insertNonFull(node, key) {
        if (node.isLeaf) {
            let i = 0;
            while (i < node.keys.length && key > node.keys[i]) {
                i++;
            }
            node.keys.splice(i, 0, key);
            this.log('insert', `Inserido ${key} na folha: [${node.keys.join(', ')}]`);
        } else {
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }
            
            if (node.children[i].keys.length === this.order - 1) {
                this.splitChild(node, i);
                if (key > node.keys[i]) {
                    i++;
                }
            }
            
            this.insertNonFull(node.children[i], key);
        }
    }

    splitChild(parent, index) {
        const child = parent.children[index];
        const newChild = new BPlusTreeNode(child.isLeaf);
        
        const mid = Math.floor(this.order / 2);
        const midKey = child.keys[mid];
        
        if (child.isLeaf) {
            newChild.keys = child.keys.splice(mid);
            newChild.next = child.next;
            child.next = newChild;
            
            parent.keys.splice(index, 0, newChild.keys[0]);
            parent.children.splice(index + 1, 0, newChild);
            
            this.log('split', `Dividiu folha: [${child.keys.join(', ')}] → [${newChild.keys.join(', ')}]`);
        } else {
            newChild.keys = child.keys.splice(mid + 1);
            newChild.children = child.children.splice(mid + 1);
            
            parent.keys.splice(index, 0, child.keys.pop());
            parent.children.splice(index + 1, 0, newChild);
            
            this.log('split', `Dividiu nó interno, chave ${midKey} sobe`);
        }
    }

    delete(key) {
        const found = this.search(key);
        if (!found) {
            this.log('error', `Valor ${key} não encontrado na árvore!`);
            return;
        }

        this.log('delete', `Excluindo valor ${key}...`);
        this.deleteFromNode(this.root, key);
        
        if (this.root.keys.length === 0 && !this.root.isLeaf) {
            this.root = this.root.children[0];
            this.log('info', 'Raiz ficou vazia, abaixando árvore');
        }
    }

    deleteFromNode(node, key) {
        if (node.isLeaf) {
            const index = node.keys.indexOf(key);
            if (index !== -1) {
                node.keys.splice(index, 1);
                this.log('delete', `Removido ${key} da folha: [${node.keys.join(', ')}]`);
            }
            return;
        }
        
        let i = 0;
        while (i < node.keys.length && key >= node.keys[i]) {
            i++;
        }
        
        this.deleteFromNode(node.children[i], key);
        
        if (node.children[i].keys.length < Math.ceil(this.order / 2) - 1) {
            this.rebalance(node, i);
        }
    }

    rebalance(parent, index) {
        const minKeys = Math.ceil(this.order / 2) - 1;
        const child = parent.children[index];
        
        if (index > 0 && parent.children[index - 1].keys.length > minKeys) {
            this.borrowFromLeft(parent, index);
        } else if (index < parent.children.length - 1 && parent.children[index + 1].keys.length > minKeys) {
            this.borrowFromRight(parent, index);
        } else {
            if (index > 0) {
                this.mergeNodes(parent, index - 1);
            } else {
                this.mergeNodes(parent, index);
            }
        }
    }

    borrowFromLeft(parent, index) {
        const child = parent.children[index];
        const leftSibling = parent.children[index - 1];
        
        if (child.isLeaf) {
            const borrowedKey = leftSibling.keys.pop();
            child.keys.unshift(borrowedKey);
            parent.keys[index - 1] = child.keys[0];
        } else {
            child.keys.unshift(parent.keys[index - 1]);
            parent.keys[index - 1] = leftSibling.keys.pop();
            child.children.unshift(leftSibling.children.pop());
        }
        
        this.log('info', 'Pegou chave emprestada do irmão esquerdo');
    }

    borrowFromRight(parent, index) {
        const child = parent.children[index];
        const rightSibling = parent.children[index + 1];
        
        if (child.isLeaf) {
            const borrowedKey = rightSibling.keys.shift();
            child.keys.push(borrowedKey);
            parent.keys[index] = rightSibling.keys[0];
        } else {
            child.keys.push(parent.keys[index]);
            parent.keys[index] = rightSibling.keys.shift();
            child.children.push(rightSibling.children.shift());
        }
        
        this.log('info', 'Pegou chave emprestada do irmão direito');
    }

    mergeNodes(parent, index) {
        const leftChild = parent.children[index];
        const rightChild = parent.children[index + 1];
        
        if (leftChild.isLeaf) {
            leftChild.keys.push(...rightChild.keys);
            leftChild.next = rightChild.next;
        } else {
            leftChild.keys.push(parent.keys[index]);
            leftChild.keys.push(...rightChild.keys);
            leftChild.children.push(...rightChild.children);
        }
        
        parent.keys.splice(index, 1);
        parent.children.splice(index + 1, 1);
        
        this.log('info', `Fundiu nó [${leftChild.keys.join(', ')}] com irmão`);
    }

    getHeight(node = this.root) {
        if (node.isLeaf) return 1;
        return 1 + this.getHeight(node.children[0]);
    }

    countNodes(node = this.root) {
        if (!node) return 0;
        
        let count = 1;
        if (!node.isLeaf) {
            for (const child of node.children) {
                count += this.countNodes(child);
            }
        }
        return count;
    }

    countElements(node = this.root) {
        if (!node) return 0;
        
        let count = node.keys.length;
        if (!node.isLeaf) {
            for (const child of node.children) {
                count += this.countElements(child);
            }
        }
        return count;
    }

    getLeafSequence() {
        let sequence = [];
        let node = this.root;
        
        while (node && !node.isLeaf) {
            node = node.children[0];
        }
        
        while (node) {
            sequence.push(...node.keys);
            node = node.next;
        }
        
        return sequence;
    }

    updateDisplay() {
        if (typeof renderTree === 'function') {
            renderTree(this);
        }
        if (typeof updateHistoryDisplay === 'function') {
            updateHistoryDisplay(this);
        }
        if (typeof updateStats === 'function') {
            updateStats(this);
        }
        if (typeof updateLeafSequence === 'function') {
            updateLeafSequence(this);
        }
    }

    loadSampleData() {
        this.root = new BPlusTreeNode(true);
        this.history = [];
        
        const sampleData = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
        
        this.log('info', 'Carregando dados de exemplo...');
        
        sampleData.forEach(value => {
            this.insert(value);
        });
        
        this.log('info', 'Dados de exemplo carregados com sucesso!');
    }
}