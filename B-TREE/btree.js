class BTreeNode {
    constructor(t, leaf = true) {
        this.t = t;
        this.keys = [];
        this.children = [];
        this.leaf = leaf;
    }
}

class BTree {
    constructor(t = 3) {
        this.t = t;
        this.root = new BTreeNode(t, true);
        this.history = [];
    }

    log(msg) {
        this.history.push(msg);
        const div = document.getElementById("historyLog");
        div.innerHTML += `<div class="history-entry">• ${msg}</div>`;
        div.scrollTop = div.scrollHeight;
    }

    search(key, node = this.root) {
        let i = 0;
        while (i < node.keys.length && key > node.keys[i]) {
            i++;
        }
        
        if (i < node.keys.length && key === node.keys[i]) {
            return true;
        }
        
        if (node.leaf) {
            return false;
        }
        
        return this.search(key, node.children[i]);
    }

    insert(key) {
        if (this.search(key)) {
            this.log(`Letra '${key}' já existe na árvore!`);
            return false;
        }

        this.log(`Inserindo '${key}'...`);
        const root = this.root;
        
        if (root.keys.length === 2 * this.t - 1) {
            this.log(`Raiz cheia (${root.keys.join(',')}), criando nova raiz...`);
            const newRoot = new BTreeNode(this.t, false);
            newRoot.children.push(this.root);
            this.root = newRoot;
            this.splitChild(newRoot, 0);
        }
        
        this.insertNonFull(this.root, key);
        return true;
    }

    insertNonFull(node, key) {
        let i = node.keys.length - 1;
        
        if (node.leaf) {
            while (i >= 0 && key < node.keys[i]) {
                i--;
            }
            node.keys.splice(i + 1, 0, key);
            this.log(`Inseriu '${key}' no nó folha: [${node.keys.join(',')}]`);
        } else {
            while (i >= 0 && key < node.keys[i]) {
                i--;
            }
            i++;
            
            this.log(`Descendo para filho ${i} do nó [${node.keys.join(',')}]`);
            
            if (node.children[i].keys.length === 2 * this.t - 1) {
                this.log(`Filho [${node.children[i].keys.join(',')}] está cheio, dividindo...`);
                this.splitChild(node, i);
                if (key > node.keys[i]) {
                    i++;
                }
            }
            
            this.insertNonFull(node.children[i], key);
        }
    }

    splitChild(parent, i) {
        const t = this.t;
        const fullChild = parent.children[i];
        const newChild = new BTreeNode(t, fullChild.leaf);
        
        const midIndex = t - 1;
        const median = fullChild.keys[midIndex];
        
        this.log(`Dividindo nó [${fullChild.keys.join(',')}], mediana: '${median}'`);
        
        newChild.keys = fullChild.keys.splice(midIndex + 1);
        fullChild.keys.splice(midIndex);
        
        if (!fullChild.leaf) {
            newChild.children = fullChild.children.splice(midIndex + 1);
        }
        
        parent.keys.splice(i, 0, median);
        parent.children.splice(i + 1, 0, newChild);
        
        this.log(`Após divisão:`);
        this.log(`- Pai: [${parent.keys.join(',')}]`);
        this.log(`- Filho esquerdo: [${fullChild.keys.join(',')}]`);
        this.log(`- Filho direito: [${newChild.keys.join(',')}]`);
    }

    delete(key) {
        if (!this.search(key)) {
            this.log(`Letra '${key}' não encontrada na árvore!`);
            return false;
        }

        this.log(`Tentando excluir '${key}'...`);
        this.deleteFromNode(this.root, key);
        
        if (this.root.keys.length === 0 && !this.root.leaf) {
            this.log(`Raiz ficou vazia, abaixando árvore...`);
            this.root = this.root.children[0];
        }
        return true;
    }

