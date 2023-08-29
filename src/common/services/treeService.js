import _ from 'lodash';

const parseTree = tree => {
    if (tree instanceof Array) {
        if (tree.length === 1) return tree[0];
        return { name: 'Document', children: tree };
    }
    return tree;
};

const cleanArray = arr => {
    if (arr.some(el => _.isNil(el))) {
        arr = arr.filter(el => !_.isNil(el));
        return arr.length ? arr : [];
    }
    return arr;
};

const cleanTree = node => {
    if (_.isNil(node)) return null;
    if (_.isNil(node.children)) {
        if (node.hasOwnProperty('name')) return node;
        return null;
    }

    if (!(node.children instanceof Array)) node.children = [cleanTree(node.children)];
    else {
        for (let index = 0; index < node.children.length; index++) {
            node.children[index] = cleanTree(node.children[index]);
        }
    }
    node.children = cleanArray(node.children);
    return node;
};

const setTreeIds = (node, id = '0') => {
    if (_.isNil(node)) return null;
    node.id = id;
    if (!node?.children.length) {
        node.final = true;
        return node;
    }
    if (!(node.children instanceof Array)) node.children = [setTreeIds(node.children, `${id}:${0}`)];
    else {
        for (let index = 0; index < node.children.length; index++) {
            node.children[index] = setTreeIds(node.children[index], `${id}:${index}`);
        }
    }
    return node;
};

const getTreeIds = (node, ids = []) => {
    if (_.isNil(node)) return ids;
    if (!node.hasOwnProperty('final')) ids.push(node.id);
    if (_.isNil(node.children)) return ids;
    if (!(node.children instanceof Array)) ids.push(node.children.id);
    else
        for (let index = 0; index < node.children.length; index++) {
            getTreeIds(node.children[index], ids);
        }
    return ids;
};

const setRulesTreeIds = rules => {
    const TREE = 'StructTreeRoot[0]';
    return rules.map(({ checks }) => {
        return checks.map(check => {
            if (check.context.includes(TREE)) {
                const treeId = check.context
                    .split(TREE)[1]
                    .match(/\[\d+\]/g)
                    .join('')
                    .replaceAll('][', ':')
                    .slice(1, -1);
                return { ...check, treeId: treeId };
            }
            return { ...check, treeId: null };
        });
    });
};

const findNode = (arr, id) => {
    for (let ruleIndex = 0; ruleIndex < arr.length; ruleIndex++) {
        const ruleArr = arr[ruleIndex];
        for (let checkIndex = 0; checkIndex < ruleArr.length; checkIndex++) {
            const checkArr = ruleArr[checkIndex];
            if (checkArr.treeId === `${id}:0` || checkArr.treeId === id) {
                return [ruleIndex, checkIndex];
            }
        }
    }
    return [null, null];
};

export { parseTree, cleanTree, getTreeIds, setTreeIds, setRulesTreeIds, findNode };
