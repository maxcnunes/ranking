import { expect } from 'chai';
import Ranking from '../src';


describe('ranking-find-by-score-paging', function () {
  beforeEach(function () {
    this.ranking = new Ranking({ maxScore: 30, branchFactor: 3 });
  });

  describe('given an empty rank', function () {
    it('should return empty', function () {
      expect(this.ranking.find({ score: { $gte: 1, $lte: 10 }, $limit: 10 })).to.eql([]);
    });
  });

  describe('given 1 existing player with score 5', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 5, playerId: 15 });
    });

    it('should return only one rank position in the list result', function () {
      var result = this.ranking.find({ score: { $gte: 1, $lte: 30 }, $limit: 10 });
      expect(result).to.eql([
        { position: 1, score: 5, playerId: 15 }
      ]);
    });
  });

  describe('given 1 existing player with score 28', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 28, playerId: 15 });
    });

    it('should return only one rank position in the list result', function () {
      var result = this.ranking.find({ score: { $gte: 1, $lte: 30 }, $limit: 10 });
      expect(result).to.eql([
        { position: 1, score: 28, playerId: 15 }
      ]);
    });
  });

  describe('given 2 existing players with score 4 and other 2 with score 24', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 4, playerId: 1 });
      this.ranking.setScore({ score: 4, playerId: 2 });
      this.ranking.setScore({ score: 24, playerId: 3 });
      this.ranking.setScore({ score: 24, playerId: 4 });
    });

    describe('on searching for all scores less than 10', function () {
      it('should return only those 2 with score 4', function () {
        var result = this.ranking.find({ score: { $lte: 10 }, $limit: 10 });
        expect(result).to.eql([
          { position: 3, score: 4, playerId: 1 },
          { position: 4, score: 4, playerId: 2 }
        ]);
      });
    });

    describe('on searching for all scores greater than 10', function () {
      it('should return only those 2 with score 24', function () {
        var result = this.ranking.find({ score: { $gte: 10 }, $limit: 10 });
        expect(result).to.eql([
          { position: 1, score: 24, playerId: 3 },
          { position: 2, score: 24, playerId: 4 }
        ]);
      });
    });

    describe('on searching for all scores equal to 4', function () {
      it('should return only those 2 with score 4', function () {
        var result = this.ranking.find({ score: 4, $limit: 10 });
        expect(result).to.eql([
          { position: 3, score: 4, playerId: 1 },
          { position: 4, score: 4, playerId: 2 }
        ]);
      });
    });

    describe('on searching for one score equal to 4', function () {
      it('should return only the first one with score 4', function () {
        var result = this.ranking.findOne({ score: 4 });
        expect(result).to.eql({ position: 3, score: 4, playerId: 1 });
      });
    });
  });

  describe('given 37 existing players', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 1, playerId: 1 });
      this.ranking.setScore({ score: 2, playerId: 2 });
      // this.ranking.setScore({ score: 3, playerId: '});
      this.ranking.setScore({ score: 4, playerId: 3 });
      // this.ranking.setScore({ score: 5, playerId: '});
      this.ranking.setScore({ score: 6, playerId: 4 });
      this.ranking.setScore({ score: 6, playerId: 5 });
      this.ranking.setScore({ score: 6, playerId: 6 });
      // this.ranking.setScore({ score: 7, playerId: '});
      this.ranking.setScore({ score: 8, playerId: 7 });
      this.ranking.setScore({ score: 8, playerId: 8 });
      this.ranking.setScore({ score: 9, playerId: 9 });
      this.ranking.setScore({ score: 9, playerId: 10 });
      this.ranking.setScore({ score: 10, playerId: 11 });
      this.ranking.setScore({ score: 10, playerId: 12 });
      this.ranking.setScore({ score: 10, playerId: 13 });
      // this.ranking.setScore({ score: 11, playerId: '});
      this.ranking.setScore({ score: 12, playerId: 14 });
      this.ranking.setScore({ score: 13, playerId: 15 });
      this.ranking.setScore({ score: 13, playerId: 16 });
      this.ranking.setScore({ score: 14, playerId: 17 });
      this.ranking.setScore({ score: 14, playerId: 18 });
      this.ranking.setScore({ score: 14, playerId: 19 });
      this.ranking.setScore({ score: 15, playerId: 20 });
      this.ranking.setScore({ score: 16, playerId: 21 });
      this.ranking.setScore({ score: 16, playerId: 22 });
      this.ranking.setScore({ score: 17, playerId: 23 });
      // this.ranking.setScore({ score: 18, playerId: '});
      // this.ranking.setScore({ score: 19, playerId: '});
      this.ranking.setScore({ score: 20, playerId: 24 });
      this.ranking.setScore({ score: 21, playerId: 25 });
      this.ranking.setScore({ score: 22, playerId: 26 });
      this.ranking.setScore({ score: 23, playerId: 27 });
      this.ranking.setScore({ score: 23, playerId: 28 });
      // this.ranking.setScore({ score: 24, playerId: '});
      this.ranking.setScore({ score: 25, playerId: 29 });
      this.ranking.setScore({ score: 26, playerId: 30 });
      this.ranking.setScore({ score: 27, playerId: 31 });
      this.ranking.setScore({ score: 27, playerId: 32 });
      this.ranking.setScore({ score: 27, playerId: 33 });
      this.ranking.setScore({ score: 28, playerId: 34 });
      this.ranking.setScore({ score: 28, playerId: 35 });
      this.ranking.setScore({ score: 28, playerId: 36 });
      this.ranking.setScore({ score: 28, playerId: 37 });
      // this.ranking.setScore({ score: 29, playerId: '});
      // this.ranking.setScore({ score: 30, playerId: '});
    });

    it('should be able to filter only the top 10 players', function () {
      var result = this.ranking.find({ score: { $gte: 1, $lte: 30 }, $limit: 10 });
      expect(result).to.eql([
        { position: 1, score: 28, playerId: 34 },
        { position: 2, score: 28, playerId: 35 },
        { position: 3, score: 28, playerId: 36 },
        { position: 4, score: 28, playerId: 37 },
        { position: 5, score: 27, playerId: 31 },
        { position: 6, score: 27, playerId: 32 },
        { position: 7, score: 27, playerId: 33 },
        { position: 8, score: 26, playerId: 30 },
        { position: 9, score: 25, playerId: 29 },
        { position: 10, score: 23, playerId: 27 }
      ]);
    });

    describe('on searching for one score equal to 21', function () {
      it('should return only the rank with score 21', function () {
        var result = this.ranking.findOne({ score: 21 });
        expect(result).to.eql({ position: 13, score: 21, playerId: 25 });
      });
    });
  });
});