    deleteFromNode(node, key) {
        const t = this.t;
        const minKeys = t - 1;

        let idx = node.keys.indexOf(key);
        if (idx !== -1) {
            if (node.leaf) {
                node.keys.splice(idx, 1);
                this.log(`Removeu '${key}' do nó folha: [${node.keys.join(',')}]`);
            } else {
                this.deleteInternalNode(node, idx);
            }
            return;
        }

        if (node.leaf) {
            return;
        }

        let childIndex = 0;
        while (childIndex < node.keys.length && key > node.keys[childIndex]) {
            childIndex++;
        }

        if (node.children[childIndex].keys.length === minKeys) {
            this.fillChild(node, childIndex);
            
            if (childIndex > node.keys.length) {
                childIndex--;
            }
        }

        this.deleteFromNode(node.children[childIndex], key);
    }

    deleteInternalNode(node, idx) {
        const t = this.t;
        const minKeys = t - 1;

        if (node.children[idx].keys.length >= t) {
            const predecessor = this.getPredecessor(node.children[idx]);
            node.keys[idx] = predecessor;
            this.deleteFromNode(node.children[idx], predecessor);
        }
        else if (node.children[idx + 1].keys.length >= t) {
            const successor = this.getSuccessor(node.children[idx + 1]);
            node.keys[idx] = successor;
            this.deleteFromNode(node.children[idx + 1], successor);
        }
        else {
            this.mergeNodes(node, idx);
            this.deleteFromNode(node.children[idx], node.keys[idx]);
        }
    }

    fillChild(parent, idx) {
        const t = this.t;
        const minKeys = t - 1;

        if (idx > 0 && parent.children[idx - 1].keys.length > minKeys) {
            this.borrowFromLeft(parent, idx);
        }
        else if (idx < parent.children.length - 1 && parent.children[idx + 1].keys.length > minKeys) {
            this.borrowFromRight(parent, idx);
        }
        else {
            if (idx > 0) {
                this.mergeNodes(parent, idx - 1);
            } else {
                this.mergeNodes(parent, idx);
            }
        }
    }

    borrowFromLeft(parent, idx) {
        const child = parent.children[idx];
        const leftSibling = parent.children[idx - 1];

        child.keys.unshift(parent.keys[idx - 1]);
        parent.keys[idx - 1] = leftSibling.keys.pop();

        if (!child.leaf) {
            child.children.unshift(leftSibling.children.pop());
        }

        this.log(`Pegou chave emprestada do irmão esquerdo`);
    }

    borrowFromRight(parent, idx) {
        const child = parent.children[idx];
        const rightSibling = parent.children[idx + 1];

        child.keys.push(parent.keys[idx]);
        parent.keys[idx] = rightSibling.keys.shift();

        if (!child.leaf) {
            child.children.push(rightSibling.children.shift());
        }

        this.log(`Pegou chave emprestada do irmão direito`);
    }

    mergeNodes(parent, idx) {
        const leftChild = parent.children[idx];
        const rightChild = parent.children[idx + 1];

        leftChild.keys.push(parent.keys[idx]);
        leftChild.keys.push(...rightChild.keys);

        if (!leftChild.leaf) {
            leftChild.children.push(...rightChild.children);
        }

        parent.keys.splice(idx, 1);
        parent.children.splice(idx + 1, 1);

        this.log(`Fundiu nó [${leftChild.keys.join(',')}] com irmão`);
    }

    getPredecessor(node) {
        while (!node.leaf) {
            node = node.children[node.children.length - 1];
        }
        return node.keys[node.keys.length - 1];
    }

    getSuccessor(node) {
        while (!node.leaf) {
            node = node.children[0];
        }
        return node.keys[0];
    }

    createInitialStructure() {
        this.root = new BTreeNode(this.t, false);
        this.history = [];
        
        this.root.keys = ['G', 'M', 'P', 'X'];
        this.root.leaf = false;
        
        const child1 = new BTreeNode(this.t, true);
        child1.keys = ['A', 'C', 'D', 'E'];
        
        const child2 = new BTreeNode(this.t, true);
        child2.keys = ['J', 'K'];
        
        const child3 = new BTreeNode(this.t, true);
        child3.keys = ['N', 'O'];
        
        const child4 = new BTreeNode(this.t, true);
        child4.keys = ['R', 'S', 'T', 'U', 'V'];
        
        const child5 = new BTreeNode(this.t, true);
        child5.keys = ['Y', 'Z'];
        
        this.root.children = [child1, child2, child3, child4, child5];
        
        this.log('Árvore inicial carregada');
    }
}