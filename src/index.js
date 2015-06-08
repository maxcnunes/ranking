import { findByScore, findByPosition, setScore, removePlayerScore } from './core';

const debug = require('./debug')('ranking');
const REGEXP_POSITIVE_NUMBER = /^\d+$/;
const REGEXP_NUMBER = /^-?\d+$/;

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
    this.players = {};
  }

  find(query) {
    debug('find');

    // rank is empty
    if (!this.tree.children) { return []; }

    const result = { position: 0, list: [] };

    if (!query) { query = {}; }
    query.$limit = query.$limit || 10;

    prepareQueryByRange(query, 'playerId');
    prepareQueryByRange(query, 'position');
    prepareQueryByRange(query, 'score');

    if (query.position) {
      findByPosition({
        branchFactor: this.branchFactor,
        node: this.tree,
        nodeScoreRange: {
          beginAt: 0,
          endAt: this.maxScore - 1/*base 0*/
        },
        query: query,
        result
      });
    }
    else if (query.score) {
      query.score.$gte = query.score.$gte;/*base 0*/
      query.score.$lte = (query.score.$lte || this.maxScore - 1/*base 0*/);

      findByScore({
        branchFactor: this.branchFactor,
        node: this.tree,
        nodeScoreRange: {
          beginAt: 0,
          endAt: this.maxScore/*base 0*/
        },
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

  // TODO NEXT BREAKING CHANGES:
  // change setScore to return the same result schema of addPlayerPoints { position, score, playerId }
  setScore({ score, playerId }) {
    debug('setScore');

    if (!REGEXP_POSITIVE_NUMBER.test(playerId)) { throw new Error('playerId must be a number'); }

    if (this.players[playerId]) {
      debug('removing player score');
      removePlayerScore({
        branchFactor: this.branchFactor,
        score: this.players[playerId],
        playerId,
        players: this.players,
        node: this.tree,
        nodeScoreRange: {
          beginAt: 0,
          endAt: this.maxScore - 1/*base 0*/
        }
      });
    }

    debug('setting new player score');
    return setScore({
      branchFactor: this.branchFactor,
      score,
      playerId,
      players: this.players,
      node: this.tree,
      nodeScoreRange: {
        beginAt: 0,
        endAt: this.maxScore - 1/*base 0*/
      }
    });
  }

  addPlayerPoints({ points, playerId }) {
    debug('addPlayerScore');

    const newScore = (this.players[playerId] || 0) + points;

    const newPosition = this.setScore({ score: newScore, playerId });

    return {
      position: newPosition,
      score: newScore,
      playerId: playerId
    };
  }
}


/**
 * prepares the query before searching in the ranking
 * it is possible to filter by a specific value or a range ($gte and $lte)
 */
function prepareQueryByRange (query, field) {
  if (!query[field]) { return; }

  const value = REGEXP_NUMBER.test(query[field]) && query[field];
  query[field] = {
    $gte: value || query[field].$gte || 1,
    $lte: value || query[field].$lte || 100
  };
}
