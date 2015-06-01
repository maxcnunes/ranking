import { expect } from 'chai';
import Ranking from '../src';


describe('ranking-find-by-position-paging', function () {
  beforeEach(function () {
    this.ranking = new Ranking({ maxScore: 30, branchFactor: 3 });
  });

  describe('given an empty rank', function () {
    it('should return empty', function () {
      expect(this.ranking.findRankBetween(1, 10, 10)).to.eql([]);
    });
  });

  describe('given 1 existing player with score 5', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 5, playerId: 'jack' });
    });

    it('should return only one rank position in the list result', function () {
      var result = this.ranking.findRankBetween(1, 30, 10);
      expect(result).to.eql([
        { position: 1, score: 5, playerId: 'jack' }
      ]);
    });
  });

  describe('given 1 existing player with score 28', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 28, playerId: 'jack' });
    });

    it('should return only one rank position in the list result', function () {
      var result = this.ranking.findRankBetween(1, 30, 10);
      expect(result).to.eql([
        { position: 1, score: 28, playerId: 'jack' }
      ]);
    });
  });

  describe('given 37 existing players', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 1, playerId: 'player-001' });
      this.ranking.setScore({ score: 2, playerId: 'player-002' });
      // this.ranking.setScore({ score: 3, playerId: 'player-0' });
      this.ranking.setScore({ score: 4, playerId: 'player-003' });
      // this.ranking.setScore({ score: 5, playerId: 'player-0' });
      this.ranking.setScore({ score: 6, playerId: 'player-004' });
      this.ranking.setScore({ score: 6, playerId: 'player-005' });
      this.ranking.setScore({ score: 6, playerId: 'player-006' });
      // this.ranking.setScore({ score: 7, playerId: 'player-0' });
      this.ranking.setScore({ score: 8, playerId: 'player-007' });
      this.ranking.setScore({ score: 8, playerId: 'player-008' });
      this.ranking.setScore({ score: 9, playerId: 'player-009' });
      this.ranking.setScore({ score: 9, playerId: 'player-010' });
      this.ranking.setScore({ score: 10, playerId: 'player-011' });
      this.ranking.setScore({ score: 10, playerId: 'player-012' });
      this.ranking.setScore({ score: 10, playerId: 'player-013' });
      // this.ranking.setScore({ score: 11, playerId: 'player-0' });
      this.ranking.setScore({ score: 12, playerId: 'player-014' });
      this.ranking.setScore({ score: 13, playerId: 'player-015' });
      this.ranking.setScore({ score: 13, playerId: 'player-016' });
      this.ranking.setScore({ score: 14, playerId: 'player-017' });
      this.ranking.setScore({ score: 14, playerId: 'player-018' });
      this.ranking.setScore({ score: 14, playerId: 'player-019' });
      this.ranking.setScore({ score: 15, playerId: 'player-020' });
      this.ranking.setScore({ score: 16, playerId: 'player-021' });
      this.ranking.setScore({ score: 16, playerId: 'player-022' });
      this.ranking.setScore({ score: 17, playerId: 'player-023' });
      // this.ranking.setScore({ score: 18, playerId: 'player-0' });
      // this.ranking.setScore({ score: 19, playerId: 'player-0' });
      this.ranking.setScore({ score: 20, playerId: 'player-024' });
      this.ranking.setScore({ score: 21, playerId: 'player-025' });
      this.ranking.setScore({ score: 22, playerId: 'player-026' });
      this.ranking.setScore({ score: 23, playerId: 'player-027' });
      this.ranking.setScore({ score: 23, playerId: 'player-028' });
      // this.ranking.setScore({ score: 24, playerId: 'player-0' });
      this.ranking.setScore({ score: 25, playerId: 'player-029' });
      this.ranking.setScore({ score: 26, playerId: 'player-030' });
      this.ranking.setScore({ score: 27, playerId: 'player-031' });
      this.ranking.setScore({ score: 27, playerId: 'player-032' });
      this.ranking.setScore({ score: 27, playerId: 'player-033' });
      this.ranking.setScore({ score: 28, playerId: 'player-034' });
      this.ranking.setScore({ score: 28, playerId: 'player-035' });
      this.ranking.setScore({ score: 28, playerId: 'player-036' });
      this.ranking.setScore({ score: 28, playerId: 'player-037' });
      // this.ranking.setScore({ score: 29, playerId: 'player-0' });
      // this.ranking.setScore({ score: 30, playerId: 'player-0' });
    });

    it('should be able to filter only the top 10 players', function () {
      var result = this.ranking.findRankBetween(1, 10, 10);
      expect(result).to.eql([
        { position: 1, score: 28, playerId: 'player-034' },
        { position: 2, score: 28, playerId: 'player-035' },
        { position: 3, score: 28, playerId: 'player-036' },
        { position: 4, score: 28, playerId: 'player-037' },
        { position: 5, score: 27, playerId: 'player-031' },
        { position: 6, score: 27, playerId: 'player-032' },
        { position: 7, score: 27, playerId: 'player-033' },
        { position: 8, score: 26, playerId: 'player-030' },
        { position: 9, score: 25, playerId: 'player-029' },
        { position: 10, score: 23, playerId: 'player-027' }
      ]);
    });

    it('should be able to discover who is at position 9', function () {
      var result = this.ranking.findRank(9);
      expect(result).to.eql({ position: 9, score: 25, playerId: 'player-029' });
    });
  });
});
