import { expect } from 'chai';
import Ranking from '../src';


describe('ranking-find-single', function () {
  beforeEach(function () {
    this.ranking = new Ranking({ maxScore: 30, branchFactor: 3 });
  });

  describe('given an empty rank', function () {
    it('should return rank position equal to 0 for any score', function () {
      expect(this.ranking.findRankByScore(4)).to.eql(0);
      expect(this.ranking.findRankByScore(10)).to.eql(0);
      expect(this.ranking.findRankByScore(23)).to.eql(0);
    });
  });

  describe('given 1 existing player with score 4', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 4, playerId: 'jack' });
    });

    it('should have a rank position equal to 1', function () {
      expect(this.ranking.findRankByScore(4)).to.eql(1);
    });
  });

  describe('given 2 existing players with score 4', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 4, playerId: 'jack' });
      this.ranking.setScore({ score: 4, playerId: 'john' });
    });

    it('should both have a rank position equal to 1', function () {
      expect(this.ranking.findRankByScore(4)).to.eql(1);
    });
  });

  describe('given 2 existing players with score 4 and 1 with score 12', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 4, playerId: 'jack' });
      this.ranking.setScore({ score: 4, playerId: 'john' });
      this.ranking.setScore({ score: 12, playerId: 'jeff' });
    });

    it('players with score 4 should have a rank position equal to 2', function () {
      expect(this.ranking.findRankByScore(4)).to.eql(2);
    });

    it('player with score 12 should have a rank position equal to 1', function () {
      expect(this.ranking.findRankByScore(12)).to.eql(1);
    });
  });
});
