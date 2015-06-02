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

  _findByPosition(query) {
    debug('_findByPosition');

    prepareQueryByType(query, 'position');

    const result = { position: 0, list: [] };

    findByPosition({
      branchFactor: this.branchFactor,
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

    findByScore({
      branchFactor: this.branchFactor,
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
