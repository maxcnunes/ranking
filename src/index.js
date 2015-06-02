import { findByScore, findByPosition, setScore } from './core';

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

    const result = { position: 0, list: [] };

    if (!query) { query = {}; }
    query.$limit = query.$limit || 10;

    if (query.position) {
      prepareQueryByRange(query, 'position');
      findByPosition({
        branchFactor: this.branchFactor,
        initScore: 0,
        maxScore: this.maxScore - 1/*base 0*/,
        node: this.tree,
        query: query,
        result
      });
    }
    else if (query.score) {
      prepareQueryByRange(query, 'score');

      query.score.$gte = query.score.$gte - 1;/*base 0*/
      query.score.$lte = (query.score.$lte || this.maxScore) - 1;/*base 0*/

      findByScore({
        branchFactor: this.branchFactor,
        initScore: 0,
        maxScore: this.maxScore/*base 0*/,
        node: this.tree,
        query: query,
        result
      });
    }

    return result.list;
  }

  findOne(query) {
    debug('findOne');

    if (!query) { query = {}; }
    query.$limit = 1;

    return this.find(query)[0];
  }

  setScore({ score, playerId }) {
    debug('setScore');
    return setScore({
      branchFactor: this.branchFactor,
      score,
      playerId,
      initScore: 0,
      maxScore: this.maxScore - 1/*base 0*/,
      node: this.tree
    });
  }
}


/**
 * prepares the query before searching in the ranking
 * it is possible to filter by a specific value or a range ($gte and $lte)
 */
const REGEXP_NUMBER = /^-?\d+$/;
function prepareQueryByRange (query, field) {
  const value = REGEXP_NUMBER.test(query[field]) && query[field];
  query[field] = {
    $gte: value || query[field].$gte || 1,
    $lte: value || query[field].$lte || 100
  };
}
