const debug = require('./debug')('ranking');

/**

  Nodes
  =============================================================
   {
      amount: 10,   // total number of playerIds
      children: [], // list of nodes  (only existing on non-leaf)
      playerIds: [] // users id       (only existing on leaf)
    }
 */
export default class Ranking {
  constructor ({ maxScore, branchFactor }) {
    this.maxScore = maxScore;
    this.branchFactor = branchFactor;
    this.tree = { amount: 0, children: null };
  }

  find(query) {
    debug('find');

    // rank is empty
    if (!this.tree.children) { return []; }

    let result = [];

    if (!query) { query = {}; }
    query.$limit = query.$limit || 10;

    if (query.position) {
      result = this._findByPosition(query);
    }
    else if (query.score) {
      result = this._findByScore(query);
    }

    return result;
  }

  findOne(query) {
    debug('findOne');

    if (!query) { query = {}; }
    query.$limit = 1;

    return this.find(query)[0];
  }

  _findByPosition(query) {
    debug('_findByPosition');

    prepareQueryByType(query, 'position');

    const result = { position: 0, list: [] };

    this._findRankBetween({
      limit: query.$limit || 10,
      initScore: 0,
      maxScore: this.maxScore - 1/*base 0*/,
      node: this.tree,
      qMinPosition: query.position.$gte,
      qMaxPosition: query.position.$lte,
      result
    });

    return result.list;
  }

  _findByScore(query) {
    debug('_findByScore');

    prepareQueryByType(query, 'score');

    const result = { position: 0, list: [] };

    this._findByScoreBetween({
      limit: query.$limit || 10,
      initScore: 0,
      maxScore: this.maxScore/*base 0*/,
      node: this.tree,
      qMinScore: (query.score.$gte - 1/*base 0*/) || 0,
      qMaxScore: (query.score.$lte || this.maxScore) - 1/*base 0*/,
      result
    });

    return result.list;
  }

  setScore({ score, playerId }) {
    debug('setScore');
    return this._setScore({
      score,
      playerId,
      initScore: 0,
      maxScore: this.maxScore - 1/*base 0*/,
      node: this.tree
    });
  }

  _findByScoreBetween({ node, limit, initScore, maxScore, result, qMinScore, qMaxScore }) {
    debug('');

    // node.range = [initScore, maxScore]; //debug

    debug('limit [%o]', limit);
    debug('initScore [%o]', initScore);
    debug('maxScore [%o]', maxScore);
    debug('qMinScore [%o]', qMinScore);
    debug('qMaxScore [%o]', qMaxScore);

    if (initScore > qMaxScore) {
      result.position += node.amount;
      return;
    }

    if (maxScore < qMinScore) {
      return;
    }

    const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ maxScore, initScore, branchFactor: this.branchFactor });

    for (let i = amountBranches - 1;/*base 0*/ i >= 0; i--) {
    // for (let i = amountBranches - 1;/*base 0*/ i >= indexScore; i--) {
      debug('index loop [%o]', i);

      let xnode = node.children[i];

      if (result.list.length < limit && xnode.amount > 0) {
        if (!xnode.playerIds) {
          const xinitScore = resolveInitScore({ initScore, indexScore: i, amountLeafsPerBranch });
          const xmaxScore = resolveMaxScore({ initScore: xinitScore, indexScore: i, amountLeafsPerBranch, amountBranches });

          this._findByScoreBetween({
            limit: limit,
            initScore: xinitScore,
            maxScore: xmaxScore,
            node: xnode,
            qMinScore,
            qMaxScore,
            result
          });
        } else {
          debug('node.children[%o].amount [%o]', i, xnode.amount);
          for (let playerIdx = 0; playerIdx < xnode.amount; playerIdx++) {
            if (result.list.length < limit) {
              result.position += 1;
              result.list.push({ position: result.position, score: xnode.score, playerId: xnode.playerIds[playerIdx] });
            }
          }
        }
      }
    }
    debug('node.children result [%o]', result);
  }

  _findRankBetween({ node, limit, initScore, maxScore, result, qMinPosition, qMaxPosition }) {
    debug('');

    // node.range = [initScore, maxScore]; //debug

    debug('limit [%o]', limit);
    debug('initScore [%o]', initScore);
    debug('maxScore [%o]', maxScore);
    debug('qMinPosition [%o]', qMinPosition);
    debug('qMaxPosition [%o]', qMaxPosition);
    debug('node.amount [%o]', node.amount);

    const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ maxScore, initScore, branchFactor: this.branchFactor });

    for (let i = amountBranches - 1;/*base 0*/ i >= 0; i--) {
      debug('index loop [%o]', i);

      let xnode = node.children[i];

      if (result.list.length < limit && xnode.amount > 0) {
        if (!xnode.playerIds) {
          const xinitScore = resolveInitScore({ initScore, indexScore: i, amountLeafsPerBranch });
          const xmaxScore = resolveMaxScore({ initScore: xinitScore, indexScore: i, amountLeafsPerBranch, amountBranches });

          debug('xnode.amount [%o]', xnode.amount);
          debug('result.list.length [%o]', result.list.length);
          debug('result.position [%o]', result.position);
          debug('xnode.amount + result.position [%o]', xnode.amount + result.position);
          debug('enter if', (xnode.amount + result.position) > qMaxPosition &&
             (xnode.amount + result.position) < qMinPosition &&
             (xnode.amount + result.list.length) < limit);

          if ((xnode.amount + result.position) > qMaxPosition &&
             (xnode.amount + result.position) < qMinPosition &&
             (xnode.amount + result.list.length) < limit) {
            result.position += xnode.amount;
            continue;
          }

          this._findRankBetween({
            limit: limit,
            initScore: xinitScore,
            maxScore: xmaxScore,
            node: xnode,
            qMinPosition,
            qMaxPosition,
            result
          });
        } else {
          debug('node.children[%o].amount [%o]', i, xnode.amount);
          for (let playerIdx = 0; playerIdx < xnode.amount; playerIdx++) {
            result.position += 1;
            debug('position player [%o]', result.position);
            if (result.list.length < limit && result.position >= qMinPosition && result.position <= qMaxPosition) {
              result.list.push({ position: result.position, score: xnode.score, playerId: xnode.playerIds[playerIdx] });
            }
          }
        }
      }
    }
    // debug('node.children result [%o]', result);
  }

  _setScore({ node, score, playerId, initScore, maxScore }) {
    debug('');
    debug('score [%o=%o]', playerId, score);

    // increases amount on current node before continue going deeper
    node.amount += 1;
    // node.range = [initScore, maxScore]; //debug

    debug('initScore [%o]', initScore);
    debug('maxScore [%o]', maxScore);

    const { amountLeafsPerBranch, amountBranches } = resolveBranchInfo({ maxScore, initScore, branchFactor: this.branchFactor });
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
      return this._setScore({
        score,
        playerId,
        initScore,
        maxScore,
        node
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


const REGEXP_NUMBER = /^-?\d+$/;

/**
 * prepares the query before searching in the ranking
 * it is possible to filter by a specific value or a range ($gte and $lte)
 */
function prepareQueryByType (query, field) {
  const value = REGEXP_NUMBER.test(query[field]) && query[field];
  query[field] = {
    $gte: value || query[field].$gte || 1,
    $lte: value || query[field].$lte || 100
  };
}
