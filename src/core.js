const debug = require('./debug')('ranking');



export function findByScore({ branchFactor, node, nodeRange, query, result }) {
  debug('');

  // node.range = [nodeRange.$gte, nodeRange.$lte]; //debug

  debug('query.$limit [%o]', query.$limit);
  debug('nodeRange.$gte [%o]', nodeRange.$gte);
  debug('nodeRange.$lte [%o]', nodeRange.$lte);
  debug('query.score.$gte [%o]', query.score.$gte);
  debug('query.score.$lte [%o]', query.score.$lte);

  if (nodeRange.$gte > query.score.$lte) {
    result.position += node.amount;
    return;
  }

  if (nodeRange.$lte < query.score.$gte) {
    return;
  }

  const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ nodeRange, branchFactor });

  for (let i = amountBranches - 1;/*base 0*/ i >= 0; i--) {
    debug('index loop [%o]', i);

    let currentNode = node.children[i];

    if (result.list.length < query.$limit && currentNode.amount > 0) {
      if (!currentNode.playerIds) {
        const nodeRange$gte = resolveInitScore({ nodeRange$gte: nodeRange.$gte, indexScore: i, amountLeafsPerBranch });
        const nodeRange$lte = resolveMaxScore({ nodeRange$gte, indexScore: i, amountLeafsPerBranch, amountBranches });

        findByScore({
          branchFactor,
          node: currentNode,
          nodeRange: {
            $gte: nodeRange$gte,
            $lte: nodeRange$lte
          },
          query,
          result
        });
      } else {
        debug('node.children[%o].amount [%o]', i, currentNode.amount);
        for (let playerIndex = 0; playerIndex < currentNode.amount; playerIndex++) {
          if (result.list.length < query.$limit) {
            result.position += 1;
            result.list.push({ position: result.position, score: currentNode.score, playerId: currentNode.playerIds[playerIndex] });
          }
        }
      }
    }
  }
  debug('node.children result [%o]', result);
}

export function findByPosition({ branchFactor, node, nodeRange, query, result }) {
  debug('');

  // node.range = [nodeRange.$gte, nodeRange.$lte]; //debug

  debug('query.$limit [%o]', query.$limit);
  debug('nodeRange.$gte [%o]', nodeRange.$gte);
  debug('nodeRange.$lte [%o]', nodeRange.$lte);
  debug('query.position.$gte [%o]', query.position.$gte);
  debug('query.position.$lte [%o]', query.position.$lte);
  debug('node.amount [%o]', node.amount);

  const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ nodeRange, branchFactor });

  for (let i = amountBranches - 1;/*base 0*/ i >= 0; i--) {
    debug('index loop [%o]', i);

    let currentNode = node.children[i];

    if (result.list.length > query.$limit) { return; }
    if (currentNode.amount <= 0) { continue; }

    if (!currentNode.playerIds) {
      const nodeRange$gte = resolveInitScore({ nodeRange$gte: nodeRange.$gte, indexScore: i, amountLeafsPerBranch });
      const nodeRange$lte = resolveMaxScore({ nodeRange$gte, indexScore: i, amountLeafsPerBranch, amountBranches });

      debug('currentNode.amount [%o]', currentNode.amount);
      debug('result.list.length [%o]', result.list.length);
      debug('result.position [%o]', result.position);
      debug('currentNode.amount + result.position [%o]', currentNode.amount + result.position);

      const passOverNode = (currentNode.amount + result.position) > query.position.$lte &&
         (currentNode.amount + result.position) < query.position.$gte &&
         (currentNode.amount + result.list.length) < query.$limit;
      debug('passOverNode', passOverNode);

      if (passOverNode) {
        result.position += currentNode.amount;
        continue;
      }

      findByPosition({
        branchFactor,
        node: currentNode,
        nodeRange: {
          $gte: nodeRange$gte,
          $lte: nodeRange$lte
        },
        query,
        result
      });
    } else {
      debug('node.children[%o].amount [%o]', i, currentNode.amount);
      for (let playerIndex = 0; playerIndex < currentNode.amount; playerIndex++) {
        result.position += 1;
        debug('position player [%o]', result.position);
        if (result.list.length < query.$limit && result.position >= query.position.$gte && result.position <= query.position.$lte) {
          result.list.push({ position: result.position, score: currentNode.score, playerId: currentNode.playerIds[playerIndex] });
        }
      }
    }
  }
}

