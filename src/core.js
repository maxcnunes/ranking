const debug = require('./debug')('ranking');


export function findByScore({ branchFactor, node, nodeScoreRange, query, result }) {
  debug('');
  debug('query.$limit [%o]', query.$limit);
  debug('nodeScoreRange.beginAt [%o]', nodeScoreRange.beginAt);
  debug('nodeScoreRange.endAt [%o]', nodeScoreRange.endAt);
  debug('query.score.$gte [%o]', query.score.$gte);
  debug('query.score.$lte [%o]', query.score.$lte);

  if (nodeScoreRange.beginAt > query.score.$lte) {
    result.position += node.amount;
    return;
  }

  if (nodeScoreRange.endAt < query.score.$gte) {
    return;
  }

  const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ nodeScoreRange, branchFactor });

  for (let i = amountBranches - 1;/*base 0*/ i >= 0; i--) {
    debug('index loop [%o]', i);

    let currentNode = node.children[i];

    if (result.list.length < query.$limit && currentNode.amount > 0) {
      if (!currentNode.playerIds) {
        const nodeScoreRangeBeginAt = resolveInitScore({ nodeScoreRangeBeginAt: nodeScoreRange.beginAt, indexScore: i, amountLeafsPerBranch });
        const nodeScoreRange$lte = resolveMaxScore({ nodeScoreRangeBeginAt, indexScore: i, amountLeafsPerBranch, amountBranches });

        findByScore({
          branchFactor,
          node: currentNode,
          nodeScoreRange: {
            beginAt: nodeScoreRangeBeginAt,
            endAt: nodeScoreRange$lte
          },
          query,
          result
        });
      } else {
        for (let playerIndex = 0; playerIndex < currentNode.amount; playerIndex++) {
          debug('node.children[%o].amount [%o]', i, currentNode.amount);
          debug('node.children[%o].score [%o]', i, currentNode.score);
          debug('node.children[%o].playerIds [%o]', i, currentNode.playerIds);
          result.position += 1;
          if (result.list.length < query.$limit && currentNode.score >= query.score.$gte && currentNode.score <= query.score.$lte) {
            const playerId = currentNode.playerIds[playerIndex];
            if (!query.playerId || (playerId >= query.playerId.$gte && playerId <= query.playerId.$lte)) {
              result.list.push({ position: result.position, score: currentNode.score, playerId: playerId });
            }
          }
        }
      }
    }
  }
  debug('node.children result [%o]', result);
}

export function findByPosition({ branchFactor, node, nodeScoreRange, query, result }) {
  debug('');
  debug('query.$limit [%o]', query.$limit);
  debug('nodeScoreRange.beginAt [%o]', nodeScoreRange.beginAt);
  debug('nodeScoreRange.endAt [%o]', nodeScoreRange.endAt);
  debug('query.position.$gte [%o]', query.position.$gte);
  debug('query.position.$lte [%o]', query.position.$lte);
  debug('node.amount [%o]', node.amount);

  const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ nodeScoreRange, branchFactor });

  for (let i = amountBranches - 1;/*base 0*/ i >= 0; i--) {
    debug('index loop [%o]', i);

    let currentNode = node.children[i];

    if (result.list.length > query.$limit) { return; }
    if (currentNode.amount <= 0) { continue; }

    if (!currentNode.playerIds) {
      const nodeScoreRangeBeginAt = resolveInitScore({ nodeScoreRangeBeginAt: nodeScoreRange.beginAt, indexScore: i, amountLeafsPerBranch });
      const nodeScoreRange$lte = resolveMaxScore({ nodeScoreRangeBeginAt, indexScore: i, amountLeafsPerBranch, amountBranches });

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
        nodeScoreRange: {
          beginAt: nodeScoreRangeBeginAt,
          endAt: nodeScoreRange$lte
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
          const playerId = currentNode.playerIds[playerIndex];
          if (!query.playerId || (playerId >= query.playerId.$gte && playerId <= query.playerId.$lte)) {
            result.list.push({ position: result.position, score: currentNode.score, playerId: playerId });
          }
        }
      }
    }
  }
}

