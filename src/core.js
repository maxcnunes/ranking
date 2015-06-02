const debug = require('./debug')('ranking');



export function findByScore({ node, initScore, maxScore, result, query, branchFactor }) {
  debug('');

  // node.range = [initScore, maxScore]; //debug

  debug('query.$limit [%o]', query.$limit);
  debug('initScore [%o]', initScore);
  debug('maxScore [%o]', maxScore);
  debug('query.score.$gte [%o]', query.score.$gte);
  debug('query.score.$lte [%o]', query.score.$lte);

  if (initScore > query.score.$lte) {
    result.position += node.amount;
    return;
  }

  if (maxScore < query.score.$gte) {
    return;
  }

  const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ maxScore, initScore, branchFactor });

  for (let i = amountBranches - 1;/*base 0*/ i >= 0; i--) {
  // for (let i = amountBranches - 1;/*base 0*/ i >= indexScore; i--) {
    debug('index loop [%o]', i);

    let xnode = node.children[i];

    if (result.list.length < query.$limit && xnode.amount > 0) {
      if (!xnode.playerIds) {
        const xinitScore = resolveInitScore({ initScore, indexScore: i, amountLeafsPerBranch });
        const xmaxScore = resolveMaxScore({ initScore: xinitScore, indexScore: i, amountLeafsPerBranch, amountBranches });

        findByScore({
          initScore: xinitScore,
          maxScore: xmaxScore,
          node: xnode,
          query,
          result,
          branchFactor
        });
      } else {
        debug('node.children[%o].amount [%o]', i, xnode.amount);
        for (let playerIdx = 0; playerIdx < xnode.amount; playerIdx++) {
          if (result.list.length < query.$limit) {
            result.position += 1;
            result.list.push({ position: result.position, score: xnode.score, playerId: xnode.playerIds[playerIdx] });
          }
        }
      }
    }
  }
  debug('node.children result [%o]', result);
}

export function findByPosition({ node, initScore, maxScore, result, query, branchFactor }) {
  debug('');

  // node.range = [initScore, maxScore]; //debug

  debug('query.$limit [%o]', query.$limit);
  debug('initScore [%o]', initScore);
  debug('maxScore [%o]', maxScore);
  debug('query.position.$gte [%o]', query.position.$gte);
  debug('query.position.$lte [%o]', query.position.$lte);
  debug('node.amount [%o]', node.amount);

  const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ maxScore, initScore, branchFactor });

  for (let i = amountBranches - 1;/*base 0*/ i >= 0; i--) {
    debug('index loop [%o]', i);

    let xnode = node.children[i];

    if (result.list.length < query.$limit && xnode.amount > 0) {
      if (!xnode.playerIds) {
        const xinitScore = resolveInitScore({ initScore, indexScore: i, amountLeafsPerBranch });
        const xmaxScore = resolveMaxScore({ initScore: xinitScore, indexScore: i, amountLeafsPerBranch, amountBranches });

        debug('xnode.amount [%o]', xnode.amount);
        debug('result.list.length [%o]', result.list.length);
        debug('result.position [%o]', result.position);
        debug('xnode.amount + result.position [%o]', xnode.amount + result.position);
        debug('enter if', (xnode.amount + result.position) > query.position.$lte &&
           (xnode.amount + result.position) < query.position.$gte &&
           (xnode.amount + result.list.length) < query.$limit);

        if ((xnode.amount + result.position) > query.position.$lte &&
           (xnode.amount + result.position) < query.position.$gte &&
           (xnode.amount + result.list.length) < query.$limit) {
          result.position += xnode.amount;
          continue;
        }

        findByPosition({
          initScore: xinitScore,
          maxScore: xmaxScore,
          node: xnode,
          query,
          result,
          branchFactor
        });
      } else {
        debug('node.children[%o].amount [%o]', i, xnode.amount);
        for (let playerIdx = 0; playerIdx < xnode.amount; playerIdx++) {
          result.position += 1;
          debug('position player [%o]', result.position);
          if (result.list.length < query.$limit && result.position >= query.position.$gte && result.position <= query.position.$lte) {
            result.list.push({ position: result.position, score: xnode.score, playerId: xnode.playerIds[playerIdx] });
          }
        }
      }
    }
  }
  // debug('node.children result [%o]', result);
}

export function setScore({ node, score, playerId, initScore, maxScore, branchFactor }) {
  debug('');
  debug('score [%o=%o]', playerId, score);

  // increases amount on current node before continue going deeper
  node.amount += 1;
  // node.range = [initScore, maxScore]; //debug

  debug('initScore [%o]', initScore);
  debug('maxScore [%o]', maxScore);

  const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ maxScore, initScore, branchFactor });
  const indexScore = resolveIndexScore({ score, initScore, amountLeafsPerBranch, amountBranches });

  initScore = resolveInitScore({ initScore, indexScore, amountLeafsPerBranch });
  maxScore = resolveMaxScore({ initScore, indexScore, amountLeafsPerBranch, amountBranches });

  // creates children list
  if (!node.children) {
    node.children = [];
    for (let i = 0; i < amountBranches; i++) {
      node.children.push({ amount: 0 });
    }
  }

  node = node.children[indexScore];

  // in case it is a non-leaf then continues going deeper
  if (initScore !== maxScore) {
    return setScore({
      score,
      playerId,
      initScore,
      maxScore,
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


function resolveBranchInfo ({ maxScore, initScore, branchFactor }) {
  const amountLeafsCurrentBranch = maxScore - initScore + 1;/*base 0*/
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


function resolveIndexScore ({ score, initScore, amountLeafsPerBranch, amountBranches }) {
  const indexScore = Math.floor((score - initScore) / Math.floor(amountLeafsPerBranch) % amountBranches);
  debug('indexScore [%o]', indexScore);
  return indexScore;
}


function resolveInitScore ({ initScore, indexScore, amountLeafsPerBranch }) {
  initScore = Math.floor(indexScore * amountLeafsPerBranch) + initScore;
  debug('initScore [%o]', initScore);
  return initScore;
}


function resolveMaxScore ({ initScore, indexScore, amountLeafsPerBranch, amountBranches }) {
  let maxScore = initScore + amountLeafsPerBranch - 1;/*base 0*/
  if (indexScore === (amountBranches - 1/*base 0*/)) {
    maxScore = Math.ceil(maxScore);
  } else {
    maxScore = Math.floor(maxScore);
  }
  debug('maxScore [%o]', maxScore);
  return maxScore;
}