export function setScore({ branchFactor, node, score, playerId, nodeRange }) {
  debug('');
  debug('score [%o=%o]', playerId, score);

  // increases amount on current node before continue going deeper
  node.amount += 1;
  // node.range = [nodeRange.$gte, nodeRange.$lte]; //debug

  debug('nodeRange.$gte [%o]', nodeRange.$gte);
  debug('nodeRange.$lte [%o]', nodeRange.$lte);

  const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ nodeRange, branchFactor });
  const indexScore = resolveIndexScore({ score, nodeRange$gte: nodeRange.$gte, amountLeafsPerBranch, amountBranches });

  nodeRange.$gte = resolveInitScore({ nodeRange$gte: nodeRange.$gte, indexScore, amountLeafsPerBranch });
  nodeRange.$lte = resolveMaxScore({ nodeRange$gte: nodeRange.$gte, indexScore, amountLeafsPerBranch, amountBranches });

  // creates children list
  if (!node.children) {
    node.children = [];
    for (let i = 0; i < amountBranches; i++) {
      node.children.push({ amount: 0 });
    }
  }

  node = node.children[indexScore];

  // in case it is a non-leaf then continues going deeper
  if (nodeRange.$gte !== nodeRange.$lte) {
    return setScore({
      score,
      playerId,
      nodeRange,
      node,
      branchFactor
    });
  }

  /*
    LEAF
   */

  if (!node.playerIds) { node.playerIds = []; }

  if (!~node.playerIds.indexOf(playerId)) {
    node.amount += 1;
    node.score = score; //debug
    node.playerIds.push(playerId);
  }
}


function resolveBranchInfo ({ nodeRange, branchFactor }) {
  const amountLeafsCurrentBranch = nodeRange.$lte - nodeRange.$gte + 1;/*base 0*/
  let amountBranches = branchFactor;

  let amountLeafsPerBranch = (amountLeafsCurrentBranch) / branchFactor;
  if (amountLeafsPerBranch < 1) {
    amountLeafsPerBranch = 1;
    amountBranches = amountLeafsCurrentBranch;
  }

  debug('amountLeafsPerBranch [%o]', amountLeafsPerBranch);
  debug('amountBranches [%o]', amountBranches);

  return { amountLeafsPerBranch, amountBranches };
}


function resolveIndexScore ({ score, nodeRange$gte, amountLeafsPerBranch, amountBranches }) {
  const indexScore = Math.floor((score - nodeRange$gte) / Math.floor(amountLeafsPerBranch) % amountBranches);
  debug('indexScore [%o]', indexScore);
  return indexScore;
}


function resolveInitScore ({ nodeRange$gte, indexScore, amountLeafsPerBranch }) {
  nodeRange$gte = Math.floor(indexScore * amountLeafsPerBranch) + nodeRange$gte;
  debug('nodeRange$gte [%o]', nodeRange$gte);
  return nodeRange$gte;
}


function resolveMaxScore ({ nodeRange$gte, indexScore, amountLeafsPerBranch, amountBranches }) {
  let nodeRange$lte = nodeRange$gte + amountLeafsPerBranch - 1;/*base 0*/
  if (indexScore === (amountBranches - 1/*base 0*/)) {
    nodeRange$lte = Math.ceil(nodeRange$lte);
  } else {
    nodeRange$lte = Math.floor(nodeRange$lte);
  }
  debug('nodeRange$lte [%o]', nodeRange$lte);
  return nodeRange$lte;
}