export function setScore({ branchFactor, node, score, playerId, nodeScoreRange }) {
  debug('');
  debug('score [%o=%o]', playerId, score);

  // node.rangeIndex = [nodeScoreRange.beginAt, nodeScoreRange.endAt]; //debug
  // node.rangeScore = [nodeScoreRange.beginAt + 1, nodeScoreRange.endAt + 1]; //debug

  // increases amount on current node before continue going deeper
  node.amount += 1;

  debug('nodeScoreRange.beginAt [%o]', nodeScoreRange.beginAt);
  debug('nodeScoreRange.endAt [%o]', nodeScoreRange.endAt);

  const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ nodeScoreRange, branchFactor });
  const indexScore = resolveIndexScore({ score, nodeScoreRangeBeginAt: nodeScoreRange.beginAt, amountLeafsPerBranch, amountBranches });

  nodeScoreRange.beginAt = resolveInitScore({ nodeScoreRangeBeginAt: nodeScoreRange.beginAt, indexScore, amountLeafsPerBranch });
  nodeScoreRange.endAt = resolveMaxScore({ nodeScoreRangeBeginAt: nodeScoreRange.beginAt, indexScore, amountLeafsPerBranch, amountBranches });

  // creates children list
  if (!node.children) {
    node.children = [];
    for (let i = 0; i < amountBranches; i++) {
      node.children.push({ amount: 0 });
    }
  }

  let totalHigherPositions = 0;
  for (let i = amountBranches - 1;/*base 0*/ i > indexScore; i--) {
    totalHigherPositions += node.children[i].amount;
  }

  node = node.children[indexScore];

  // in case it is a non-leaf then continues going deeper
  if (nodeScoreRange.beginAt !== nodeScoreRange.endAt) {
    return totalHigherPositions + setScore({
      score,
      playerId,
      nodeScoreRange,
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
    return totalHigherPositions + node.amount;
  }
}


function resolveBranchInfo ({ nodeScoreRange, branchFactor }) {
  const amountLeafsCurrentBranch = nodeScoreRange.endAt - nodeScoreRange.beginAt + 1;/*base 0*/
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


function resolveIndexScore ({ score, nodeScoreRangeBeginAt, amountLeafsPerBranch, amountBranches }) {
  nodeScoreRangeBeginAt = Math.floor(score - nodeScoreRangeBeginAt);
  amountLeafsPerBranch = Math.floor(amountLeafsPerBranch);


  let indexScore;
  if ((nodeScoreRangeBeginAt / amountLeafsPerBranch) >= amountBranches) {
    indexScore = Math.floor(amountBranches - 1);
  } else {
    indexScore = Math.floor(nodeScoreRangeBeginAt / amountLeafsPerBranch % amountBranches);
  }

  debug('indexScore [%o]', indexScore);
  return indexScore;
}


function resolveInitScore ({ nodeScoreRangeBeginAt, indexScore, amountLeafsPerBranch }) {
  nodeScoreRangeBeginAt = Math.floor(indexScore * amountLeafsPerBranch) + nodeScoreRangeBeginAt;
  debug('nodeScoreRangeBeginAt [%o]', nodeScoreRangeBeginAt);
  return nodeScoreRangeBeginAt;
}


function resolveMaxScore ({ nodeScoreRangeBeginAt, indexScore, amountLeafsPerBranch, amountBranches }) {
  let nodeScoreRange$lte = nodeScoreRangeBeginAt + amountLeafsPerBranch - 1;/*base 0*/
  if (indexScore === (amountBranches - 1/*base 0*/)) {
    nodeScoreRange$lte = Math.ceil(nodeScoreRange$lte);
  } else {
    nodeScoreRange$lte = Math.floor(nodeScoreRange$lte);
  }
  debug('nodeScoreRange$lte [%o]', nodeScoreRange$lte);
  return nodeScoreRange$lte;
}
